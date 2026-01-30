class FileUploader {
    constructor(elementOrSelector, config = {}) {
        this.files = new Map();
        this.abortControllers = new Map();
        this.preventDefaults = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };
        this.handleDragEnter = () => {
            this.dropZone.classList.add('drag-over');
        };
        this.handleDragLeave = () => {
            this.dropZone.classList.remove('drag-over');
        };
        this.handleDrop = (e) => {
            const droppedFiles = e.dataTransfer?.files;
            if (droppedFiles) {
                this.handleFiles(droppedFiles);
            }
        };
        this.handleDropZoneClick = () => {
            this.fileInput.click();
        };
        this.handleFileInputChange = (e) => {
            const target = e.target;
            if (target.files) {
                this.handleFiles(target.files);
                target.value = ''; // Reset input so same file can be selected again
            }
        };
        this.handleUploadClick = async () => {
            if (this.files.size === 0)
                return;
            this.uploadBtn.disabled = true;
            this.uploadBtn.textContent = 'Uploading...';
            const uploadPromises = Array.from(this.files.values()).map(({ file, element }) => this.uploadFile(file, element));
            const results = await Promise.allSettled(uploadPromises);
            this.uploadBtn.textContent = 'Upload Complete';
            setTimeout(() => {
                this.dispatchUploadCompletedEvent(results);
                this.cleanupAfterUpload();
                this.resetUploadState();
            }, 1000);
        };
        const container = typeof elementOrSelector === 'string'
            ? document.querySelector(elementOrSelector)
            : elementOrSelector;
        if (!container) {
            throw new Error(`FileUploader: Element not found for selector "${elementOrSelector}"`);
        }
        this.container = container;
        const dropZone = container.querySelector('#drop-zone');
        const fileInput = container.querySelector('#file-input');
        const fileList = container.querySelector('#file-list');
        const uploadBtn = container.querySelector('#upload-btn');
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
    init() {
        this.setupEventListeners();
    }
    setupEventListeners() {
        // Drag & Drop - prevent default browser behavior
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, this.preventDefaults);
        });
        // Drag over effects
        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, this.handleDragEnter);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, this.handleDragLeave);
        });
        this.dropZone.addEventListener('drop', this.handleDrop);
        this.dropZone.addEventListener('click', this.handleDropZoneClick);
        this.fileInput.addEventListener('change', this.handleFileInputChange);
        this.uploadBtn.addEventListener('click', this.handleUploadClick);
    }
    handleFiles(fileList) {
        Array.from(fileList).forEach(file => {
            if (this.validateFile(file) && !this.files.has(file.name)) {
                const element = this.addFileToUI(file);
                this.files.set(file.name, { file, element });
            }
        });
        this.updateUploadButton();
    }
    validateFile(file) {
        if (this.maxFileSize && file.size > this.maxFileSize) {
            console.warn(`File ${file.name} exceeds maximum size`);
            return false;
        }
        if (this.allowedTypes && !this.allowedTypes.includes(file.type)) {
            console.warn(`File type ${file.type} is not allowed`);
            return false;
        }
        return true;
    }
    addFileToUI(file) {
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
      <div class="progress-container" style="display: none;">
        <div class="progress-bar"></div>
      </div>
      <div class="status-text" style="display: none;">Waiting...</div>
    `;
        const removeBtn = item.querySelector('.remove-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFile(file.name);
            });
        }
        this.fileList.appendChild(item);
        return item;
    }
    async uploadFile(file, element) {
        const progressContainer = element.querySelector('.progress-container');
        const progressBar = element.querySelector('.progress-bar');
        const statusText = element.querySelector('.status-text');
        const removeBtn = element.querySelector('.remove-btn');
        if (!progressContainer || !progressBar || !statusText || !removeBtn) {
            throw new Error('Required UI elements not found');
        }
        // Show progress elements
        progressContainer.style.display = 'block';
        statusText.style.display = 'block';
        removeBtn.style.display = 'none';
        const abortController = new AbortController();
        this.abortControllers.set(file.name, abortController);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch(this.uploadUrl, {
                method: 'POST',
                body: formData,
                signal: abortController.signal,
            });
            // Note: Fetch API doesn't support upload progress natively
            // For progress tracking, you'd need to use XMLHttpRequest or a library
            progressBar.style.width = '100%';
            statusText.textContent = '100%';
            if (response.ok) {
                statusText.textContent = 'Completed';
                statusText.classList.add('success');
                progressBar.style.backgroundColor = 'var(--success-color)';
                return await response.json();
            }
            else {
                throw new Error(`Upload failed: ${response.statusText}`);
            }
        }
        catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                statusText.textContent = 'Cancelled';
            }
            else {
                statusText.textContent = error instanceof Error ? 'Error' : 'Network Error';
            }
            statusText.classList.add('error');
            progressBar.style.backgroundColor = 'var(--error-color)';
            removeBtn.style.display = 'flex';
            throw error;
        }
        finally {
            this.abortControllers.delete(file.name);
        }
    }
    removeFile(fileName) {
        // Cancel upload if in progress
        const abortController = this.abortControllers.get(fileName);
        if (abortController) {
            abortController.abort();
        }
        const fileData = this.files.get(fileName);
        if (fileData) {
            fileData.element.remove();
            this.files.delete(fileName);
            this.updateUploadButton();
        }
    }
    updateUploadButton() {
        this.uploadBtn.disabled = this.files.size === 0;
        this.uploadBtn.textContent =
            this.files.size > 0
                ? `Upload ${this.files.size} File${this.files.size === 1 ? '' : 's'}`
                : 'Upload Files';
    }
    dispatchUploadCompletedEvent(results) {
        const files = Array.from(this.files.values()).map(({ file }) => file);
        const event = new CustomEvent('upload-completed', {
            detail: {
                fileCount: this.files.size,
                files,
                results,
            },
            bubbles: true,
        });
        this.container.dispatchEvent(event);
    }
    cleanupAfterUpload() {
        const progressContainers = this.fileList.querySelectorAll('.progress-container');
        progressContainers.forEach(el => el.remove());
        const statusTexts = this.fileList.querySelectorAll('.status-text');
        statusTexts.forEach(el => el.remove());
        const removeBtns = this.fileList.querySelectorAll('.remove-btn');
        removeBtns.forEach(btn => (btn.style.display = 'flex'));
    }
    resetUploadState() {
        this.files.clear();
        this.updateUploadButton();
    }
    formatSize(bytes) {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    destroy() {
        // Cancel all ongoing uploads
        this.abortControllers.forEach(controller => controller.abort());
        this.abortControllers.clear();
        // Clear files
        this.files.clear();
        // Remove event listeners would require storing bound handlers
        // For now, removing elements will clean up
        this.fileList.innerHTML = '';
    }
}
export { FileUploader };
