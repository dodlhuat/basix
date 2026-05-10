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
    private static globalListenerAbortController;
    private readonly container;
    private readonly viewport;
    private readonly content;
    private readonly track;
    private readonly thumb;
    private readonly MIN_THUMB_HEIGHT;
    private readonly ro;
    private dragging;
    private activePointerId;
    private startPointerY;
    private startThumbTop;
    private readonly boundPointerMove;
    private readonly boundPointerUp;
    private readonly boundThumbPointerDown;
    private readonly boundTrackClick;
    private readonly boundViewportScroll;
    private readonly boundUpdateThumb;
    private readonly boundContainerWheel;
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
export { Scrollbar, ScrollbarElements };
