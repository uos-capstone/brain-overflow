import React, { useState } from 'react';
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