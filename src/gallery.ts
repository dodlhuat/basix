import { escapeHtml } from './utils.js';
import { Lightbox } from './lightbox.js';

/** A single image record for MasonryGallery. */
interface ImageData {
    src: string;
    title: string;
    desc: string;
}

/** Configuration options for MasonryGallery. */
interface MasonryGalleryOptions {
    fetchFunction: () => Promise<ImageData[]>;
    minColumnWidth?: number;
    scrollThreshold?: number;
    loaderSelector?: string;
    reload?: number;
    enableLightbox?: boolean;
}

/** Infinite-scroll masonry gallery that distributes images across dynamically sized columns. */
class MasonryGallery {
    private container: HTMLElement;
    private readonly loader: HTMLElement | null;
    private options: Required<Omit<MasonryGalleryOptions, 'loaderSelector'>>;
    private columns: HTMLDivElement[] = [];
    private allImages: ImageData[] = [];
    private isFetching: boolean = false;
    private resizeObserver: ResizeObserver | null = null;
    private abortController: AbortController | null = null;
    private reloaded = 0;

    constructor(containerId: string, options: MasonryGalleryOptions) {
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

    private init(): void {
        this.setupLayout();
        this.loadMoreImages();
        this.addEventListeners();
    }

    private setupLayout(): void {
        const containerWidth = this.container.getBoundingClientRect().width;
        const numColumns = Math.max(1, Math.floor(containerWidth / this.options.minColumnWidth));
        if (this.columns.length !== numColumns) {
            this.buildColumns(numColumns);
        }
    }

    private buildColumns(count: number): void {
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

    private addEventListeners(): void {
        this.abortController = new AbortController();
        const sig = this.abortController.signal;

        let resizeTimeout: number;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.reLayout(), 200);
        }, { signal: sig });

        window.addEventListener('scroll', this.handleScroll, { passive: true, signal: sig });
    }

    private reLayout(): void {
        const items = this.columns.flatMap(col => Array.from(col.children) as HTMLElement[]);

        const availableWidth = Math.min(1200, window.innerWidth - 40);
        const numColumns = Math.max(1, Math.floor(availableWidth / this.options.minColumnWidth));

        if (this.columns.length !== numColumns) {
            this.buildColumns(numColumns);
        } else {
            this.columns.forEach(col => { col.innerHTML = ''; });
        }

        items.forEach(item => this.addToShortestColumn(item));
    }

    private handleScroll = (): void => {
        if (this.isFetching) return;

        const rect = this.container.getBoundingClientRect();
        if (rect.bottom > 0 && rect.bottom <= window.innerHeight + this.options.scrollThreshold) {
            this.loadMoreImages();
        }
    }

    private async loadMoreImages(isAutoFill = false): Promise<void> {
        if (!isAutoFill) this.reloaded++;
        if (this.options.reload > 0 && this.reloaded > this.options.reload) {
            console.warn('Maximum reload limit reached.');
            return;
        }
        if (this.isFetching) return;

        this.isFetching = true;
        this.toggleLoader(true);

        try {
            const newImages = await this.options.fetchFunction();
            this.renderImages(newImages);
        } catch (error) {
            console.error('MasonryGallery: error loading images', error);
        } finally {
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

    private toggleLoader(show: boolean): void {
        if (this.loader) {
            this.loader.classList.toggle('hidden', !show);
        }
    }

    private renderImages(imageDataList: ImageData[]): void {
        const startIndex = this.allImages.length;
        this.allImages.push(...imageDataList);

        // Sort columns by current height so we start filling from the shortest.
        // Then round-robin across them — this avoids the problem where unloaded
        // images (0 height) cause offsetHeight-based distribution to pile all
        // new items into a single column.
        const sorted = [...this.columns].sort(
            (a, b) => a.offsetHeight - b.offsetHeight,
        );

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

    private createCard(data: ImageData): HTMLDivElement {
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

    private addToShortestColumn(element: HTMLElement): void {
        if (this.columns.length === 0) return;

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

    public destroy(): void {
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

export { MasonryGallery, type ImageData };
