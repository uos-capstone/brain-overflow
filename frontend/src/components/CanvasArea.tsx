import { useEffect, useRef, useState } from "react";
import * as nifti from "nifti-reader-js";
import { main } from "./MRIRender";
import { getGPUDevice } from "./GPUDevice";
import { NiiFile } from "../util/type";

interface CanvasAreaProps {
  activeFile: NiiFile | null;
}

function CanvasArea({ activeFile }: CanvasAreaProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [sliceCenters, setSliceCenters] = useState<[number, number, number]>([
    0, 0, 0,
  ]);
  const sliceCentersRef = useRef<[number, number, number]>([0, 0, 0]);
  const [dims, setDims] = useState<[number, number, number]>([1, 1, 1]);
  const [renderingMode, setRenderingMode] = useState("single_rayMarching");
  const renderingModeRef = useRef(renderingMode);

  const [tfParams, setTfParams] = useState<
    [number, number, number, number, number, number]
  >([
    0.1,
    0.2, // dMin1, dMax1
    0.4,
    0.42, // dMin2, dMax2
    0.004,
    0.008, // alpha1, alpha2
  ]);

  const tfParamRef = useRef(tfParams);

  useEffect(() => {
    tfParamRef.current = tfParams;
  }, [tfParams]);

  useEffect(() => {
    sliceCentersRef.current = sliceCenters;
  }, [sliceCenters]);

  useEffect(() => {
    renderingModeRef.current = renderingMode;
  }, [renderingMode]);

  useEffect(() => {
    if (!activeFile) return;

    const file = activeFile.file;
    const resultIdMatch = activeFile.name.match(/result-(\d+)\.nii/);
    const mriResultId = resultIdMatch?.[1];

    const fetchLatestResult = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(
          `https://api-brain-overflow.unknownpgr.com/mri/result/${mriResultId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("결과 재조회 실패");

        const json = await res.json();
        const { resultFilePath } = json.data;

        const download = await fetch(
          `https://api-brain-overflow.unknownpgr.com/uploads/${resultFilePath}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const newBlob = await download.blob();

        if (newBlob.size === 0) {
          alert("❌ 파일이 아직 생성되지 않았습니다.");
          return;
        }

        // update activeFile.file with new File (optional)
        const newFile = new File([newBlob], activeFile.name, {
          type: "application/octet-stream",
        });
        activeFile.file = newFile;

        // trigger rendering again manually (or trigger a state update)
        // or: setFiles(...) with updated file
      } catch (err) {
        console.error("📡 최신 결과 확인 실패:", err);
        alert("❌ 파일이 없거나 결과가 아직 준비되지 않았습니다.");
      }
    };

    if (!file || file.size === 0) {
      if (mriResultId) {
        fetchLatestResult();
      } else {
        alert(`❌ '${activeFile.name}' 파일을 열 수 없습니다.`);
      }
      return;
    }

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

        setSliceCenters([dims[2] / 2, dims[0] / 2, dims[1] / 2]);

        const imageData = nifti.readImage(header, fileBuffer);

        let raw:
          | Int8Array
          | Uint8Array
          | Int16Array
          | Uint16Array
          | Int32Array
          | Uint32Array
          | Float32Array
          | Float64Array;

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
            alert(
              `Unsupported or unknown NIfTI datatypeCode: ${header.datatypeCode}`
            );
            return;
        }

        // console.log("datatype code:", header.datatypeCode);

        let min = Infinity;
        let max = -Infinity;

        for (let i = 0; i < raw.length; i++) {
          if (raw[i] < min) min = raw[i];
          if (raw[i] > max) max = raw[i];
        }

        // console.log(min, max);

        const voxel = new Float32Array(raw.length);
        for (let i = 0; i < raw.length; i++) {
          voxel[i] = (raw[i] - min) / (max - min);
        }

        // console.log(voxel);

        const affine = new Float32Array((header as any).affine.flat());

        if (canvasRef.current) {
          await main(
            canvasRef.current,
            voxel,
            dims,
            affine,
            device,
            sliceCentersRef,
            tfParamRef,
            renderingModeRef
          );
        }
      } else {
        alert("Not a valid NIfTI file.");
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
      <div className="absolute top-4 right-4 bg-[#2c2c2c] p-4 rounded-lg space-y-4 shadow-md z-10 w-48">
        <div className="flex flex-col space-y-2">
          <label className="text-sm text-white">RenderingMode</label>
          <select
            value={renderingMode}
            onChange={(e) => setRenderingMode(e.target.value)}
            className="text-sm rounded px-2 py-1 bg-[#1e1e1e] text-white border border-gray-600"
          >
            <option value="single_rayMarching">single_rayMarching</option>
            <option value="multi_rayMarching">multi_rayMarching</option>
            <option value="marchingCube">marchingCube</option>
            <option value="multi_rayCasting">multi_rayCasting</option>
          </select>
        </div>

        <Slider
          label="XY Slice"
          value={sliceCenters[0]}
          max={dims[2] - 1}
          onChange={(v) => setSliceCenters((prev) => [v, prev[1], prev[2]])}
        />
        <Slider
          label="YZ Slice"
          value={sliceCenters[1]}
          max={dims[0] - 1}
          onChange={(v) => setSliceCenters((prev) => [prev[0], v, prev[2]])}
        />
        <Slider
          label="ZX Slice"
          value={sliceCenters[2]}
          max={dims[1] - 1}
          onChange={(v) => setSliceCenters((prev) => [prev[0], prev[1], v])}
        />
        <Slider
          label="dMin1"
          value={tfParams[0]}
          max={1}
          onChange={(v) =>
            setTfParams((prev) => [
              v,
              prev[1],
              prev[2],
              prev[3],
              prev[4],
              prev[5],
            ])
          }
        />
        <Slider
          label="dMax1"
          value={tfParams[1]}
          max={1}
          onChange={(v) =>
            setTfParams((prev) => [
              prev[0],
              v,
              prev[2],
              prev[3],
              prev[4],
              prev[5],
            ])
          }
        />
        <Slider
          label="dMin2"
          value={tfParams[2]}
          max={1}
          onChange={(v) =>
            setTfParams((prev) => [
              prev[0],
              prev[1],
              v,
              prev[3],
              prev[4],
              prev[5],
            ])
          }
        />
        <Slider
          label="dMax2"
          value={tfParams[3]}
          max={1}
          onChange={(v) =>
            setTfParams((prev) => [
              prev[0],
              prev[1],
              prev[2],
              v,
              prev[4],
              prev[5],
            ])
          }
        />
        <Slider
          label="alpha1"
          value={tfParams[4]}
          max={0.05}
          onChange={(v) =>
            setTfParams((prev) => [
              prev[0],
              prev[1],
              prev[2],
              prev[3],
              v,
              prev[5],
            ])
          }
        />
        <Slider
          label="alpha2"
          value={tfParams[5]}
          max={0.05}
          onChange={(v) =>
            setTfParams((prev) => [
              prev[0],
              prev[1],
              prev[2],
              prev[3],
              prev[4],
              v,
            ])
          }
        />
      </div>
    </div>
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
        step={0.001}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-blue-500"
      />
    </div>
  );
};

export default CanvasArea;
