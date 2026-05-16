interface ImageData {
    src: string;
    title: string;
    desc: string;
}
interface MasonryGalleryOptions {
    fetchFunction: () => Promise<ImageData[]>;
    minColumnWidth?: number;
    scrollThreshold?: number;
    loaderSelector?: string;
    reload?: number;
}
declare class MasonryGallery {
    private container;
    private readonly loader;
    private options;
    private columns;
    private isFetching;
    private resizeObserver;
    private abortController;
    private reloaded;
    constructor(containerId: string, options: MasonryGalleryOptions);
    private init;
    private setupLayout;
    private buildColumns;
    private addEventListeners;
    private reLayout;
    private handleScroll;
    private loadMoreImages;
    private toggleLoader;
    private renderImages;
    private createCard;
    private addToShortestColumn;
    destroy(): void;
}
export { MasonryGallery, ImageData };
