import React, { useEffect, useRef } from "react";
import { ChatMessageData } from "../util/api";
import * as nifti from "nifti-reader-js";
import { getGPUDevice } from "../components/GPUDevice";

interface MRIMessageProps {
  chat: ChatMessageData;
  onClick: (content: string) => void;
}

export const MRIMessage: React.FC<MRIMessageProps> = ({ chat, onClick }) => {
  const payload = chat.content.replace(/^<MRI>\s*/, "").replace(/\.nii$/, "");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const fetchAndRender = async () => {
      const mriId = payload;

      // 1. 파일 정보 먼저 받아오기
      const metaRes = await fetch(
        `https://api-brain-overflow.unknownpgr.com/mri/${mriId}`
      );
      if (!metaRes.ok) {
        // alert(`Failed to get MRI metadata: ${metaRes.status}`);
        return;
      }
      const metaJson = await metaRes.json();
      const filePath = metaJson.data?.filePath;

      if (!filePath) {
        // alert("No filePath found in MRI metadata");
        return;
      }

      // 2. 파일 경로로 다시 fetch
      const fileRes = await fetch(
        `https://api-brain-overflow.unknownpgr.com/uploads/${filePath}`
      );
      if (!fileRes.ok) {
        // alert(`Failed to fetch MRI file at ${filePath}`);
        return;
      }

      const arrayBuffer = await fileRes.arrayBuffer();

      if (!nifti.isCompressed(arrayBuffer) && nifti.isNIFTI(arrayBuffer)) {
        const header = nifti.readHeader(arrayBuffer);
        const dims: [number, number, number] = [
          header.dims[1],
          header.dims[2],
          header.dims[3],
        ];
        const imageData = nifti.readImage(header, arrayBuffer);

        let raw: any;
        switch (header.datatypeCode) {
          case 2:
            raw = new Uint8Array(imageData);
            break;
          case 4:
            raw = new Int16Array(imageData);
            break;
          case 8:
            raw = new Int32Array(imageData);
            break;
          case 16:
            raw = new Float32Array(imageData);
            break;
          case 64:
            raw = new Float64Array(imageData);
            break;
          case 256:
            raw = new Int8Array(imageData);
            break;
          case 512:
            raw = new Uint16Array(imageData);
            break;
          case 768:
            raw = new Uint32Array(imageData);
            break;
          default:
            alert(`Unsupported or unknown datatype: ${header.datatypeCode}`);
            return;
        }

        let min = Infinity;
        let max = -Infinity;
        for (let i = 0; i < raw.length; i++) {
          if (raw[i] < min) min = raw[i];
          if (raw[i] > max) max = raw[i];
        }

        const voxel = new Float32Array(raw.length);
        for (let i = 0; i < raw.length; i++) {
          voxel[i] = (raw[i] - min) / (max - min);
        }

        const device = await getGPUDevice();

        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const context = canvas.getContext("webgpu") as GPUCanvasContext;
          const format = navigator.gpu.getPreferredCanvasFormat();

          // const dpr = window.devicePixelRatio || 1;
          // canvas.width = canvas.clientWidth * dpr;
          // canvas.height = canvas.clientHeight * dpr;
          // canvas.style.width = `${canvas.clientWidth}px`;
          // canvas.style.height = `${canvas.clientHeight}px`;

          context.configure({ device, format, alphaMode: "opaque" });

          const texture = device.createTexture({
            size: dims,
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
            dimension: "3d",
          });

          const rgba = new Uint8Array(voxel.length * 4);
          for (let i = 0; i < voxel.length; i++) {
            const v = Math.min(Math.max(voxel[i], 0), 1);
            const byte = Math.floor(v * 255);
            rgba.set([byte, byte, byte, 255], i * 4);
          }

          device.queue.writeTexture(
            { texture },
            rgba,
            {
              bytesPerRow: dims[0] * 4,
              rowsPerImage: dims[1],
            },
            dims
          );

          const sliceShaderModule = device.createShaderModule({
            code: `
struct Uniforms {
  volumeDims : vec3f,  // 12 bytes
  sliceAxis : f32,     // +4 = 16 bytes
  center : f32,        // +4 = 20
  pad1 : f32,          // +4 = 24
  pad2 : f32,          // +4 = 28
  pad3 : f32           // +4 = 32 ✅ OK!
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
  out.uv = (pos[idx] + vec2<f32>(1.0)) * 0.5;
  return out;
}

@fragment
fn fsMain(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let dims = uniforms.volumeDims;
  var coord: vec3u;
  let center = u32(uniforms.center);
  coord = vec3u(
    clamp(u32(floor(uv.x * dims.x)), 0u, u32(dims.x - 1.0)),
    clamp(u32(floor(uv.y * dims.y)), 0u, u32(dims.y - 1.0)),
    center
  );
  let value = textureLoad(volume, coord, 0).r;
  return vec4f(value, value, value, 1.0);
}
            `,
          });

          const uniformBuffer = device.createBuffer({
            size: 4 * 8,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
          });

          const bindGroupLayout = device.createBindGroupLayout({
            entries: [
              {
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: { type: "uniform" },
              },
              {
                binding: 1,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                  sampleType: "unfilterable-float",
                  viewDimension: "3d",
                },
              },
            ],
          });

          const pipeline = device.createRenderPipeline({
            layout: device.createPipelineLayout({
              bindGroupLayouts: [bindGroupLayout],
            }),
            vertex: { module: sliceShaderModule, entryPoint: "vsMain" },
            fragment: {
              module: sliceShaderModule,
              entryPoint: "fsMain",
              targets: [{ format }],
            },
            primitive: { topology: "triangle-list" },
          });

          const bindGroup = device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
              { binding: 0, resource: { buffer: uniformBuffer } },
              { binding: 1, resource: texture.createView() },
            ],
          });

          const uniformData = new Float32Array([
            dims[0],
            dims[1],
            dims[2],
            0, // volumeDims + sliceAxis
            dims[2] / 2,
            0,
            0,
            0, // center + padding
          ]);
          device.queue.writeBuffer(uniformBuffer, 0, uniformData.buffer);

          const encoder = device.createCommandEncoder();
          const pass = encoder.beginRenderPass({
            colorAttachments: [
              {
                view: context.getCurrentTexture().createView(),
                loadOp: "clear",
                storeOp: "store",
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
              },
            ],
          });

          pass.setPipeline(pipeline);
          pass.setBindGroup(0, bindGroup);
          pass.draw(6, 1, 0, 0);
          pass.end();
          device.queue.submit([encoder.finish()]);
        }
      }
    };

    fetchAndRender();
  }, [payload]);

  const handleClick = () => {
    onClick(chat.content);
  };

  return (
    <div
      style={{
        padding: "8px",
        background: "#f0f8ff",
        borderRadius: "4px",
        margin: "4px 0",
        border: "1px solid #a0c4ff",
        cursor: "pointer",
      }}
      onClick={handleClick}
    >
      <div
        style={{
          fontSize: "0.85rem",
          fontWeight: 600,
          color: "#333",
          marginBottom: "4px",
        }}
      >
        {chat.senderName}
      </div>

      <div style={{ fontSize: "1rem", color: "#000" }}>🧠 {payload}</div>

      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{ marginTop: "8px", backgroundColor: "black", width: "100%" }}
      />

      <div
        style={{
          fontSize: "0.75rem",
          color: "#666",
          textAlign: "right",
          marginTop: "6px",
        }}
      >
        {chat.timestamp}
      </div>
    </div>
  );
};
