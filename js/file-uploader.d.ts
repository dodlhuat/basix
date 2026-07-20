interface UploadCompletedDetail {
    fileCount: number;
    files: File[];
    results: PromiseSettledResult<unknown>[];
}
interface FileValidationErrorDetail {
    file: File;
    reason: 'size' | 'type';
}
interface FileUploaderConfig {
    uploadUrl?: string;
    maxFileSize?: number;
    allowedTypes?: string[];
}
declare class FileUploader {
    private container;
    private dropZone;
    private fileInput;
    private fileList;
    private uploadBtn;
    private files;
    private uploadUrl;
    private maxFileSize?;
    private allowedTypes?;
    private xhrAborts;
    private listeners;
    constructor(elementOrSelector: string | HTMLElement, config?: FileUploaderConfig);
    private fileKey;
    private setupEventListeners;
    private handleFiles;
    private validateFile;
    private addFileToUI;
    private uploadFile;
    private removeFile;
    private updateUploadButton;
    private dispatchUploadCompletedEvent;
    private formatSize;
    destroy(): void;
}
export { FileUploader };
export type { FileUploaderConfig, UploadCompletedDetail, FileValidationErrorDetail };
