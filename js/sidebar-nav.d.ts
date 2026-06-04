interface SidebarNavOptions {
    toggleSelector?: string;
    breakpoint?: number;
    swipeThreshold?: number;
    swipeEdge?: number;
}
declare class SidebarNav {
    private nav;
    private backdrop;
    private toggleBtn;
    private closeBtn;
    private opts;
    private touchStartX;
    private touchStartY;
    private abortController;
    constructor(containerOrSelector: string | HTMLElement, options?: SidebarNavOptions);
    open(): void;
    close(): void;
    toggle(): void;
    isOpen(): boolean;
    destroy(): void;
}
export { SidebarNav, type SidebarNavOptions };
