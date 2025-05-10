import { useEffect, useRef, useState } from 'react';
import * as nifti from 'nifti-reader-js';
import { main } from './MRIRender';
import { getGPUDevice } from './GPUDevice';

interface NiiFile {
  name: string;
  active: boolean;
  file: File;
  age: number;
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
    <div className="w-full h-[90vh] overflow-hidden flex items-start">
      <div className="scale-[0.9] origin-top-left">
        <canvas
          ref={canvasRef}
          width={1440}
          height={720}
          className="bg-black"
        />
      </div>

      {/* 슬라이더 영역*/}
      <div className="absolute top-4 right-4 bg-[#2c2c2c] p-4 rounded-lg space-y-4 shadow-md z-10 w-72">
        <Slider
          label="XY Slice"
          value={sliceCenters[0]}
          max={dims[2] - 1}
          onChange={(v) => setSliceCenters(prev => [v, prev[1], prev[2]])}
        />
        <Slider
          label="YZ Slice"
          value={sliceCenters[1]}
          max={dims[0] - 1}
          onChange={(v) => setSliceCenters(prev => [prev[0], v, prev[2]])}
        />
        <Slider
          label="ZX Slice"
          value={sliceCenters[2]}
          max={dims[1] - 1}
          onChange={(v) => setSliceCenters(prev => [prev[0], prev[1], v])}
        />
      </div>
    </div >
  );
}

const Slider = ({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
}) => {
  return (
    <div className="flex items-center gap-4">
      <label className="w-24 text-sm text-white">{label}:</label>
      <input
        type="range"
        min={0}
        max={max}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-blue-500"
      />
    </div>
  );
};

export default CanvasArea;
