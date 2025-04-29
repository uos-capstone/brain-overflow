const gizmoShaderCode = `
struct VertexOut {
  @builtin(position) position : vec4<f32>,
  @location(0) color : vec3<f32>,
};

@group(0) @binding(0) var<uniform> viewRotation : mat4x4<f32>;

@vertex
fn vsMain(@location(0) pos: vec3<f32>, @location(1) color: vec3<f32>) -> VertexOut {
  let rotated = (viewRotation * vec4f(pos, 0.0)).xyz;
  let gizmoPos = vec3f(-0.75, 0.75, 0.9); // near NDC fixed point
  let finalPos = vec4f(rotated * 0.2 + gizmoPos, 1.0);

  var out: VertexOut;
  out.position = finalPos;
  out.color = color;
  return out;
}

@fragment
fn fsMain(in: VertexOut) -> @location(0) vec4f {
  return vec4f(in.color, 1.0);
}
`;

export class GizmoRenderer {
  private device: GPUDevice;
  private canvas: HTMLCanvasElement;
  private pipeline: GPURenderPipeline;
  private bindGroup: GPUBindGroup;
  private vertexBuffer: GPUBuffer;
  private uniformBuffer: GPUBuffer;

  constructor(device: GPUDevice, canvas: HTMLCanvasElement) {
    this.device = device;
    this.canvas = canvas;

    const shaderModule = device.createShaderModule({ code: gizmoShaderCode });

    const bindGroupLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {} },
      ],
    });

    this.pipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
      vertex: {
        module: shaderModule,
        entryPoint: 'vsMain',
        buffers: [{
          arrayStride: 24,
          attributes: [
            { format: 'float32x3', offset: 0, shaderLocation: 0 }, // pos
            { format: 'float32x3', offset: 12, shaderLocation: 1 }, // color
          ],
        }],
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fsMain',
        targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }],
      },
      primitive: { topology: 'line-list' },
    });

    const gizmoVertices = new Float32Array([
      // X axis (red)
      0, 0, 0, 1, 0, 0,
      1, 0, 0, 1, 0, 0,
      // Y axis (green)
      0, 0, 0, 0, 1, 0,
      0, 1, 0, 0, 1, 0,
      // Z axis (blue)
      0, 0, 0, 0, 0, 1,
      0, 0, 1, 0, 0, 1,
    ]);

    this.vertexBuffer = device.createBuffer({
      size: gizmoVertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.vertexBuffer, 0, gizmoVertices);

    this.uniformBuffer = device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.bindGroup = device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer } },
      ],
    });
  }

  update(viewMatrix: Float32Array) {
    const viewRotation = new Float32Array(16);
    viewRotation.set([
      viewMatrix[0], viewMatrix[1], viewMatrix[2], 0,
      viewMatrix[4], viewMatrix[5], viewMatrix[6], 0,
      viewMatrix[8], viewMatrix[9], viewMatrix[10], 0,
      0, 0, 0, 1,
    ]);

    this.device.queue.writeBuffer(this.uniformBuffer, 0, viewRotation);
  }

  draw(pass: GPURenderPassEncoder) {
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setViewport(0, 0, this.canvas.width / 5, this.canvas.width / 5, 0, 1);
    pass.draw(6, 1, 0, 0);
  }
}