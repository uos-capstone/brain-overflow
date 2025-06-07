import React, { useRef, useState, DragEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { NiiFile, FileUploadProps } from "../util/type";

const FileUpload: React.FC<FileUploadProps> = ({ setFiles }) => {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [temporaryFiles, setTemporaryFiles] = useState<NiiFile[]>([]);
  const [sex, setSex] = useState("male");
  const [targetCognitiveStatus, setTargetCognitiveStatus] = useState(
    "Alzheimer's Disease"
  );
  const [targetAge, setTargetAge] = useState(70);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isNiiFile = (file: File) => file.name.toLowerCase().endsWith(".nii");

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    const niiFiles: NiiFile[] = droppedFiles.filter(isNiiFile).map((file) => ({
      name: file.name,
      active: false,
      file,
      age: 0,
    }));
    if (niiFiles.length === 0) {
      alert("Only .nii files are allowed.");
      return;
    }
    setTemporaryFiles((prev) => [...prev, ...niiFiles]);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const niiFiles: NiiFile[] = selectedFiles.filter(isNiiFile).map((file) => ({
      name: file.name,
      active: false,
      file,
      age: 0,
    }));
    if (niiFiles.length === 0) {
      alert("Only .nii files are allowed.");
    } else {
      setTemporaryFiles((prev) => [...prev, ...niiFiles]);
    }
    e.target.value = "";
  };

  const handleAgeChange = (index: number, value: number) => {
    setTemporaryFiles((prev) =>
      prev.map((file, i) => (i === index ? { ...file, age: value } : file))
    );
  };

  // const handleCognitiveStatusChange = (index: number, value: string) => {
  //   setTemporaryFiles((prev) =>
  //     prev.map((file, i) =>
  //       i === index ? { ...file, cognitiveStatus: value } : file
  //     )
  //   );
  // };

  const cognitiveStatusMap: Record<string, string> = {
    "Alzheimer's Disease": "AD",
    "Mild Cognitive Impairment": "MCI",
    "Cognitively Normal": "CN",
  };

  const handleGenerate = async () => {
    const token = localStorage.getItem("accessToken");

    for (const niiFile of temporaryFiles) {
      const formData = new FormData();

      formData.append("file", niiFile.file);
      formData.append("age", niiFile.age.toString());
      formData.append("gender", sex.toUpperCase());
      formData.append(
        "targetDiagnosis",
        cognitiveStatusMap[targetCognitiveStatus]
      );

      try {
        const res = await fetch(
          "https://api-brain-overflow.unknownpgr.com/mri",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        const json = await res.json();
        if (!res.ok)
          throw new Error(
            `Upload failed: ${res.status} - ${JSON.stringify(json)}`
          );
        console.log("✅ Upload success:", json);

        const mriImageId = json.data;
        if (!mriImageId) throw new Error("응답에 MRI 이미지 ID가 없습니다.");

        await handleCheckAD(mriImageId);
      } catch (err) {
        console.error("Upload error:", err);
        alert("업로드 중 오류가 발생했습니다. 콘솔을 확인하세요.");
        return;
      }
    }

    setFiles((prev) => [...prev, ...temporaryFiles]);
    setTemporaryFiles([]);
    navigate("/viewer");
  };

  const handleCheckAD = async (mriImageId: string) => {
    const token = localStorage.getItem("accessToken");

    try {
      const res = await fetch(
        `https://api-brain-overflow.unknownpgr.com/mri/check-ad?mriImageId=${mriImageId}&targetAge=${targetAge}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const text = await res.text();
      if (!res.ok) throw new Error(`Request failed: ${res.status} - ${text}`);
      console.log("Check AD result:", text);
    } catch (err) {
      console.error("Error checking AD:", err);
      alert("요청 중 오류 발생. 콘솔 확인 바랍니다.");
    }
  };

  // const handleCompleteMRI = async () => {
  //   const token = localStorage.getItem("accessToken");

  //   const mriImageId = "0d943a7b-4a52-461d-8c10-b9a2599a9ea5";
  //   const mriResultId = 73;

  //   const niiFile = temporaryFiles[0];
  //   if (!niiFile) {
  //     alert("선택된 파일이 없습니다.");
  //     return;
  //   }

  //   const formData = new FormData();
  //   formData.append("file", niiFile.file);

  //   try {
  //     const res = await fetch(
  //       `https://api-brain-overflow.unknownpgr.com/mri/check/complete?mriImageId=${mriImageId}&mriResultId=${mriResultId}`,
  //       {
  //         method: "POST",
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //         body: formData,
  //       }
  //     );

  //     const json = await res.json();
  //     if (!res.ok)
  //       throw new Error(
  //         `Request failed: ${res.status} - ${JSON.stringify(json)}`
  //       );
  //     console.log("✅ 분석 결과 제출 성공:", json);
  //   } catch (err) {
  //     console.error("❌ 분석 결과 제출 실패:", err);
  //     alert("결과 제출 중 오류가 발생했습니다. 콘솔을 확인하세요.");
  //   }
  // };

  return (
    <div className="bg-[#1e1e1e] text-white">
      <div className="max-w-2xl mx-auto px-4 space-y-8">
        <input
          type="file"
          accept=".nii"
          multiple
          ref={inputRef}
          className="hidden"
          onChange={handleFileChange}
        />

        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition ${
            isDragging ? "border-blue-500 bg-[#2a2a2a]" : "border-gray-600"
          }`}
        >
          {temporaryFiles.length === 0 ? (
            <p className="text-center text-gray-400">
              파일을 이 곳으로 끌어오거나 클릭하여 업로드하세요.
            </p>
          ) : (
            <div className="space-y-4">
              {temporaryFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b border-gray-700 pb-2 text-sm text-gray-300"
                >
                  <span className="truncate">{file.name}</span>
                  <input
                    type="number"
                    placeholder="Age"
                    value={file.age}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      handleAgeChange(idx, Number(e.target.value))
                    }
                    className="bg-[#2a2a2a] border border-gray-600 text-white rounded px-2 py-1 w-24 text-sm focus:outline-none focus:ring focus:ring-blue-500"
                  />
                  {/* <select
                    value={file.cognitiveStatus}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      handleCognitiveStatusChange(idx, e.target.value)
                    }
                    className="bg-[#2a2a2a] border border-gray-600 text-white rounded px-2 py-1 w-24 text-sm focus:outline-none focus:ring focus:ring-blue-500"
                  >
                    <option>Alzheimer's Disease</option>
                    <option>Mild Cognitive Impairment</option>
                    <option>Cognitively Normal</option>
                  </select> */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTemporaryFiles((prev) =>
                        prev.filter((_, i) => i !== idx)
                      );
                    }}
                    className="text-red-500 text-xs hover:underline"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Sex</label>
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value)}
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Target Age
            </label>
            <input
              type="number"
              value={targetAge}
              onChange={(e) => setTargetAge(Number(e.target.value))}
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Target Cognitive Status
            </label>
            <select
              value={targetCognitiveStatus}
              onChange={(e) => setTargetCognitiveStatus(e.target.value)}
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Alzheimer's Disease</option>
              <option>Mild Cognitive Impairment</option>
              <option>Cognitively Normal</option>
            </select>
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <button
            onClick={handleGenerate}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md shadow transition"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
