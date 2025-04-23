import React, { useEffect, useRef } from 'react';
import * as nifti from 'nifti-reader-js';
import { main } from './MRIRender';
import { getGPUDevice } from './GPUDevice';

interface NiiFile {
    name: string;
    active: boolean;
    file: File;
}

interface CanvasAreaProps {
    activeFile: NiiFile | null;
}

function CanvasArea({ activeFile }: CanvasAreaProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (!activeFile || !activeFile.file) return;

        const readAndRender = async () => {
            const device = await getGPUDevice();
            const fileBuffer = await activeFile.file.arrayBuffer();

            if (!nifti.isCompressed(fileBuffer) && nifti.isNIFTI(fileBuffer)) {
                const header = nifti.readHeader(fileBuffer);
                const dims: [number, number, number] = [
                    header.dims[1],
                    header.dims[2],
                    header.dims[3],
                ];

                const imageData = nifti.readImage(header, fileBuffer);
                const raw = new Int16Array(imageData);

                let min = Infinity;
                let max = -Infinity;

                for (let i = 0; i < raw.length; i++) {
                    if (raw[i] < min) min = raw[i];
                    if (raw[i] > max) max = raw[i];
                }

                const voxel = new Float32Array(raw.length);
                for (let i = 0; i < raw.length; i++) {
                    voxel[i] = (raw[i] - min) / (max - min);
                    // voxel[i] = raw[i]; // 원본 값을 그대로 쓰고 싶다면 이 줄 사용
                }

                const affine = new Float32Array((header as any).affine.flat());

                if (canvasRef.current) {
                    await main(canvasRef.current, voxel, dims, affine, device);
                }
            } else {
                alert('Not a valid NIfTI file.');
            }
        };

        readAndRender();
    }, [activeFile]);

    return (
        <canvas
            id="canvas"
            ref={canvasRef}
            style={{ width: '100%', height: '100%', flex: 1, backgroundColor: '#000' }}
        />
    );
}

export default CanvasArea;