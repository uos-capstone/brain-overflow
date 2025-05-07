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
                item.index = index; // Web safe way in this context
            }
        }
    });

    const [, drag] = useDrag<DragItem>({
        type: ItemType,
        item: { index, type: ItemType },
    });

    drag(drop(ref)); // connect drag and drop to ref

    return (
        <div
            ref={ref}
            style={{
                padding: '5px 10px',
                backgroundColor: file.active ? '#1e1e1e' : '#2d2d2d',
                color: file.active ? 'white' : '#ccc',
                borderRight: '1px solid #444',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: '13px',
                userSelect: 'none',
            }}
            onClick={() => onClick(index)}
        >
            <span style={{ marginRight: '5px' }}>🧠</span>
            {file.name}
            <span
                style={{ marginLeft: '8px', color: '#888', cursor: 'pointer' }}
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
            <div
                style={{
                    display: 'flex',
                    backgroundColor: '#2d2d2d',
                    borderBottom: '1px solid #444',
                    overflowX: 'auto',
                    whiteSpace: 'nowrap',
                    minHeight: '35px',
                }}
            >
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
