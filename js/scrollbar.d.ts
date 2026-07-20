interface ScrollbarElements {
    viewport: HTMLElement;
    content: HTMLElement;
    track: HTMLElement;
    thumb: HTMLElement;
}
declare class Scrollbar {
    private static readonly instances;
    private static activeInstance;
    private static globalListenersInstalled;
    private static instanceCount;
    private static globalListeners;
    private readonly container;
    private readonly viewport;
    private readonly content;
    private readonly track;
    private readonly thumb;
    private readonly MIN_THUMB_HEIGHT;
    private readonly resizeObserver;
    private dragging;
    private activePointerId;
    private startPointerY;
    private startThumbTop;
    private listeners;
    private constructor();
    private getRequiredElements;
    private getMinThumbHeight;
    private static installGlobalListeners;
    private attachEventListeners;
    private updateThumb;
    private handleThumbPointerDown;
    private handlePointerMove;
    private handlePointerUp;
    private handleTrackClick;
    private handleContainerWheel;
    destroy(): void;
    static create(elementOrSelector: string | HTMLElement): Scrollbar;
    static initAll(selector: string): Scrollbar[];
    static initOne(elementOrSelector: string | HTMLElement): Scrollbar;
    static getInstance(container: HTMLElement): Scrollbar | undefined;
}
export { Scrollbar, type ScrollbarElements };
