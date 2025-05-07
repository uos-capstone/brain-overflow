import { mat4 } from 'gl-matrix';

const sliceBoxRingShaderCode = `
struct Uniforms {
  mvp : mat4x4<f32>,
};

struct VertexOut {
  @builtin(position) position : vec4<f32>,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var<uniform> color : vec4<f32>;

@vertex
fn vsMain(@location(0) inPos : vec3<f32>) -> VertexOut {
  var out : VertexOut;
  out.position = uniforms.mvp * vec4f(inPos, 1.0);
  return out;
}

@fragment
fn fsMain() -> @location(0) vec4<f32> {
  return color;
}
`;

function createRingVertices(plane: 'xy' | 'yz' | 'zx', index: number, dims: [number, number, number]): Float32Array {
  const [dx, dy, dz] = dims.map(v => v - 1);
  let v: [number, number, number][] = [];

  if (plane === 'xy') {
    const z = index / dz;
    v = [
      [0, 0, z], [1, 0, z],
      [1, 0, z], [1, 1, z],
      [1, 1, z], [0, 1, z],
      [0, 1, z], [0, 0, z],
    ];
  } else if (plane === 'yz') {
    const x = index / dx;
    v = [
      [x, 0, 0], [x, 1, 0],
      [x, 1, 0], [x, 1, 1],
      [x, 1, 1], [x, 0, 1],
      [x, 0, 1], [x, 0, 0],
    ];
  } else {
    const y = index / dy;
    v = [
      [0, y, 0], [1, y, 0],
      [1, y, 0], [1, y, 1],
      [1, y, 1], [0, y, 1],
      [0, y, 1], [0, y, 0],
    ];
  }

  return new Float32Array(v.flat());
}

export class BoxRingRenderer {
  private device: GPUDevice;
  private dims: [number, number, number];
  private pipeline: GPURenderPipeline;
  private vertexBuffers: GPUBuffer[];
  private uniformBuffers: GPUBuffer[];
  private colorBuffers: GPUBuffer[];
  private bindGroups: GPUBindGroup[];
  private colors: Float32Array[];
  private canvas: HTMLCanvasElement;

  constructor(device: GPUDevice, dims: [number, number, number], canvas: HTMLCanvasElement) {
    this.device = device;
    this.dims = dims;
    this.canvas = canvas;

    const shaderModule = device.createShaderModule({ code: sliceBoxRingShaderCode });

    this.pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: shaderModule,
        entryPoint: 'vsMain',
        buffers: [{ arrayStride: 12, attributes: [{ format: 'float32x3', offset: 0, shaderLocation: 0 }] }]
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fsMain',
        targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }],
      },
      primitive: { topology: 'line-list' },
    });

    this.colors = [
      new Float32Array([1, 0, 0, 1]),
      new Float32Array([0, 1, 0, 1]),
      new Float32Array([0, 0.6, 1, 1]),
    ];

    this.vertexBuffers = [];
    this.uniformBuffers = [];
    this.colorBuffers = [];
    this.bindGroups = [];

    for (let i = 0; i < 3; i++) {
      this.vertexBuffers.push(device.createBuffer({
        size: 8 * 3 * 4,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      }));

      this.uniformBuffers.push(device.createBuffer({
        size: 64,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      }));

      const colorBuffer = device.createBuffer({
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      device.queue.writeBuffer(colorBuffer, 0, this.colors[i].buffer);
      this.colorBuffers.push(colorBuffer);

      const bindGroup = device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: this.uniformBuffers[i] } },
          { binding: 1, resource: { buffer: this.colorBuffers[i] } },
        ],
      });
      this.bindGroups.push(bindGroup);
    }
  }

  update(sliceCenters: [number, number, number], mvp: mat4) {
    for (let i = 0; i < 3; i++) {
      const plane = i === 0 ? 'xy' : i === 1 ? 'yz' : 'zx';
      const verts = createRingVertices(plane, sliceCenters[i], this.dims);
      this.device.queue.writeBuffer(this.vertexBuffers[i], 0, verts.buffer);
      this.device.queue.writeBuffer(this.uniformBuffers[i], 0, Float32Array.from(mvp));
    }
  }

  draw(pass: GPURenderPassEncoder) {
    for (let i = 0; i < 3; i++) {
      pass.setPipeline(this.pipeline);
      pass.setBindGroup(0, this.bindGroups[i]);
      pass.setVertexBuffer(0, this.vertexBuffers[i]);
      pass.setViewport(0, 0, this.canvas.width/3*2, this.canvas.height, 0, 1);
      pass.draw(8, 1, 0, 0); // 8 vertices = 4 lines
    }
  }
}