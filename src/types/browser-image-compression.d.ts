declare module 'browser-image-compression' {
    interface Options {
        maxSizeMB?: number;
        maxWidthOrHeight?: number;
        onProgress?: (progress: number) => void;
        useWebWorker?: boolean;
        fileType?: string;
    }

    function imageCompression(file: File, options?: Options): Promise<File>;

    export default imageCompression;
}
