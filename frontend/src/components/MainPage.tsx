import React, { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Sidebar from './Sidebar';
import TopBanner from './TopBanner';
import FileUpload from './FileUpload';
// import FileHeader from './FileHeader';
// import CanvasArea from './CanvasArea';

export interface NiiFile {
  name: string;
  active: boolean;
  file: File;
  age: number;
}

const MainPage: React.FC = () => {
  const [files, setFiles] = useState<NiiFile[]>([]);

  useEffect(() => {
    async function loadExample() {
      const response = await fetch('/mri/example.nii');
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
      <div className="min-h-screen bg-[#1e1e1e] text-white font-sans flex">
        {/* 왼쪽 사이드바 */}
        <Sidebar />

        {/* 오른쪽 메인 콘텐츠 */}
        <main className="flex-1 px-6 py-8 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-6">
            <TopBanner />

            <FileUpload files={files} setFiles={setFiles} />
            {/* <FileHeader files={files} setFiles={setFiles} />
            <CanvasArea activeFile={files.find(f => f.active) || null} /> */}
          </div>
        </main>
      </div>
    </DndProvider>
  );
};

export default MainPage;
