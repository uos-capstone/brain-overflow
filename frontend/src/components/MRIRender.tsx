import { mat4, vec3, quat } from "gl-matrix";
import { SingleRayMarchingRenderer } from "./renderers/SingleRayMarchingRenderer";
import { MultiRayMarchingRenderer } from "./renderers/MultiRayMarchingRenderer";
import { MultiRayCastingRenderer } from "./renderers/MultiRayCastingRenderer";
import { MarchingCubeRenderer } from "./renderers/SurfaceRenderer";
import { BoxRingRenderer } from "./renderers/BoxRingRenderer";
import { SliceRenderer } from "./renderers/SliceRenderer";
import { GizmoRenderer } from "./renderers/GizmoRenderer";

export async function main(
  canvas: HTMLCanvasElement,
  voxelData: Float32Array,
  dims: [number, number, number],
  affine: Float32Array,
  device: GPUDevice,
  sliceCentersRef: React.RefObject<[number, number, number]>,
  tfParamRef: React.RefObject<[number, number, number, number, number, number]>,
  renderingModeRef: React.RefObject<string>
) {
  const dpr = window.devicePixelRatio || 1;

  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  canvas.width = displayWidth * dpr;
  canvas.height = displayHeight * dpr;

  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;

  const context = canvas.getContext("webgpu") as GPUCanvasContext;
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format, alphaMode: "opaque" });

  const texture = device.createTexture({
    size: dims,
    format: "rgba8unorm", // ✅ filtering 지원됨
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    dimension: "3d",
  });

  const rgba = new Uint8Array(voxelData.length * 4);
  for (let i = 0; i < voxelData.length; i++) {
    const v = Math.min(Math.max(voxelData[i], 0), 1);
    const byte = Math.floor(v * 255);
    rgba.set([byte, byte, byte, 255], i * 4);
  }

  device.queue.writeTexture(
    { texture },
    rgba,
    {
      bytesPerRow: dims[0] * 4, // 4 channels × 4 bytes (Float32)
      rowsPerImage: dims[1],
    },
    dims
  );

  const tfParamBuffer = device.createBuffer({
    size: 6 * 4, // 6 floats × 4 bytes
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  function updateTFParams() {
    if (tfParamRef.current) {
      const data = new Float32Array(tfParamRef.current);
      device.queue.writeBuffer(tfParamBuffer, 0, data);
    }
  }

  // let cameraTheta = Math.PI / 2;
  // let cameraPhi = Math.PI / 2;
  let cameraRadius = 1;
  let cameraTarget = new Float32Array([0.5, 0.5, 0.5]);
  let dragging = false;
  let cameraQuat = quat.create();
  let lastX = 0;
  let lastY = 0;

  canvas.addEventListener("mousedown", (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });
  canvas.addEventListener("mouseup", () => (dragging = false));
  canvas.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    // lastX = e.clientX;
    // lastY = e.clientY;
    // cameraTheta -= dx * 0.005;
    // cameraPhi -= dy * 0.005;
    // cameraPhi = Math.max(0.05, Math.min(Math.PI - 0.05, cameraPhi));

    const yaw = quat.setAxisAngle(quat.create(), [0, 1, 0], -dx * 0.0001);

    // 쿼터니언
    const right = vec3.transformQuat(vec3.create(), [1, 0, 0], cameraQuat);
    const pitch = quat.setAxisAngle(quat.create(), right, -dy * 0.0001);

    quat.multiply(cameraQuat, yaw, cameraQuat);
    quat.multiply(cameraQuat, pitch, cameraQuat);
  });
  canvas.addEventListener(
    "wheel",
    (e) => {
      if (canvas.matches(":hover")) {
        e.preventDefault();
        cameraRadius *= 1 + e.deltaY * 0.001;
        cameraRadius = Math.max(0.1, Math.min(10.0, cameraRadius));
      }
    },
    { passive: false }
  );

  const singleRayMarchingRenderer = new SingleRayMarchingRenderer(
    device,
    texture,
    dims,
    canvas,
    tfParamBuffer
  );
  const multiRayMarchingRenderer = new MultiRayMarchingRenderer(
    device,
    texture,
    dims,
    canvas,
    tfParamBuffer
  );
  const multiRayCastingRenderer = new MultiRayCastingRenderer(
    device,
    texture,
    dims,
    canvas,
    tfParamBuffer
  );
  const marchingCubeRenderer = new MarchingCubeRenderer(
    device,
    voxelData,
    dims,
    canvas
  );
  const sliceRenderer = new SliceRenderer(device, texture, dims, canvas);
  const boxRingRenderer = new BoxRingRenderer(device, dims, canvas);
  const gizmoRenderer = new GizmoRenderer(device, canvas);

  async function render() {
    // const aspect = canvas.width / canvas.height;
    // const proj = mat4.perspective(mat4.create(), Math.PI / 4, aspect, 0.1, 100);

    // const cx = cameraTarget[0] + cameraRadius * Math.sin(cameraPhi) * Math.cos(cameraTheta);
    // const cy = cameraTarget[1] + cameraRadius * Math.cos(cameraPhi);
    // const cz = cameraTarget[2] + cameraRadius * Math.sin(cameraPhi) * Math.sin(cameraTheta);
    // const eye = new Float32Array([cx, cy, cz]);

    // const view = mat4.lookAt(mat4.create(), eye, cameraTarget, [0, 1, 0]);
    // const viewProj = mat4.multiply(mat4.create(), proj, view);
    // const invViewProj = mat4.invert(mat4.create(), viewProj);
    // const invAffine = mat4.invert(mat4.create(), affine);

    const aspect = canvas.width / canvas.height;
    const proj = mat4.perspective(mat4.create(), Math.PI / 4, aspect, 0.1, 100);

    const forward = vec3.transformQuat(vec3.create(), [0, 0, -1], cameraQuat);
    const up = vec3.transformQuat(vec3.create(), [0, 1, 0], cameraQuat);
    const eye = vec3.scaleAndAdd(
      vec3.create(),
      cameraTarget,
      forward,
      -cameraRadius
    );

    const view = mat4.lookAt(mat4.create(), eye, cameraTarget, up);
    const viewProj = mat4.multiply(mat4.create(), proj, view);
    const invViewProj = mat4.invert(mat4.create(), viewProj);
    const invAffine = mat4.invert(mat4.create(), affine);

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

    updateTFParams();

    const mvp = mat4.multiply(mat4.create(), proj, view);

    if (renderingModeRef.current == "single_rayMarching") {
      singleRayMarchingRenderer.update(invViewProj, invAffine);
      singleRayMarchingRenderer.draw(pass);
    } else if (renderingModeRef.current == "multi_rayMarching") {
      multiRayMarchingRenderer.update(invViewProj, invAffine);
      multiRayMarchingRenderer.draw(pass);
    } else if (renderingModeRef.current == "multi_rayCasting") {
      multiRayCastingRenderer.update(invViewProj, invAffine);
      multiRayCastingRenderer.draw(pass);
    } else if (renderingModeRef.current == "marchingCube") {
      marchingCubeRenderer.update(mvp, eye);
      marchingCubeRenderer.draw(pass);
    }

    boxRingRenderer.update(sliceCentersRef.current, mvp);
    boxRingRenderer.draw(pass);

    sliceRenderer.update(sliceCentersRef.current);
    sliceRenderer.draw(pass);

    gizmoRenderer.update(Float32Array.from(view));
    gizmoRenderer.draw(pass);

    pass.end();

    device.queue.submit([encoder.finish()]);
    requestAnimationFrame(render);
  }

  render();
}
