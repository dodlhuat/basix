import { escapeHtml } from './utils.js';
import { Lightbox } from './lightbox.js';
import { ListenerGroup } from './listeners.js';

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
    private listeners = new ListenerGroup();
    private reloaded = 0;
    private showingSkeleton = false;

    private static readonly SKELETON_HEIGHTS = [180, 260, 220, 300, 240, 190];

    public constructor(containerId: string, options: MasonryGalleryOptions) {
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
        this.renderSkeleton();
        this.loadMoreImages();
        this.addEventListeners();
    }

    private renderSkeleton(): void {
        this.showingSkeleton = true;

        this.columns.forEach((col, colIndex) => {
            for (let i = 0; i < 2; i++) {
                const height = MasonryGallery.SKELETON_HEIGHTS[(colIndex + i) % MasonryGallery.SKELETON_HEIGHTS.length];
                col.appendChild(this.createSkeletonCard(height));
            }
        });
    }

    private createSkeletonCard(height: number): HTMLDivElement {
        const div = document.createElement('div');
        div.className = 'masonry-item masonry-item--skeleton';
        div.setAttribute('aria-hidden', 'true');
        div.innerHTML = `
            <div class="masonry-item-skeleton-img" style="height:${height}px"></div>
            <div class="masonry-item-info">
                <div class="placeholder w-8" style="display: block;"></div>
                <div class="placeholder w-5" style="display: block; margin-top: 6px;"></div>
            </div>
        `;
        return div;
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
        const sig = { signal: this.listeners.signal };

        let resizeTimeout: number;
        window.addEventListener(
            'resize',
            () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => this.reLayout(), 200);
            },
            sig,
        );

        window.addEventListener('scroll', () => this.handleScroll(), { ...sig, passive: true });
    }

    private reLayout(): void {
        const items = this.columns.flatMap((col) => Array.from(col.children) as HTMLElement[]);

        const availableWidth = Math.min(1200, window.innerWidth - 40);
        const numColumns = Math.max(1, Math.floor(availableWidth / this.options.minColumnWidth));

        if (this.columns.length !== numColumns) {
            this.buildColumns(numColumns);
        } else {
            this.columns.forEach((col) => {
                col.innerHTML = '';
            });
        }

        items.forEach((item) => this.addToShortestColumn(item));
    }

    private handleScroll(): void {
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
            this.clearSkeleton();
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

    private clearSkeleton(): void {
        if (!this.showingSkeleton) return;

        this.showingSkeleton = false;
        this.columns.forEach((col) => {
            col.innerHTML = '';
        });
    }

    private renderImages(imageDataList: ImageData[]): void {
        this.clearSkeleton();

        const startIndex = this.allImages.length;
        this.allImages.push(...imageDataList);

        // Sort columns by current height so we start filling from the shortest.
        // Then round-robin across them — this avoids the problem where unloaded
        // images (0 height) cause offsetHeight-based distribution to pile all
        // new items into a single column.
        const sorted = [...this.columns].sort((a, b) => a.offsetHeight - b.offsetHeight);

        imageDataList.forEach((data, i) => {
            const item = this.createCard(data);

            if (this.options.enableLightbox) {
                const index = startIndex + i;
                item.addEventListener('click', () => {
                    new Lightbox({
                        images: this.allImages.map((img) => ({
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
        this.listeners.destroy();
        this.allImages = [];
    }
}

export { MasonryGallery, type ImageData };
