import { mat4 } from 'gl-matrix';

const shaderCode = `
struct Uniforms {
  invAffine : mat4x4<f32>,
  invViewProj : mat4x4<f32>,
  volumeDims : vec3f,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var volume : texture_3d<f32>;

struct VertexOut {
  @builtin(position) position : vec4<f32>,
  @location(0) rayOrigin : vec3<f32>,
  @location(1) rayDir : vec3<f32>,
};

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

export async function main(
  canvas: HTMLCanvasElement,
  voxelData: Float32Array,
  dims: [number, number, number],
  affine: Float32Array,
  device: GPUDevice,
) {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  console.log(voxelData);

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

  const shaderModule = device.createShaderModule({ code: shaderCode });
  const uniformBufferSize = 64 + 64 + 16;
  const uniformBuffer = device.createBuffer({
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { viewDimension: '3d', sampleType: 'unfilterable-float' } },
    ]
  });

  const pipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
    vertex: { module: shaderModule, entryPoint: 'vsMain' },
    fragment: { module: shaderModule, entryPoint: 'fsMain', targets: [{ format }] },
    primitive: { topology: 'triangle-list' },
  });

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer } },
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

    const uniformData = new Float32Array(uniformBufferSize / 4);
    uniformData.set(invAffine, 0);
    uniformData.set(invViewProj, 16);
    uniformData.set(dims, 32);
    device.queue.writeBuffer(uniformBuffer, 0, uniformData.buffer);

    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
      }]
    });

    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.draw(6, 1, 0, 0);
    pass.end();
    device.queue.submit([encoder.finish()]);
    requestAnimationFrame(render);
  }

  render();
}