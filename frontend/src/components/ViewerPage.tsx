import React, { useEffect } from "react";
import Sidebar from "./Sidebar";
import FileHeader from "./FileHeader";
import CanvasArea from "./CanvasArea";
import { useFileContext } from "../util/fileContext";

const ViewerPage: React.FC = () => {
  const { files, setFiles } = useFileContext();

  useEffect(() => {
    async function loadExample() {
      const response = await fetch("publicFiles/mri/example.nii");
      const blob = await response.blob();
      const file = new File([blob], "example.nii");
      setFiles((prev) => {
        const updated = [...prev.map((f) => ({ ...f, active: false }))];
        return [
          ...updated,
          {
            name: "example.nii",
            active: true,
            file: file,
            age: 0,
            cognitiveStatus: "AD",
          },
        ];
      });
    }

    loadExample();
  }, []);

  return (
    <div className="min-h-screen flex bg-[#1e1e1e] text-white font-sans">
      {/* Sidebar */}
      <aside className="w-[61px] bg-black/30 border-r border-gray-800 p-4">
        <Sidebar />
      </aside>

      {/* Main content */}
      <main className="flex-1 px-0 py-0 overflow-y-auto">
        <div className="max-w-none">
          <FileHeader />
          <CanvasArea activeFile={files.find((f) => f.active) || null} />
        </div>
      </main>
    </div>
  );
};

export default ViewerPage;
