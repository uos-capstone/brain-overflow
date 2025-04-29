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
  let baseStepSize = 0.02;
  var sum = 0.0;
  var t = 0.0;

  loop {
    if (t >= maxDistance) {
      break;
    }

    let worldPos = in.rayOrigin + t * in.rayDir;
    let voxelPos4 = uniforms.invAffine * vec4f(worldPos, 1.0);
    let voxelPos = voxelPos4.xyz;

    if (all(voxelPos >= vec3f(0.0)) && all(voxelPos <= vec3f(1.0))) {
      let texCoord = voxelPos * (uniforms.volumeDims - vec3f(1.0));
      if (all(texCoord >= vec3f(0.0)) && all(texCoord <= uniforms.volumeDims - vec3f(1.0))) {
        let d = textureLoad(volume, vec3u(texCoord), 0).r;

        sum += d * 0.05;

        if (sum >= 1.0) {
          break;
        }

        let adaptiveStep = baseStepSize * mix(0.5, 1.5, clamp(d, 0.0, 1.0));
        t += adaptiveStep;
        continue;
      }
    }

    t += baseStepSize;
  }

  return vec4f(sum, sum, sum, 1.0);
}
`;

export class VolumeRenderer {
  private device: GPUDevice;
  private pipeline: GPURenderPipeline;
  private bindGroup: GPUBindGroup;
  private uniformBuffer: GPUBuffer;
  private textureView: GPUTextureView;
  private dims: [number, number, number];
  private canvas: HTMLCanvasElement;

  constructor(device: GPUDevice, volumeTexture: GPUTexture, dims: [number, number, number], canvas: HTMLCanvasElement) {
    this.device = device;
    this.dims = dims;
    this.textureView = volumeTexture.createView();
    this.canvas = canvas;

    const shaderModule = device.createShaderModule({ code: volumeShaderCode });

    const uniformBufferSize = 64 + 64 + 16;
    this.uniformBuffer = device.createBuffer({
      size: uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const bindGroupLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { viewDimension: '3d', sampleType: 'unfilterable-float' } },
      ],
    });

    this.pipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
      vertex: { module: shaderModule, entryPoint: 'vsMain' },
      fragment: { module: shaderModule, entryPoint: 'fsMain', targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }] },
      primitive: { topology: 'triangle-list' },
    });

    this.bindGroup = device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer } },
        { binding: 1, resource: this.textureView },
      ],
    });
  }

  update(invViewProj: mat4, invAffine: mat4) {
    const uniformData = new Float32Array(64 / 4 + 64 / 4 + 16 / 4);
    uniformData.set(invAffine, 0);
    uniformData.set(invViewProj, 16);
    uniformData.set(this.dims, 32);
    this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);
  }

  draw(pass: GPURenderPassEncoder) {
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setViewport(0, 0, this.canvas.width/3*2, this.canvas.height, 0, 1);
    pass.draw(6, 1, 0, 0);
  }
}