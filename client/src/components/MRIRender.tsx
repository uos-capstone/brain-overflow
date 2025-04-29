import { mat4 } from 'gl-matrix';

const volumeShaderCode = `
struct Uniforms {
  invAffine : mat4x4<f32>,
  invViewProj : mat4x4<f32>,
  volumeDims : vec3f,
};

struct VertexOut {
  @builtin(position) position : vec4<f32>,
  @location(0) rayOrigin : vec3<f32>,
  @location(1) rayDir : vec3<f32>,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var volume : texture_3d<f32>;

@vertex
fn vsMain(@builtin(vertex_index) idx : u32) -> VertexOut {
  var pos = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0)
  );

  let uv = pos[idx];
  let near = vec4<f32>(uv, 0.0, 1.0);
  let far = vec4<f32>(uv, 1.0, 1.0);

  let worldNear = (uniforms.invViewProj * near).xyz / (uniforms.invViewProj * near).w;
  let worldFar = (uniforms.invViewProj * far).xyz / (uniforms.invViewProj * far).w;

  var out : VertexOut;
  out.position = vec4<f32>(uv, 0.0, 1.0);
  out.rayOrigin = worldNear;
  out.rayDir = normalize(worldFar - worldNear);
  return out;
}

@fragment
fn fsMain(in: VertexOut) -> @location(0) vec4<f32> {
  let maxDistance = 2.0;
  let stepSize = 0.005;
  var sum = 0.0;

  for (var t = 0.0; t < maxDistance; t += stepSize) {
    let worldPos = in.rayOrigin + t * in.rayDir;
    let voxelPos4 = uniforms.invAffine * vec4f(worldPos, 1.0);
    let voxelPos = voxelPos4.xyz;

    if (all(voxelPos >= vec3f(0.0)) && all(voxelPos <= vec3f(1.0))) {
      let texCoord = voxelPos * (uniforms.volumeDims - vec3f(1.0));
      if (all(texCoord >= vec3f(0.0)) && all(texCoord <= uniforms.volumeDims - vec3f(1.0))) {
        let d = textureLoad(volume, vec3u(texCoord), 0).r;
        sum += d * 0.01;
      }
    }
  }

  return vec4f(sum, sum, sum, 1.0);
}
`;

const sliceShaderCode = `
struct Uniforms {
  volumeDims : vec3f,
  sliceAxis : f32,  // 0: xy, 1: yz, 2: zx
  center : f32,
};

struct VertexOut {
  @builtin(position) position : vec4<f32>,
  @location(0) uv : vec2<f32>,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var volume: texture_3d<f32>;

@vertex
fn vsMain(@builtin(vertex_index) idx: u32) -> VertexOut {
  var pos = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0)
  );

  var out: VertexOut;
  out.position = vec4<f32>(pos[idx], 0.0, 1.0);
  out.uv = (pos[idx] + vec2<f32>(1.0)) * 0.5; // [-1,1] to [0,1]
  return out;
}

@fragment
fn fsMain(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let dims = uniforms.volumeDims;
  var coord: vec3u;
  let center = u32(uniforms.center);

  if (uniforms.sliceAxis == 0f) {
    coord = vec3u(
      clamp(u32(floor(uv.x * dims.x)), 0u, u32(dims.x - 1.0)),
      clamp(u32(floor(uv.y * dims.y)), 0u, u32(dims.y - 1.0)),
      // u32(dims.z / 2.0)
      center
    );
  } else if (uniforms.sliceAxis == 1f) {
    coord = vec3u(
      u32(dims.x / 2.0),
      clamp(u32(floor(uv.x * dims.y)), 0u, u32(dims.y - 1.0)),
      clamp(u32(floor(uv.y * dims.z)), 0u, u32(dims.z - 1.0))
    );
  } else if (uniforms.sliceAxis == 2f) {
    coord = vec3u(
      clamp(u32(floor(uv.x * dims.x)), 0u, u32(dims.x - 1.0)),
      u32(dims.y / 2.0),
      clamp(u32(floor(uv.y * dims.z)), 0u, u32(dims.z - 1.0))
    );
  }

  let value = textureLoad(volume, coord, 0).r;
  return vec4f(value, value, value, 1.0);
}
`;

