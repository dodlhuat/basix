/** A single image entry for the Lightbox gallery. */
interface LightboxImage {
    src: string;
    alt?: string;
    caption?: string;
}
/** Configuration options for a Lightbox instance. */
interface LightboxOptions {
    src?: string;
    alt?: string;
    caption?: string;
    closeable?: boolean;
    images?: LightboxImage[];
    startIndex?: number;
    onOpen?: () => void;
    onClose?: () => void;
}
/** Full-screen image viewer with gallery navigation, zoom, and touch support. */
declare class Lightbox {
    private images;
    private currentIndex;
    private readonly closeable;
    private readonly onOpen?;
    private readonly onClose?;
    private wrapper;
    private imgEl;
    private captionEl;
    private counterEl;
    private isZoomed;
    private abortController;
    constructor(options: LightboxOptions);
    show(): void;
    hide(): void;
    next(): void;
    prev(): void;
    isVisible(): boolean;
    destroy(): void;
    private loadImage;
    private preloadAdjacent;
    private updateNav;
    private toggleZoom;
    private handleKeydown;
    private trapFocus;
    private handleBackgroundClick;
    private addTouchSupport;
    private buildTemplate;
    static bind(selector?: string): void;
}
export { Lightbox, type LightboxOptions, type LightboxImage };
