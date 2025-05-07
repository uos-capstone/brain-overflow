let globalDevice: GPUDevice | null = null;

export async function getGPUDevice(): Promise<GPUDevice> {
    if (globalDevice) return globalDevice;

    const adapter: GPUAdapter | null = await navigator.gpu?.requestAdapter();
    if (!adapter) {
        throw new Error("WebGPU not supported");
    }

    globalDevice = await adapter.requestDevice({
        requiredLimits: {
            maxBufferSize: adapter.limits.maxBufferSize,
            maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,        
        },
    });
    return globalDevice;
}