export async function main(
  canvas: HTMLCanvasElement,
  voxelData: Float32Array,
  dims: [number, number, number],
  affine: Float32Array,
  device: GPUDevice,
  sliceCenters: [number, number, number],
) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;

  // console.log(voxelData);

  const context = canvas.getContext("webgpu") as GPUCanvasContext;
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format, alphaMode: 'opaque' });
  
  const texture = device.createTexture({
    size: dims,
    format: 'r32float',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    dimension: '3d',
  });

  device.queue.writeTexture(
    { texture },
    voxelData,
    { bytesPerRow: dims[0] * 4, rowsPerImage: dims[1] },
    dims
  );

  const volumeShaderModule = device.createShaderModule({ code: volumeShaderCode });
  const volumeUniformBufferSize = 64 + 64 + 16;
  const volumeUniformBuffer = device.createBuffer({
    size: volumeUniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const volumeBindGroupLayout = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { viewDimension: '3d', sampleType: 'unfilterable-float' } },
    ]
  });

  const volumePipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [volumeBindGroupLayout] }),
    vertex: { module: volumeShaderModule, entryPoint: 'vsMain' },
    fragment: { module: volumeShaderModule, entryPoint: 'fsMain', targets: [{ format }] },
    primitive: { topology: 'triangle-list' },
  });

  const volumeBindGroup = device.createBindGroup({
    layout: volumeBindGroupLayout,
    entries: [
      { binding: 0, resource: { buffer: volumeUniformBuffer } },
      { binding: 1, resource: texture.createView() },
    ],
  });

  let cameraTheta = Math.PI / 2;
  let cameraPhi = Math.PI / 2;
  let cameraRadius = 2.5;
  let cameraTarget = new Float32Array([0.5, 0.5, 0.5]);
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  canvas.addEventListener('mousedown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });
  canvas.addEventListener('mouseup', () => dragging = false);
  canvas.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    cameraTheta -= dx * 0.005;
    cameraPhi -= dy * 0.005;
    cameraPhi = Math.max(0.05, Math.min(Math.PI - 0.05, cameraPhi));
  });
  canvas.addEventListener('wheel', (e) => {
    if (canvas.matches(':hover')) {
      e.preventDefault();
      cameraRadius *= 1 + e.deltaY * 0.001;
      cameraRadius = Math.max(0.5, Math.min(10.0, cameraRadius));
    }
  }, { passive: false });

  const sliceShaderModule = device.createShaderModule({ code: sliceShaderCode });

  const sliceUniformBuffers: GPUBuffer[] = [];

  const sliceBindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: { type: 'uniform' }
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        texture: { sampleType: 'unfilterable-float', viewDimension: '3d' }
      }
    ]
  });

  const sliceBindGroups: GPUBindGroup[] = [];
  for (let i = 0; i < 3; i++) {
    const buffer = device.createBuffer({
      size: 4 * 8,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const bindGroup = device.createBindGroup({
      layout: sliceBindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer } },
        { binding: 1, resource: texture.createView() },
      ]
    });
    sliceUniformBuffers.push(buffer);
    sliceBindGroups.push(bindGroup);
  }

  const slicePipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [sliceBindGroupLayout] }),
    vertex: { module: sliceShaderModule, entryPoint: 'vsMain' },
    fragment: { module: sliceShaderModule, entryPoint: 'fsMain', targets: [{ format }] },
    primitive: { topology: 'triangle-list' },
  });

  function render() {
    const aspect = canvas.width / canvas.height;
    const proj = mat4.perspective(mat4.create(), Math.PI / 4, aspect, 0.1, 100);

    const cx = cameraTarget[0] + cameraRadius * Math.sin(cameraPhi) * Math.cos(cameraTheta);
    const cy = cameraTarget[1] + cameraRadius * Math.cos(cameraPhi);
    const cz = cameraTarget[2] + cameraRadius * Math.sin(cameraPhi) * Math.sin(cameraTheta);
    const eye = new Float32Array([cx, cy, cz]);

    const view = mat4.lookAt(mat4.create(), eye, cameraTarget, [0, 1, 0]);
    const viewProj = mat4.multiply(mat4.create(), proj, view);
    const invViewProj = mat4.invert(mat4.create(), viewProj);
    const invAffine = mat4.invert(mat4.create(), affine);

    const uniformData = new Float32Array(volumeUniformBufferSize / 4);
    uniformData.set(invAffine, 0);
    uniformData.set(invViewProj, 16);
    uniformData.set(dims, 32);
    device.queue.writeBuffer(volumeUniformBuffer, 0, uniformData.buffer);

    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
      }]
    });

    pass.setPipeline(volumePipeline);
    pass.setBindGroup(0, volumeBindGroup);

    // pass.setViewport(0, 0, canvas.width/3, canvas.height, 0, 1);
    // pass.draw(6, 1, 0, 0);
    pass.setViewport(canvas.width/3, 0, canvas.width/3, canvas.height, 0, 1);
    pass.draw(6, 1, 0, 0);

    const sliceUniformData = [
      new Float32Array([dims[0], dims[1], dims[2], 0, 100]),
      new Float32Array([dims[0], dims[1], dims[2], 1, 50]),
      new Float32Array([dims[0], dims[1], dims[2], 2, 80]),
    ];
    
    for (let i = 0; i < 3; i++) {
      device.queue.writeBuffer(sliceUniformBuffers[i], 0, sliceUniformData[i].buffer);

      pass.setPipeline(slicePipeline);
      pass.setBindGroup(0, sliceBindGroups[i]);
    
      pass.setViewport(canvas.width/3*2, (canvas.height/3) * i, canvas.width/3, canvas.height/3, 0, 1);
      pass.draw(6, 1, 0, 0);
    }
    
    pass.end();

    device.queue.submit([encoder.finish()]);
    requestAnimationFrame(render);
  }

  render();
}