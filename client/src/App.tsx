import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import Sidebar from './components/Sidebar';
import TopBanner from './components/TopBanner';
import FileUpload from './components/FileUpload';
import FileHeader from './components/FileHeader';
import CanvasArea from './components/CanvasArea';
import './App.css';

export interface NiiFile {
  name: string;
  active: boolean;
  file: File;
}

function App() {
  const [files, setFiles] = useState<NiiFile[]>([]);

  useEffect(() => {
    async function loadExample() {
      const response = await fetch('/mri/example.nii');
      const blob = await response.blob();
      const file = new File([blob], 'example.nii');
  
      const exampleFile: NiiFile = {
        name: 'example.nii',
        active: true,
        file: file,
      };
  
      setFiles([exampleFile]);
    }
  
    loadExample();
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app-container">
        <Sidebar />
        <div className="main-section">
          <TopBanner />
          <FileUpload files={files} setFiles={setFiles} />
          <FileHeader files={files} setFiles={setFiles} />
          <CanvasArea activeFile={files.find(f => f.active) || null} />
        </div>
      </div>
    </DndProvider>
  );
}

export default App;