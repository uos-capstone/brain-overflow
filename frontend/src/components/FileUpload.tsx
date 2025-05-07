import React, { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';

interface NiiFile {
    name: string;
    active: boolean;
    file: File;
    age: number;
}

interface FileUploadProps {
    files: NiiFile[];
    setFiles: React.Dispatch<React.SetStateAction<NiiFile[]>>;
}

function FileUpload({ setFiles }: FileUploadProps) {
    const navigate = useNavigate();

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
            .map(file => ({ name: file.name, active: false, file, age: 0, }));

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
            .map(file => ({ name: file.name, active: false, file, age: 0, }));

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
        navigate('/viewer');
    };

    return (
        <div style={{
            backgroundColor: '#1e1e1e', 
            color: 'white', 
            padding: '20px'
        }}>
            <div style={{
                maxWidth: '900px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
            }}>
                <input
                    type="file"
                    accept=".nii"
                    multiple
                    ref={inputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />

                {/* Drag and drop area */}
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
                        minHeight: '200px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: temporaryFiles.length === 0 ? 'flex' : 'block',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    {temporaryFiles.length === 0 ? (
                        <p>파일을 이 곳으로 끌어오거나 클릭하여 업로드하세요.</p>
                    ) : (
                        temporaryFiles.map((file, idx) => (
                            <div key={idx} style={{
                                display: 'flex',
                                gap: '10px',
                                alignItems: 'center',
                                padding: '6px 0',
                                borderBottom: '1px solid #444',
                                color: '#ccc'
                            }}>
                                <div style={{ flex: '1' }}>{file.name}</div>

                                <span style={{ color: '#ccc', fontSize: '14px' }}>MRI age:</span>

                                <input
                                    onClick={(e) => e.stopPropagation()}
                                    type="number"
                                    placeholder="추가 정보 입력"
                                    style={{
                                        padding: '6px',
                                        fontSize: '14px',
                                        borderRadius: '4px',
                                        border: '1px solid #555',
                                        backgroundColor: '#2a2a2a',
                                        color: '#fff',
                                        width: '200px'
                                    }}
                                />

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
                        ))
                    )}
                </div>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(8, 1fr)',
                    gap: '10px',
                    alignItems: 'center',
                    marginTop: '10px',
                    maxWidth: '800px',
                    marginLeft: 'auto',
                    marginRight: 'auto'
                }}
            >
                <span style={{ gridColumn: '3 / span 2', color: '#ccc', fontSize: '14px' }}>Sex:</span>

                <select
                    style={{
                        gridColumn: '5 / span 2',
                        padding: '8px',
                        fontSize: '14px',
                        borderRadius: '4px',
                        border: '1px solid #555',
                        backgroundColor: '#2a2a2a',
                        color: '#fff',
                        width: '100%'
                    }}
                >
                    <option value="a">Male</option>
                    <option value="b">Female</option>
                </select>

            </div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(8, 1fr)',
                    gap: '10px',
                    alignItems: 'center',
                    marginTop: '10px',
                    maxWidth: '800px',
                    marginLeft: 'auto',
                    marginRight: 'auto'
                }}
            >
                <span style={{ gridColumn: '3 / span 2', color: '#ccc', fontSize: '14px' }}>Last Cognitive status:</span>

                <select
                    style={{
                        gridColumn: '5 / span 2',
                        padding: '8px',
                        fontSize: '14px',
                        borderRadius: '4px',
                        border: '1px solid #555',
                        backgroundColor: '#2a2a2a',
                        color: '#fff',
                        width: '100%'
                    }}
                >
                    <option value="a">Alzheimer's Disease</option>
                    <option value="b">Mild Cognitive Impairment</option>
                    <option value="c">Cognitively Normal</option>
                </select>
            </div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(8, 1fr)',
                    gap: '10px',
                    alignItems: 'center',
                    marginTop: '10px',
                    maxWidth: '800px',
                    marginLeft: 'auto',
                    marginRight: 'auto'
                }}
            >

                <button
                    onClick={handleGenerate}
                    style={{
                        gridColumn: '5 / span 2',
                        padding: '8px',
                        backgroundColor: '#007acc',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        borderRadius: '4px',
                        width: '100%'
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