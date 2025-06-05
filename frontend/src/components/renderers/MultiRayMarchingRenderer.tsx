import { mat4 } from "gl-matrix";

const volumeShaderCode = /*wgsl*/ `
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

struct TFParams {
  dMin1: f32,
  dMax1: f32,
  dMin2: f32,
  dMax2: f32,
  alpha1: f32,
  alpha2: f32,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var volume : texture_3d<f32>;
@group(0) @binding(2) var volumeSampler : sampler;
@group(0) @binding(3) var<uniform> tf : TFParams;

fn transferFunction(d: f32) -> vec4<f32> {
  var color = vec3f(0.0);
  var alpha = 0.0;

  if (d > tf.dMin1 && d < tf.dMax1) {
    color = vec3f(0.2, 0.6, 1.0);
    alpha = tf.alpha1;
  } else if (d > tf.dMin2 && d < tf.dMax2) {
    color = vec3f(1.0, 0.8, 0.2);
    alpha = tf.alpha2;
  }

  return vec4f(color, alpha);
}

@vertex
fn vsMain(@builtin(vertex_index) idx : u32) -> VertexOut {
  var pos = array<vec2<f32>, 6>(
    vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(-1.0, 1.0),
    vec2f(-1.0, 1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0)
  );

  let uv = pos[idx];
  let near = vec4f(uv, 0.0, 1.0);
  let far = vec4f(uv, 1.0, 1.0);

  let worldNear = (uniforms.invViewProj * near).xyz / (uniforms.invViewProj * near).w;
  let worldFar = (uniforms.invViewProj * far).xyz / (uniforms.invViewProj * far).w;

  var out: VertexOut;
  out.position = vec4f(uv, 0.0, 1.0);
  out.rayOrigin = worldNear;
  out.rayDir = normalize(worldFar - worldNear);
  return out;
}

@fragment
fn fsMain(in: VertexOut) -> @location(0) vec4<f32> {
  let maxDistance = 2.0;
  let stepSize = 1.0 / 128.0;
  var t = 0.0;
  var accum = vec4f(0.0);

  let lightDir = normalize(vec3f(1.0, 1.0, 1.0));
  let viewDir = normalize(-in.rayDir);

  loop {
    if (t >= maxDistance || accum.a >= 1.0) {
      break;
    }

    let worldPos = in.rayOrigin + t * in.rayDir;
    let voxelPos = (uniforms.invAffine * vec4f(worldPos, 1.0)).xyz;

    if (all(voxelPos >= vec3f(0.01)) && all(voxelPos <= vec3f(0.99))) {
      let texCoord = voxelPos;
      let d = textureSampleLevel(volume, volumeSampler, texCoord, 0.0).r;

      let eps = vec3f(1.0) / uniforms.volumeDims;
      let dx = textureSampleLevel(volume, volumeSampler, texCoord + vec3f(eps.x, 0.0, 0.0), 0.0).r -
               textureSampleLevel(volume, volumeSampler, texCoord - vec3f(eps.x, 0.0, 0.0), 0.0).r;
      let dy = textureSampleLevel(volume, volumeSampler, texCoord + vec3f(0.0, eps.y, 0.0), 0.0).r -
               textureSampleLevel(volume, volumeSampler, texCoord - vec3f(0.0, eps.y, 0.0), 0.0).r;
      let dz = textureSampleLevel(volume, volumeSampler, texCoord + vec3f(0.0, 0.0, eps.z), 0.0).r -
               textureSampleLevel(volume, volumeSampler, texCoord - vec3f(0.0, 0.0, eps.z), 0.0).r;
      let normal = normalize(vec3f(dx, dy, dz));

      var sample = transferFunction(d);

      // let lambert = max(dot(normal, lightDir), 0.0);
      // let halfVec = normalize(lightDir + viewDir);
      // // let specular = pow(max(dot(normal, halfVec), 0.0), 128.0);
      // let lighting = 0.8 + 2.0 * lambert + 10.0 * specular;

      // sample = vec4f(sample.rgb * lighting, sample.a);

      sample = vec4f(sample.rgb, sample.a);

      let oneMinusAlpha = 1.0 - accum.a;
      accum = vec4f(
        accum.rgb + sample.rgb * sample.a * oneMinusAlpha,
        accum.a + sample.a * oneMinusAlpha
      );
    }

    t += stepSize;
  }

  return vec4f(accum.rgb * 10, 1.0);
}

`;

export class MultiRayMarchingRenderer {
  private device: GPUDevice;
  private pipeline: GPURenderPipeline;
  private bindGroup: GPUBindGroup;
  private uniformBuffer: GPUBuffer;
  private textureView: GPUTextureView;
  private dims: [number, number, number];
  private canvas: HTMLCanvasElement;

  constructor(
    device: GPUDevice,
    volumeTexture: GPUTexture,
    dims: [number, number, number],
    canvas: HTMLCanvasElement,
    tfParamBuffer: GPUBuffer
  ) {
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
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: {},
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { viewDimension: "3d", sampleType: "float" },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: "filtering" },
        },
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: {} },
      ],
    });

    const sampler = device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
      addressModeU: "clamp-to-edge",
      addressModeV: "clamp-to-edge",
      addressModeW: "clamp-to-edge",
    });

    this.pipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout],
      }),
      vertex: { module: shaderModule, entryPoint: "vsMain" },
      fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }],
      },
      primitive: { topology: "triangle-list" },
    });

    this.bindGroup = device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer } },
        { binding: 1, resource: this.textureView },
        { binding: 2, resource: sampler },
        { binding: 3, resource: { buffer: tfParamBuffer } },
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
    pass.setViewport(
      0,
      0,
      (this.canvas.width / 3) * 2,
      this.canvas.height,
      0,
      1
    );
    pass.draw(6, 1, 0, 0);
  }
}
