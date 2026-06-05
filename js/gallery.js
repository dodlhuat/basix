import { escapeHtml } from './utils.js';
import { Lightbox } from './lightbox.js';
class MasonryGallery {
    container;
    loader;
    options;
    columns = [];
    allImages = [];
    isFetching = false;
    resizeObserver = null;
    abortController = null;
    reloaded = 0;
    constructor(containerId, options) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container with id "${containerId}" not found`);
        }
        this.container = container;
        this.loader = document.querySelector(options.loaderSelector ?? '.loader');
        this.options = {
            minColumnWidth: options.minColumnWidth ?? 250,
            scrollThreshold: options.scrollThreshold ?? 100,
            reload: options.reload ?? 2,
            fetchFunction: options.fetchFunction,
            enableLightbox: options.enableLightbox ?? true,
        };
        this.init();
    }
    init() {
        this.setupLayout();
        this.loadMoreImages();
        this.addEventListeners();
    }
    setupLayout() {
        const containerWidth = this.container.getBoundingClientRect().width;
        const numColumns = Math.max(1, Math.floor(containerWidth / this.options.minColumnWidth));
        if (this.columns.length !== numColumns) {
            this.buildColumns(numColumns);
        }
    }
    buildColumns(count) {
        this.container.innerHTML = '';
        this.container.classList.add('masonry-container');
        this.columns = [];
        for (let i = 0; i < count; i++) {
            const col = document.createElement('div');
            col.className = 'masonry-column';
            this.container.appendChild(col);
            this.columns.push(col);
        }
    }
    addEventListeners() {
        this.abortController = new AbortController();
        const sig = this.abortController.signal;
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.reLayout(), 200);
        }, { signal: sig });
        window.addEventListener('scroll', this.handleScroll, { passive: true, signal: sig });
    }
    reLayout() {
        const items = this.columns.flatMap(col => Array.from(col.children));
        const availableWidth = Math.min(1200, window.innerWidth - 40);
        const numColumns = Math.max(1, Math.floor(availableWidth / this.options.minColumnWidth));
        if (this.columns.length !== numColumns) {
            this.buildColumns(numColumns);
        }
        else {
            this.columns.forEach(col => { col.innerHTML = ''; });
        }
        items.forEach(item => this.addToShortestColumn(item));
    }
    handleScroll = () => {
        if (this.isFetching)
            return;
        const rect = this.container.getBoundingClientRect();
        if (rect.bottom > 0 && rect.bottom <= window.innerHeight + this.options.scrollThreshold) {
            this.loadMoreImages();
        }
    };
    async loadMoreImages(isAutoFill = false) {
        if (!isAutoFill)
            this.reloaded++;
        if (this.options.reload > 0 && this.reloaded > this.options.reload) {
            console.warn('Maximum reload limit reached.');
            return;
        }
        if (this.isFetching)
            return;
        this.isFetching = true;
        this.toggleLoader(true);
        try {
            const newImages = await this.options.fetchFunction();
            this.renderImages(newImages);
        }
        catch (error) {
            console.error('MasonryGallery: error loading images', error);
        }
        finally {
            this.isFetching = false;
            this.toggleLoader(false);
            requestAnimationFrame(() => {
                const rect = this.container.getBoundingClientRect();
                if (rect.bottom <= window.innerHeight + this.options.scrollThreshold) {
                    this.loadMoreImages(true);
                }
            });
        }
    }
    toggleLoader(show) {
        if (this.loader) {
            this.loader.classList.toggle('hidden', !show);
        }
    }
    renderImages(imageDataList) {
        const startIndex = this.allImages.length;
        this.allImages.push(...imageDataList);
        const sorted = [...this.columns].sort((a, b) => a.offsetHeight - b.offsetHeight);
        imageDataList.forEach((data, i) => {
            const item = this.createCard(data);
            if (this.options.enableLightbox) {
                const index = startIndex + i;
                item.addEventListener('click', () => {
                    new Lightbox({
                        images: this.allImages.map(img => ({
                            src: img.src,
                            alt: img.title,
                            caption: img.desc,
                        })),
                        startIndex: index,
                    }).show();
                });
            }
            const col = sorted[i % sorted.length];
            col.appendChild(item);
            requestAnimationFrame(() => {
                const img = item.querySelector('img');
                if (img) {
                    img.addEventListener('load', () => img.classList.add('loaded'), {
                        once: true,
                    });
                    if (img.complete) {
                        img.classList.add('loaded');
                    }
                }
            });
        });
    }
    createCard(data) {
        const div = document.createElement('div');
        div.className = 'masonry-item';
        div.innerHTML = `
            <img src="${escapeHtml(data.src)}" alt="${escapeHtml(data.title)}" loading="lazy">
            <div class="masonry-item-info">
                <h3 class="masonry-item-title">${escapeHtml(data.title)}</h3>
                <p class="masonry-item-desc">${escapeHtml(data.desc)}</p>
            </div>
        `;
        return div;
    }
    addToShortestColumn(element) {
        if (this.columns.length === 0)
            return;
        let shortestCol = this.columns[0];
        let minHeight = shortestCol.offsetHeight;
        for (let i = 1; i < this.columns.length; i++) {
            const h = this.columns[i].offsetHeight;
            if (h < minHeight) {
                minHeight = h;
                shortestCol = this.columns[i];
            }
        }
        shortestCol.appendChild(element);
    }
    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        this.allImages = [];
    }
}
export { MasonryGallery };
