interface FileData {
    file: File;
    element: HTMLDivElement;
}

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

class FileUploader {
    private container: HTMLElement;
    private dropZone: HTMLElement;
    private fileInput: HTMLInputElement;
    private fileList: HTMLElement;
    private uploadBtn: HTMLButtonElement;
    private files: Map<string, FileData> = new Map();
    private uploadUrl: string;
    private maxFileSize?: number;
    private allowedTypes?: string[];
    private abortControllers: Map<string, () => void> = new Map();

    constructor(elementOrSelector: string | HTMLElement, config: FileUploaderConfig = {}) {
        const container = typeof elementOrSelector === 'string'
            ? document.querySelector<HTMLElement>(elementOrSelector)
            : elementOrSelector;

        if (!container) {
            throw new Error(`FileUploader: Element not found for selector "${elementOrSelector}"`);
        }

        this.container = container;

        const dropZone = container.querySelector<HTMLElement>('#drop-zone');
        const fileInput = container.querySelector<HTMLInputElement>('#file-input');
        const fileList = container.querySelector<HTMLElement>('#file-list');
        const uploadBtn = container.querySelector<HTMLButtonElement>('#upload-btn');

        if (!dropZone || !fileInput || !fileList || !uploadBtn) {
            throw new Error('Required elements not found in container');
        }

        this.dropZone = dropZone;
        this.fileInput = fileInput;
        this.fileList = fileList;
        this.uploadBtn = uploadBtn;

        this.uploadUrl = config.uploadUrl ?? 'https://httpbin.org/post';
        this.maxFileSize = config.maxFileSize;
        this.allowedTypes = config.allowedTypes;

        this.init();
    }

    private init(): void {
        this.setupEventListeners();
    }

    private fileKey(file: File): string {
        return `${file.name}-${file.size}-${file.lastModified}`;
    }

    private setupEventListeners(): void {
        (['dragenter', 'dragover', 'dragleave', 'drop'] as const).forEach(event => {
            this.dropZone.addEventListener(event, this.preventDefaults);
        });

        (['dragenter', 'dragover'] as const).forEach(event => {
            this.dropZone.addEventListener(event, this.handleDragEnter);
        });

        (['dragleave', 'drop'] as const).forEach(event => {
            this.dropZone.addEventListener(event, this.handleDragLeave);
        });

        this.dropZone.addEventListener('drop', this.handleDrop);
        this.dropZone.addEventListener('click', this.handleDropZoneClick);
        this.fileInput.addEventListener('change', this.handleFileInputChange);
        this.uploadBtn.addEventListener('click', this.handleUploadClick);
    }

    private preventDefaults = (e: Event): void => {
        e.preventDefault();
        e.stopPropagation();
    };

    private handleDragEnter = (): void => {
        this.dropZone.classList.add('drag-over');
    };

    private handleDragLeave = (): void => {
        this.dropZone.classList.remove('drag-over');
    };

    private handleDrop = (e: DragEvent): void => {
        const droppedFiles = e.dataTransfer?.files;
        if (droppedFiles) {
            this.handleFiles(droppedFiles);
        }
    };

    private handleDropZoneClick = (): void => {
        this.fileInput.click();
    };

    private handleFileInputChange = (e: Event): void => {
        const target = e.target as HTMLInputElement;
        if (target.files) {
            this.handleFiles(target.files);
            target.value = '';
        }
    };

    private handleUploadClick = async (): Promise<void> => {
        if (this.files.size === 0) return;

        this.uploadBtn.disabled = true;
        this.uploadBtn.textContent = 'Uploading...';

        const uploadPromises = Array.from(this.files.values()).map(({ file, element }) =>
            this.uploadFile(file, element)
        );

        const results = await Promise.allSettled(uploadPromises);

        this.uploadBtn.textContent = 'Upload Complete';

        setTimeout(() => {
            this.dispatchUploadCompletedEvent(results);
            this.fileList.innerHTML = '';
            this.files.clear();
            this.updateUploadButton();
        }, 1500);
    };

    private handleFiles(fileList: FileList): void {
        Array.from(fileList).forEach(file => {
            const key = this.fileKey(file);
            if (this.validateFile(file) && !this.files.has(key)) {
                const element = this.addFileToUI(file);
                this.files.set(key, { file, element });
            }
        });
        this.updateUploadButton();
    }

    private validateFile(file: File): boolean {
        if (this.maxFileSize && file.size > this.maxFileSize) {
            this.container.dispatchEvent(new CustomEvent<FileValidationErrorDetail>('file-validation-error', {
                detail: { file, reason: 'size' },
                bubbles: true,
            }));
            return false;
        }

        if (this.allowedTypes && !this.allowedTypes.includes(file.type)) {
            this.container.dispatchEvent(new CustomEvent<FileValidationErrorDetail>('file-validation-error', {
                detail: { file, reason: 'type' },
                bubbles: true,
            }));
            return false;
        }

        return true;
    }

