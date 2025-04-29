import { mat4 } from 'gl-matrix';
import { VolumeRenderer } from './renderers/VolumeRenderer';
import { BoxRingRenderer } from './renderers/BoxRingRenderer';
import { SliceRenderer } from './renderers/SliceRenderer';
import { GizmoRenderer } from './renderers/GizmoRenderer';

export async function main(
  canvas: HTMLCanvasElement,
  voxelData: Float32Array,
  dims: [number, number, number],
  affine: Float32Array,
  device: GPUDevice,
  sliceCentersRef: React.RefObject<[number, number, number]>,
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

  let cameraTheta = Math.PI / 2;
  let cameraPhi = Math.PI / 2;
  let cameraRadius = 1;
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

  const volumeRenderer = new VolumeRenderer(device, texture, dims, canvas);

  const sliceRenderer = new SliceRenderer(device, texture, dims, canvas);

  const boxRingRenderer = new BoxRingRenderer(device, dims, canvas);

  const gizmoRenderer = new GizmoRenderer(device, canvas);

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

    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
      }]
    });

    volumeRenderer.update(invViewProj, invAffine);
    volumeRenderer.draw(pass);

    const mvp = mat4.multiply(mat4.create(), proj, view);

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