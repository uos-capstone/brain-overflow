import { createContext, useContext, useEffect, useState } from "react";
import { NiiFile } from "./type";
import { registerResultCompleteHandler } from "./socket";

const FileContext = createContext<{
  files: NiiFile[];
  setFiles: React.Dispatch<React.SetStateAction<NiiFile[]>>;
} | null>(null);

export const FileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [files, setFiles] = useState<NiiFile[]>([]);

  useEffect(() => {
    registerResultCompleteHandler(async (resultId) => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      setFiles((prev) => {
        const updated = [...prev];
        const index = updated.findIndex(
          (f) => f.name === `result-${resultId}.nii`
        );
        if (index === -1) return prev;

        // 일단 상태만 PROGRESS로 바꾸고
        updated[index].predictionStatus = "PROGRESS";
        return updated;
      });

      try {
        const res = await fetch(
          `https://api-brain-overflow.unknownpgr.com/mri/result/${resultId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) throw new Error("결과 정보 조회 실패");

        const json = await res.json();
        const resultFilePath = json.data.resultFilePath;

        const downloadRes = await fetch(
          `https://api-brain-overflow.unknownpgr.com/uploads/${resultFilePath}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const blob = await downloadRes.blob();

        const newFile = new File([blob], `result-${resultId}.nii`, {
          type: "application/octet-stream",
        });

        setFiles((files) =>
          files.map((file) =>
            file.name === `result-${resultId}.nii`
              ? {
                  ...file,
                  file: newFile,
                  predictionStatus: "COMPLETE",
                }
              : file
          )
        );
      } catch (err) {
        console.error("🛑 결과 파일 갱신 실패:", err);
      }
    });
  }, []);

  return (
    <FileContext.Provider value={{ files, setFiles }}>
      {children}
    </FileContext.Provider>
  );
};

export const useFileContext = () => {
  const context = useContext(FileContext);
  if (!context)
    throw new Error("useFileContext must be used within FileProvider");
  return context;
};
