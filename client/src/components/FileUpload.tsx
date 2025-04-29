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
    const [temporaryFiles, setTemporaryFiles] = useState<NiiFile[]>([]);
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

        setTemporaryFiles(prev => [...prev, ...niiFiles]);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        const niiFiles: NiiFile[] = selectedFiles
            .filter(isNiiFile)
            .map(file => ({ name: file.name, active: false, file }));

        if (niiFiles.length === 0) {
            alert('Only .nii files are allowed.');
        } else {
            setTemporaryFiles(prev => [...prev, ...niiFiles]);
        }

        e.target.value = "";
    };

    const handleGenerate = () => {
        setFiles(prev => [...prev, ...temporaryFiles]);
        setTemporaryFiles([]);
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
                    display: temporaryFiles.length === 0 ? 'flex' : 'block',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                {temporaryFiles.length === 0 ? (
                    <p>파일을 이 곳으로 끌어오거나 클릭하여 업로드하세요.</p>
                ) : (
                    temporaryFiles.map((file, idx) => (
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
                                        const updated = temporaryFiles.filter((_, i) => i !== idx);
                                        setTemporaryFiles(updated);
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
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#ccc', fontSize: '14px' }}>Sex:</span>

                <select
                    style={{
                        padding: '8px',
                        fontSize: '14px',
                        borderRadius: '4px',
                        border: '1px solid #555',
                        backgroundColor: '#2a2a2a',
                        color: '#fff'
                    }}
                >
                    <option value="a">Male</option>
                    <option value="b">Female</option>
                </select>

                <span style={{ color: '#ccc', fontSize: '14px' }}>Last MRI scan time:</span>

                <input
                    type="text"
                    placeholder="ex) 2025.01.01"
                    style={{
                        padding: '8px',
                        fontSize: '14px',
                        maxWidth: '20%',
                        borderRadius: '4px',
                        border: '1px solid #555',
                        backgroundColor: '#2a2a2a',
                        color: '#fff',
                        flex: '1'
                    }}
                />

                <button
                    onClick={handleGenerate}
                    style={{
                        padding: '10px',
                        backgroundColor: '#007acc',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        borderRadius: '4px'
                    }}
                    disabled={temporaryFiles.length === 0}
                >
                    Generate
                </button>
            </div>
        </div>
    );
}

export default FileUpload;