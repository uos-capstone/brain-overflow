//@ts-ignore
import { surfaceNets } from 'isosurface';
import { mat4, vec3 } from 'gl-matrix';

function gaussianBlur3D(
  data: Float32Array,
  dims: [number, number, number],
  kernelSize = 3,
  sigma = 1.0
): Float32Array {
  const [width, height, depth] = dims;
  const radius = Math.floor(kernelSize / 2);
  const output = new Float32Array(data.length);

  const kernel = [];
  let kernelSum = 0;

  for (let z = -radius; z <= radius; z++) {
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        const weight =
          Math.exp(-(x * x + y * y + z * z) / (2 * sigma * sigma));
        kernel.push(weight);
        kernelSum += weight;
      }
    }
  }

  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= kernelSum;
  }

  const get = (x: number, y: number, z: number): number => {
    if (
      x < 0 || x >= width ||
      y < 0 || y >= height ||
      z < 0 || z >= depth
    ) return 0;
    return data[x + y * width + z * width * height];
  };

  for (let z = 0; z < depth; z++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let index = 0;

        for (let dz = -radius; dz <= radius; dz++) {
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const val = get(x + dx, y + dy, z + dz);
              sum += val * kernel[index++];
            }
          }
        }

        output[x + y * width + z * width * height] = sum;
      }
    }
  }

  return output;
}

function filterLargestComponent(mesh: { positions: number[][], cells: number[][] }) {
  const vertexCount = mesh.positions.length;
  const adjList: number[][] = Array.from({ length: vertexCount }, () => []);

  for (const [a, b, c] of mesh.cells) {
    adjList[a].push(b, c);
    adjList[b].push(a, c);
    adjList[c].push(a, b);
  }

  const visited = new Array(vertexCount).fill(false);
  const components: number[][] = [];

  for (let i = 0; i < vertexCount; i++) {
    if (visited[i]) continue;
    const stack = [i];
    const comp = [];

    while (stack.length > 0) {
      const v = stack.pop()!;
      if (visited[v]) continue;
      visited[v] = true;
      comp.push(v);
      for (const neighbor of adjList[v]) {
        if (!visited[neighbor]) stack.push(neighbor);
      }
    }

    components.push(comp);
  }

  const largest = components.reduce((a, b) => (a.length > b.length ? a : b));
  const keepSet = new Set(largest);

  const newCells = mesh.cells.filter(([a, b, c]) =>
    keepSet.has(a) && keepSet.has(b) && keepSet.has(c)
  );

  const indexMap = new Map<number, number>();
  const newPositions: number[][] = [];
  let newIndex = 0;

  for (const idx of keepSet) {
    indexMap.set(idx, newIndex++);
    newPositions.push(mesh.positions[idx]);
  }

  const remappedCells = newCells.map(([a, b, c]) => [
    indexMap.get(a)!,
    indexMap.get(b)!,
    indexMap.get(c)!,
  ]);

  return {
    positions: newPositions,
    cells: remappedCells,
  };
}

export class SurfaceRenderer {
  private device: GPUDevice;
  private vertexBuffer: GPUBuffer;
  private indexBuffer: GPUBuffer;
  private indexCount: number;
  private pipeline: GPURenderPipeline;
  private uniformBuffer: GPUBuffer;
  private bindGroup: GPUBindGroup;
  private dims: [number, number, number];
  private canvas: HTMLCanvasElement

  constructor(
    device: GPUDevice,
    voxelData: Float32Array,
    dims: [number, number, number],
    canvas: HTMLCanvasElement
  ) {
    this.device = device;
    this.dims = dims;
    this.canvas = canvas;

    const [width, height, depth]: [number, number, number] = dims;

    const isovalues = 0.35;

    const blurredVoxelData = gaussianBlur3D(voxelData, dims, 3, 1.2);

    const mesh = surfaceNets([width, height, depth], (x:number, y:number, z:number) => {
      const index = x + y * width + z * width * height;
      return blurredVoxelData[index] - isovalues;
    });

    const cleanedMesh = filterLargestComponent(mesh);

    const vertices = new Float32Array(cleanedMesh.positions.flat());
    const indices = new Uint32Array(cleanedMesh.cells.flat());
    this.indexCount = indices.length;

    this.vertexBuffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(this.vertexBuffer.getMappedRange()).set(vertices);
    this.vertexBuffer.unmap();

    this.indexBuffer = this.device.createBuffer({
      size: indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Uint32Array(this.indexBuffer.getMappedRange()).set(indices);
    this.indexBuffer.unmap();

    this.uniformBuffer = this.device.createBuffer({
      size: 64 + 16 + 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const format: GPUTextureFormat = navigator.gpu.getPreferredCanvasFormat();
    const shaderModule: GPUShaderModule = this.device.createShaderModule({
      code: `
        struct Uniforms {
          mvp : mat4x4<f32>,
          volumeDims : vec3f,
          cameraPos: vec3f,
        };
        @binding(0) @group(0) var<uniform> uniforms : Uniforms;

        struct VertexOut {
          @builtin(position) Position : vec4<f32>,
          @location(0) vPos : vec3<f32>,
          @location(1) worldPos: vec3<f32>,
        };

        @vertex
        fn vsMain(@location(0) pos: vec3<f32>) -> VertexOut {
          var output : VertexOut;
          let normalized = pos / uniforms.volumeDims;
          output.Position = uniforms.mvp * vec4<f32>(normalized, 1.0);
          output.vPos = pos;
          output.worldPos  = normalized;
          return output;
        }

        @fragment
        fn fsMain(in: VertexOut) -> @location(0) vec4<f32> {
          // let lightDir = normalize(vec3<f32>(0.5, 0.7, 1.0));
          let rawNormal = normalize(cross(dpdx(in.vPos), dpdy(in.vPos)));
          let viewDir = normalize(uniforms.cameraPos - in.worldPos);
          let lightDir = viewDir;

          let normal = select(rawNormal, -rawNormal, dot(rawNormal, viewDir) < 0.0);

          let ambient = 0.2;
          let diff = max(dot(normal, lightDir), 0.0);
          let reflectDir = reflect(-lightDir, normal);
          let spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);

          let baseColor = vec3<f32>(0.6, 0.6, 1.0);
          let lighting = ambient + 0.7 * diff + 0.5 * spec;
          return vec4(baseColor * lighting, 1.0);
        }
      `
    });

    this.pipeline = this.device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: shaderModule,
        entryPoint: 'vsMain',
        buffers: [{
          arrayStride: 12,
          attributes: [
            { shaderLocation: 0, format: 'float32x3', offset: 0 },
          ],
        }],
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fsMain',
        targets: [{ format }],
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'none',
        // frontFace: 'ccw',
      },
    });

    this.bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: this.uniformBuffer },
        },
      ],
    });
  }

  update(mvp: mat4, eye: vec3): void {
    const uniformData = new Float32Array(64/4 + 16/4 + 16/4);
    uniformData.set(Float32Array.from(mvp), 0);
    uniformData.set(this.dims, 16);
    uniformData.set(eye, 20);
    this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);
  }

  draw(pass: GPURenderPassEncoder): void {
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setIndexBuffer(this.indexBuffer, 'uint32');
    pass.setViewport(0, 0, this.canvas.width/3*2, this.canvas.height, 0, 1);
    pass.drawIndexed(this.indexCount, 1, 0, 0, 0);
  }
}