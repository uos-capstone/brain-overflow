import React, { useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const ItemType = 'TAB';

export interface NiiFile {
    name: string;
    active: boolean;
    file: File;
    age: number;
}

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
}

const Tab: React.FC<TabProps> = ({ file, index, moveTab, onClose, onClick }) => {
    const ref = useRef<HTMLDivElement>(null);

    const [, drop] = useDrop<DragItem>({
        accept: ItemType,
        hover: (item) => {
            if (item.index !== index) {
                moveTab(item.index, index);
                item.index = index;
            }
        }
    });

    const [, drag] = useDrag<DragItem>({
        type: ItemType,
        item: { index, type: ItemType },
    });

    drag(drop(ref));

    return (
        <div
            ref={ref}
            className={`flex items-center px-2 py-1 text-sm whitespace-nowrap border-r border-gray-600 cursor-pointer select-none transition-colors
        ${file.active ? 'bg-[#1e1e1e] text-white' : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333333]'}`}
            onClick={() => onClick(index)}
        >
            <span className="mr-2 text-pink-400">🧠</span>
            {file.name}
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

interface FileHeaderProps {
    files: NiiFile[];
    setFiles: React.Dispatch<React.SetStateAction<NiiFile[]>>;
}

const FileHeader: React.FC<FileHeaderProps> = ({ files, setFiles }) => {
    const handleClose = (index: number) => {
        setFiles(prev => {
            const updated = [...prev];
            const wasActive = updated[index].active;
            updated[index].file = null as unknown as File;
            updated.splice(index, 1);
            if (wasActive && updated.length > 0) updated[0].active = true;
            return updated;
        });
    };

    const handleClick = (index: number) => {
        setFiles(prev =>
            prev.map((f, i) => ({ ...f, active: i === index }))
        );
    };

    const moveTab = (from: number, to: number) => {
        setFiles(prev => {
            const updated = [...prev];
            const [moved] = updated.splice(from, 1);
            updated.splice(to, 0, moved);
            return updated;
        });
    };

    return (
        <DndProvider backend={HTML5Backend}>
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
        </DndProvider>
    );
};

export default FileHeader;
