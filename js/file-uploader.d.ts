/** Event detail payload for the `upload-completed` custom event. */
interface UploadCompletedDetail {
    fileCount: number;
    files: File[];
    results: PromiseSettledResult<unknown>[];
}
/** Event detail payload for the `file-validation-error` custom event. */
interface FileValidationErrorDetail {
    file: File;
    reason: 'size' | 'type';
}
/** Configuration options for the FileUploader. */
interface FileUploaderConfig {
    uploadUrl?: string;
    maxFileSize?: number;
    allowedTypes?: string[];
}
/** Drag-and-drop file uploader with progress tracking and XHR-based uploads. */
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
    private abortControllers;
    constructor(elementOrSelector: string | HTMLElement, config?: FileUploaderConfig);
    private init;
    private fileKey;
    private setupEventListeners;
    private preventDefaults;
    private handleDragEnter;
    private handleDragLeave;
    private handleDrop;
    private handleDropZoneClick;
    private handleFileInputChange;
    private handleUploadClick;
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
