import React, { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Sidebar from './Sidebar';
import TopBanner from './TopBanner';
import FileUpload from './FileUpload';
// import FileHeader from './FileHeader';
// import CanvasArea from './CanvasArea';
import './MainPage.css';

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
      <div className="app-container" style={{
        maxWidth: '900px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <Sidebar />
        <div className="main-section">
          <TopBanner />
          <FileUpload files={files} setFiles={setFiles} />
          {/* <FileHeader files={files} setFiles={setFiles} />
          <CanvasArea activeFile={files.find(f => f.active) || null} /> */}
        </div>
      </div>
    </DndProvider>
  );
};

export default MainPage;