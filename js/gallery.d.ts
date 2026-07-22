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
    enableLightbox?: boolean;
}
declare class MasonryGallery {
    private container;
    private readonly loader;
    private options;
    private columns;
    private allImages;
    private isFetching;
    private listeners;
    private reloaded;
    private showingSkeleton;
    private static readonly SKELETON_HEIGHTS;
    constructor(containerId: string, options: MasonryGalleryOptions);
    private init;
    private renderSkeleton;
    private createSkeletonCard;
    private setupLayout;
    private buildColumns;
    private addEventListeners;
    private reLayout;
    private handleScroll;
    private loadMoreImages;
    private toggleLoader;
    private clearSkeleton;
    private renderImages;
    private createCard;
    private addToShortestColumn;
    destroy(): void;
}
export { MasonryGallery, type ImageData };
