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
      center
    );
  } else if (uniforms.sliceAxis == 1f) {
    coord = vec3u(
      center,
      clamp(u32(floor(uv.x * dims.y)), 0u, u32(dims.y - 1.0)),
      clamp(u32(floor(uv.y * dims.z)), 0u, u32(dims.z - 1.0))
    );
  } else if (uniforms.sliceAxis == 2f) {
    coord = vec3u(
      clamp(u32(floor(uv.x * dims.x)), 0u, u32(dims.x - 1.0)),
      center,
      clamp(u32(floor(uv.y * dims.z)), 0u, u32(dims.z - 1.0))
    );
  }

  let value = textureLoad(volume, coord, 0).r;
  return vec4f(value, value, value, 1.0);
}
`;

export class SliceRenderer {
  private device: GPUDevice;
  private canvas: HTMLCanvasElement;
  private pipeline: GPURenderPipeline;
  private uniformBuffers: GPUBuffer[];
  private bindGroups: GPUBindGroup[];
  private dims: [number, number, number];

  constructor(device: GPUDevice, volumeTexture: GPUTexture, dims: [number, number, number], canvas: HTMLCanvasElement) {
    this.device = device;
    this.canvas = canvas;
    this.dims = dims;

    const shaderModule = device.createShaderModule({ code: sliceShaderCode });

    const sliceBindGroupLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '3d' } }
      ],
    });

    this.pipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [sliceBindGroupLayout] }),
      vertex: { module: shaderModule, entryPoint: 'vsMain' },
      fragment: { module: shaderModule, entryPoint: 'fsMain', targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }] },
      primitive: { topology: 'triangle-list' },
    });

    this.uniformBuffers = [];
    this.bindGroups = [];

    for (let i = 0; i < 3; i++) {
      const uniformBuffer = device.createBuffer({
        size: 4 * 8, // vec3 + f32 + f32 + padding
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      const bindGroup = device.createBindGroup({
        layout: sliceBindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: uniformBuffer } },
          { binding: 1, resource: volumeTexture.createView() },
        ],
      });

      this.uniformBuffers.push(uniformBuffer);
      this.bindGroups.push(bindGroup);
    }
  }

  update(sliceCenters: [number, number, number]) {
    for (let i = 0; i < 3; i++) {
      const data = new Float32Array([
        this.dims[0], this.dims[1], this.dims[2], i, // dims + axis
        sliceCenters[i], 0, 0, 0                    // center + padding
      ]);
      this.device.queue.writeBuffer(this.uniformBuffers[i], 0, data.buffer);
    }
  }

  draw(pass: GPURenderPassEncoder) {
    for (let i = 0; i < 3; i++) {
      pass.setPipeline(this.pipeline);
      pass.setBindGroup(0, this.bindGroups[i]);
      pass.setViewport(
        (this.canvas.width / 3) * 2,
        (this.canvas.height / 3) * i,
        this.canvas.width / 3,
        this.canvas.height / 3,
        0,
        1
      );
      pass.draw(6, 1, 0, 0);
    }
  }
}