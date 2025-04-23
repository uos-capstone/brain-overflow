import React, { useRef, useState, DragEvent, ChangeEvent } from 'react';

interface NiiFile {
    name: string;
    active: boolean;
    file: File;
}

interface FileUploadProps {
    files: NiiFile[];
    setFiles: React.Dispatch<React.SetStateAction<NiiFile[]>>;
}

function FileUpload({ files, setFiles }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const isNiiFile = (file: File) => file.name.toLowerCase().endsWith('.nii');

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        const niiFiles: NiiFile[] = droppedFiles
            .filter(isNiiFile)
            .map(file => ({ name: file.name, active: false, file }));

        if (niiFiles.length === 0) {
            alert('Only .nii files are allowed.');
            return;
        }

        setFiles(prev => [...prev, ...niiFiles]);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        const niiFiles: NiiFile[] = selectedFiles
            .filter(isNiiFile)
            .map(file => ({ name: file.name, active: false, file }));

        if (niiFiles.length === 0) {
            alert('Only .nii files are allowed.');
        } else {
            setFiles(prev => [...prev, ...niiFiles]);
        }

        e.target.value = "";
    };

    return (
        <div style={{
            backgroundColor: '#1e1e1e',
            color: 'white',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            flexShrink: 0
        }}>
            <input
                type="file"
                accept=".nii"
                multiple
                ref={inputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
            <div
                onClick={() => inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                style={{
                    padding: '30px',
                    border: '2px dashed',
                    borderColor: isDragging ? '#007acc' : '#ccc',
                    backgroundColor: isDragging ? '#2a2a2a' : 'transparent',
                    color: '#888',
                    textAlign: 'center',
                    minHeight: '100px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: files.length === 0 ? 'flex' : 'block',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                {files.length === 0 ? (
                    <p>파일을 이 곳으로 끌어오거나 클릭하여 업로드하세요.</p>
                ) : (
                    files.map((file, idx) => (
                        <div key={idx} style={{
                            display: 'flex',
                            padding: '6px 0',
                            borderBottom: '1px solid #444',
                            alignItems: 'center',
                            color: '#ccc'
                        }}>
                            <div style={{ width: '90%' }}>{file.name}</div>
                            <div style={{ width: '10%' }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const updated = files.filter((_, i) => i !== idx);
                                        setFiles(updated);
                                    }}
                                    style={{
                                        fontSize: '12px',
                                        color: 'red',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    삭제
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default FileUpload;