    private addFileToUI(file: File): HTMLDivElement {
        const key = this.fileKey(file);
        const item = document.createElement('div');
        item.className = 'file-item';

        const escapedFileName = this.escapeHtml(file.name);

        item.innerHTML = `
      <div class="file-item-header">
        <div class="file-info">
          <div class="file-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
              <polyline points="13 2 13 9 20 9"></polyline>
            </svg>
          </div>
          <div class="file-details">
            <span class="file-name" title="${escapedFileName}">${escapedFileName}</span>
            <span class="file-size">${this.formatSize(file.size)}</span>
          </div>
        </div>
        <button class="remove-btn" type="button" aria-label="Remove file">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="progress-container">
        <div class="progress-bar"></div>
      </div>
      <div class="status-text">Waiting...</div>
    `;

        const removeBtn = item.querySelector<HTMLButtonElement>('.remove-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFile(key);
            });
        }

        this.fileList.appendChild(item);
        return item;
    }

    private uploadFile(file: File, element: HTMLDivElement): Promise<unknown> {
        return new Promise((resolve, reject) => {
            const progressContainer = element.querySelector<HTMLElement>('.progress-container');
            const progressBar = element.querySelector<HTMLElement>('.progress-bar');
            const statusText = element.querySelector<HTMLElement>('.status-text');
            const removeBtn = element.querySelector<HTMLElement>('.remove-btn');

            if (!progressContainer || !progressBar || !statusText || !removeBtn) {
                reject(new Error('Required UI elements not found'));
                return;
            }

            progressContainer.style.display = 'block';
            statusText.style.display = 'block';
            statusText.textContent = '0%';
            removeBtn.style.display = 'none';

            const xhr = new XMLHttpRequest();
            const key = this.fileKey(file);
            this.abortControllers.set(key, () => xhr.abort());

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const pct = Math.round((e.loaded / e.total) * 100);
                    progressBar.style.width = pct + '%';
                    statusText.textContent = pct + '%';
                }
            });

            xhr.addEventListener('load', () => {
                this.abortControllers.delete(key);
                if (xhr.status >= 200 && xhr.status < 300) {
                    progressBar.style.width = '100%';
                    progressBar.style.backgroundColor = 'var(--success)';
                    statusText.textContent = 'Completed';
                    statusText.classList.add('success');
                    try {
                        resolve(JSON.parse(xhr.responseText));
                    } catch {
                        resolve(xhr.responseText);
                    }
                } else {
                    progressBar.style.backgroundColor = 'var(--error)';
                    statusText.textContent = 'Failed';
                    statusText.classList.add('error');
                    removeBtn.style.display = 'flex';
                    reject(new Error(`Upload failed: ${xhr.statusText}`));
                }
            });

            xhr.addEventListener('error', () => {
                this.abortControllers.delete(key);
                progressBar.style.backgroundColor = 'var(--error)';
                statusText.textContent = 'Network Error';
                statusText.classList.add('error');
                removeBtn.style.display = 'flex';
                reject(new Error('Network error'));
            });

            xhr.addEventListener('abort', () => {
                this.abortControllers.delete(key);
                statusText.textContent = 'Cancelled';
                statusText.classList.add('error');
                removeBtn.style.display = 'flex';
                reject(new Error('Upload aborted'));
            });

            const formData = new FormData();
            formData.append('file', file);
            xhr.open('POST', this.uploadUrl);
            xhr.send(formData);
        });
    }

    private removeFile(key: string): void {
        const abort = this.abortControllers.get(key);
        if (abort) abort();

        const fileData = this.files.get(key);
        if (fileData) {
            fileData.element.remove();
            this.files.delete(key);
            this.updateUploadButton();
        }
    }

    private updateUploadButton(): void {
        this.uploadBtn.disabled = this.files.size === 0;
        this.uploadBtn.textContent = this.files.size > 0
            ? `Upload ${this.files.size} File${this.files.size === 1 ? '' : 's'}`
            : 'Upload Files';
    }

    private dispatchUploadCompletedEvent(results: PromiseSettledResult<unknown>[]): void {
        const files = Array.from(this.files.values()).map(({ file }) => file);
        this.container.dispatchEvent(new CustomEvent<UploadCompletedDetail>('upload-completed', {
            detail: { fileCount: this.files.size, files, results },
            bubbles: true,
        }));
    }

    private formatSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'] as const;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    public destroy(): void {
        this.abortControllers.forEach(abort => abort());
        this.abortControllers.clear();

        (['dragenter', 'dragover', 'dragleave', 'drop'] as const).forEach(event => {
            this.dropZone.removeEventListener(event, this.preventDefaults);
        });
        (['dragenter', 'dragover'] as const).forEach(event => {
            this.dropZone.removeEventListener(event, this.handleDragEnter);
        });
        (['dragleave', 'drop'] as const).forEach(event => {
            this.dropZone.removeEventListener(event, this.handleDragLeave);
        });
        this.dropZone.removeEventListener('drop', this.handleDrop);
        this.dropZone.removeEventListener('click', this.handleDropZoneClick);
        this.fileInput.removeEventListener('change', this.handleFileInputChange);
        this.uploadBtn.removeEventListener('click', this.handleUploadClick);

        this.files.clear();
        this.fileList.innerHTML = '';
    }
}

export { FileUploader };
export type { FileUploaderConfig, UploadCompletedDetail, FileValidationErrorDetail };
