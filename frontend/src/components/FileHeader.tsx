import React, { useEffect, useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { NiiFile } from "../util/type";
import { useFileContext } from "../util/fileContext";

const ItemType = "TAB";

interface TabProps {
  file: NiiFile;
  index: number;
  moveTab: (from: number, to: number) => void;
  onClose: (index: number) => void;
  onClick: (index: number) => void;
}

interface DragItem {
  index: number;
  type: string;
  file: NiiFile;
}

const Tab: React.FC<TabProps> = ({
  file,
  index,
  moveTab,
  onClose,
  onClick,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop<DragItem>({
    accept: ItemType,
    hover: (item) => {
      if (item.index !== index) {
        moveTab(item.index, index);
        item.index = index;
      }
    },
  });

  const [, drag] = useDrag<DragItem>({
    type: ItemType,
    item: { index, type: ItemType, file },
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`flex items-center px-2 py-1 text-sm whitespace-nowrap border-r border-gray-600 cursor-pointer select-none transition-colors
      ${
        file.active
          ? "bg-[#1e1e1e] text-white"
          : "bg-[#2a2a2a] text-gray-300 hover:bg-[#333333]"
      }`}
      onClick={() => onClick(index)}
    >
      <span className="mr-2 text-pink-400">🧠</span>
      {file.name}
      {/* {file.fromRemote && (
        <span className="ml-1 text-xs text-blue-400">(remote)</span>
      )} */}
      <span
        className="ml-2 text-gray-400 hover:text-red-400 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onClose(index);
        }}
      >
        ×
      </span>
    </div>
  );
};

const loadRemoteFiles = async (
  setFiles: React.Dispatch<React.SetStateAction<NiiFile[]>>
) => {
  const token = localStorage.getItem("accessToken");

  try {
    const res = await fetch("https://api-brain-overflow.unknownpgr.com/mri", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "MRI 목록 조회 실패");

    const loadedFiles: NiiFile[] = [];

    for (const item of json.data) {
      // ✅ 1. 원본 MRI 파일 처리
      const fileRes = await fetch(
        "https://api-brain-overflow.unknownpgr.com/uploads/" + item.filePath
      );
      const blob = await fileRes.blob();
      const filename = item.mriId + ".nii";
      const file = new File([blob], filename, {
        type: "application/octet-stream",
      });

      loadedFiles.push({
        name: filename,
        file,
        active: false,
        age: 0,
        fromRemote: true,
      });

      for (const resultDto of item.mriResultDtoList || []) {
        const resultFileRes = await fetch(
          "https://api-brain-overflow.unknownpgr.com/uploads/" +
            resultDto.resultFilePath,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const resultBlob = await resultFileRes.blob();
        const resultFile = new File(
          [resultBlob],
          `result-${resultDto.mriResultId}.nii`,
          { type: "application/octet-stream" }
        );

        loadedFiles.push({
          name: `result-${resultDto.mriResultId}.nii`,
          file: resultFile,
          active: false,
          age: resultDto.targetAge ?? 0,
          fromRemote: true,
        });
      }
    }

    setFiles((prev) => {
      const combined = [...prev, ...loadedFiles];
      if (!combined.some((f) => f.active) && combined.length > 0) {
        combined[0].active = true;
      }
      return combined;
    });
  } catch (err) {
    console.error("🛑 MRI 데이터 불러오기 실패:", err);
  }
};

const FileHeader: React.FC = () => {
  const { files, setFiles } = useFileContext();

  useEffect(() => {
    loadRemoteFiles(setFiles);
  }, [setFiles]);

  const handleClose = (index: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      const wasActive = updated[index].active;
      updated.splice(index, 1);
      if (wasActive && updated.length > 0) updated[0].active = true;
      return updated;
    });
  };

  const handleClick = (index: number) => {
    setFiles((prev) => prev.map((f, i) => ({ ...f, active: i === index })));
  };

  const moveTab = (from: number, to: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  };

  return (
    <div className="flex h-9 border-b border-gray-700 overflow-x-auto bg-[#2a2a2a]">
      {files.map((file, index) => (
        <Tab
          key={`${file.name}-${index}`}
          file={file}
          index={index}
          moveTab={moveTab}
          onClose={handleClose}
          onClick={handleClick}
        />
      ))}
    </div>
  );
};

export default FileHeader;
