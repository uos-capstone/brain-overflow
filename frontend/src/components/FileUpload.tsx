import React, { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';

interface NiiFile {
  name: string;
  active: boolean;
  file: File;
  age: number;
}

interface FileUploadProps {
  files: NiiFile[];
  setFiles: React.Dispatch<React.SetStateAction<NiiFile[]>>;
}

const FileUpload: React.FC<FileUploadProps> = ({ setFiles }) => {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [temporaryFiles, setTemporaryFiles] = useState<NiiFile[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isNiiFile = (file: File) => file.name.toLowerCase().endsWith('.nii');

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    const niiFiles: NiiFile[] = droppedFiles
      .filter(isNiiFile)
      .map(file => ({ name: file.name, active: false, file, age: 0 }));
    if (niiFiles.length === 0) {
      alert('Only .nii files are allowed.');
      return;
    }
    setTemporaryFiles(prev => [...prev, ...niiFiles]);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const niiFiles: NiiFile[] = selectedFiles
      .filter(isNiiFile)
      .map(file => ({ name: file.name, active: false, file, age: 0 }));
    if (niiFiles.length === 0) {
      alert('Only .nii files are allowed.');
    } else {
      setTemporaryFiles(prev => [...prev, ...niiFiles]);
    }
    e.target.value = "";
  };

  const handleGenerate = () => {
    setFiles(prev => [...prev, ...temporaryFiles]);
    setTemporaryFiles([]);
    navigate('/viewer');
  };

  return (
    <div className="bg-[#1e1e1e] text-white">
      <div className="max-w-2xl mx-auto px-4 space-y-8">

        {/* 숨겨진 파일 선택기 */}
        <input
          type="file"
          accept=".nii"
          multiple
          ref={inputRef}
          className="hidden"
          onChange={handleFileChange}
        />

        {/* 드래그 앤 드롭 영역 */}
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition ${
            isDragging ? 'border-blue-500 bg-[#2a2a2a]' : 'border-gray-600'
          }`}
        >
          {temporaryFiles.length === 0 ? (
            <p className="text-center text-gray-400">파일을 이 곳으로 끌어오거나 클릭하여 업로드하세요.</p>
          ) : (
            <div className="space-y-4">
              {temporaryFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-gray-700 pb-2 text-sm text-gray-300"
                >
                  <span className="truncate">{file.name}</span>

                  <input
                    type="number"
                    placeholder="Age"
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#2a2a2a] border border-gray-600 text-white rounded px-2 py-1 w-24 text-sm focus:outline-none focus:ring focus:ring-blue-500"
                  />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTemporaryFiles(prev => prev.filter((_, i) => i !== idx));
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

        {/* 입력 필드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Sex</label>
            <select className="w-full bg-[#1e1e1e] border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Last Cognitive Status</label>
            <select className="w-full bg-[#1e1e1e] border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Alzheimer's Disease</option>
              <option>Mild Cognitive Impairment</option>
              <option>Cognitively Normal</option>
            </select>
          </div>
        </div>

        {/* 버튼 */}
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
