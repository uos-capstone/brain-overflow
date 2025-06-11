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
      <span className="mr-2 text-pink-400">
        {file.predictionStatus === "PROGRESS" ? (
          <span className="animate-spin inline-block w-3 h-3 border-2 border-pink-400 border-t-transparent rounded-full" />
        ) : (
          "🧠"
        )}
      </span>

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
  if (!token) {
    console.error("Access token not found.");
    return;
  }

  try {
    const res = await fetch("https://api-brain-overflow.unknownpgr.com/mri", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "MRI 목록 조회 실패");

    // MRI 및 결과 파일을 모두 병렬 fetch하도록 Promise 배열 생성
    const allFilePromises = json.data.flatMap((item: any) => {
      const mriId = item.mriId;

      const mriFilePromise = fetch(
        `https://api-brain-overflow.unknownpgr.com/uploads/${item.filePath}`
      )
        .then((res) => res.blob())
        .then((blob) => ({
          name: `${mriId}.nii`,
          file: new File([blob], `${mriId}.nii`, {
            type: "application/octet-stream",
          }),
          active: false,
          age: 0,
          fromRemote: true,
        }));

      const resultPromises = (item.mriResultDtoList || []).map((result: any) =>
        fetch(
          `https://api-brain-overflow.unknownpgr.com/uploads/${result.resultFilePath}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
          .then((res) => res.blob())
          .then((blob) => ({
            name: `result-${result.mriResultId}.nii`,
            file: new File([blob], `result-${result.mriResultId}.nii`, {
              type: "application/octet-stream",
            }),
            active: false,
            age: result.targetAge ?? 0,
            fromRemote: true,
            predictionStatus: result.mriPredictionStatus,
          }))
      );

      return [mriFilePromise, ...resultPromises];
    });

    // 병렬 fetch 수행
    const loadedFiles: NiiFile[] = await Promise.all(allFilePromises);

    // 상태 업데이트
    setFiles((prev) => {
      const combined = [...prev, ...loadedFiles];
      if (!combined.some((f) => f.active) && combined.length > 0) {
        combined[0].active = true;
      }
      return combined;
    });
  } catch (err) {
    console.error("🛑 MRI 데이터 병렬 로딩 실패:", err);
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

  const handleClick = async (index: number) => {
    if (index === 1) {
      try {
        const response = await fetch("/publicFiles/mri/normalized_float32.nii");
        const blob = await response.blob();
        const mockFile = new File([blob], files[index].name, {
          type: "application/octet-stream",
        });

        setFiles((prev) =>
          prev.map((f, i) =>
            i === index
              ? {
                  ...f,
                  name: files[index].name,
                  file: mockFile,
                  active: true,
                }
              : { ...f, active: false }
          )
        );
      } catch (err) {
        console.error("🛑 Mock 파일 로딩 실패:", err);
      }
    } else {
      setFiles((prev) => prev.map((f, i) => ({ ...f, active: i === index })));
    }
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
