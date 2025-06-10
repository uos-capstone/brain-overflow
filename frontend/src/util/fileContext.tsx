import { createContext, useContext, useState } from "react";
import { NiiFile } from "./type";

const FileContext = createContext<{
  files: NiiFile[];
  setFiles: React.Dispatch<React.SetStateAction<NiiFile[]>>;
} | null>(null);

export const FileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [files, setFiles] = useState<NiiFile[]>([]);
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
