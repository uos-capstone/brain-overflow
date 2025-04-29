import React, { useEffect, useRef, useState } from 'react';
import * as nifti from 'nifti-reader-js';
import { main } from './MRIRender';
import { getGPUDevice } from './GPUDevice';

interface NiiFile {
  name: string;
  active: boolean;
  file: File;
}

interface CanvasAreaProps {
  activeFile: NiiFile | null;
}

function CanvasArea({ activeFile }: CanvasAreaProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [sliceCenters, setSliceCenters] = useState<[number, number, number]>([0, 0, 0]);
  const sliceCentersRef = useRef<[number, number, number]>([0, 0, 0]);
  const [dims, setDims] = useState<[number, number, number]>([1, 1, 1]);

  useEffect(() => {
    sliceCentersRef.current = sliceCenters;
  }, [sliceCenters]);

  useEffect(() => {
    if (!activeFile || !activeFile.file) return;

    const readAndRender = async () => {
      const device = await getGPUDevice();
      const fileBuffer = await activeFile.file.arrayBuffer();

      if (!nifti.isCompressed(fileBuffer) && nifti.isNIFTI(fileBuffer)) {
        const header = nifti.readHeader(fileBuffer);
        const dims: [number, number, number] = [
          header.dims[1],
          header.dims[2],
          header.dims[3],
        ];
        setDims(dims);

        setSliceCenters([
          dims[2] / 2,
          dims[0] / 2,
          dims[1] / 2,
        ]);

        const imageData = nifti.readImage(header, fileBuffer);
        const raw = new Int16Array(imageData);

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

        const affine = new Float32Array((header as any).affine.flat());

        if (canvasRef.current) {
          await main(canvasRef.current, voxel, dims, affine, device, sliceCentersRef);
        }
      } else {
        alert('Not a valid NIfTI file.');
      }
    };

    readAndRender();
  }, [activeFile]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        id="canvas"
        ref={canvasRef}
        style={{ width: '100%', height: '70%', paddingBottom: '40px', backgroundColor: '#000' }}
      />
      <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.7)', padding: '10px', borderRadius: '8px' }}>
        <div>
          XY Slice:
          <input
            type="range"
            min="0"
            max={dims[2] - 1}
            step="0.01"
            value={sliceCenters[0]}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setSliceCenters(prev => [v, prev[1], prev[2]]);
            }}
          />
        </div>
        <div>
          YZ Slice:
          <input
            type="range"
            min="0"
            max={dims[0] - 1}
            step="0.01"
            value={sliceCenters[1]}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setSliceCenters(prev => [prev[0], v, prev[2]]);
            }}
          />
        </div>
        <div>
          ZX Slice:
          <input
            type="range"
            min="0"
            max={dims[1] - 1}
            step="0.01"
            value={sliceCenters[2]}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setSliceCenters(prev => [prev[0], prev[1], v]);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default CanvasArea;
