import React, { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Sidebar from './Sidebar';
import FileHeader from './FileHeader';
import CanvasArea from './CanvasArea';

export interface NiiFile {
  name: string;
  active: boolean;
  file: File;
  age: number;
}

const ViewerPage: React.FC = () => {
  const [files, setFiles] = useState<NiiFile[]>([]);

  useEffect(() => {
    async function loadExample() {
      const response = await fetch('publicFiles/mri/example.nii');
      const blob = await response.blob();
      const file = new File([blob], 'example.nii');
      setFiles([{
        name: 'example.nii',
        active: true,
        file: file,
        age: 0,
      }]);
    }

    loadExample();
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen flex bg-[#1e1e1e] text-white font-sans">
        {/* Sidebar */}
        <aside className="w-[61px] bg-black/30 border-r border-gray-800 p-4">
          <Sidebar />
        </aside>

        {/* Main content */}
        <main className="flex-1 px-0 py-0 overflow-y-auto">
          <div className="max-w-none">
            <FileHeader files={files} setFiles={setFiles} />
            <CanvasArea activeFile={files.find(f => f.active) || null} />
          </div>
        </main>
      </div>
    </DndProvider>
  );
};

export default ViewerPage;
