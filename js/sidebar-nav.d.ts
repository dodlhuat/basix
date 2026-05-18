/** Configuration options for a SidebarNav instance. */
interface SidebarNavOptions {
    /** Selector for the toggle button. Default: '.sidebar-toggle' */
    toggleSelector?: string;
    /** Breakpoint (px) above which the sidebar is always visible. Default: 768 */
    breakpoint?: number;
    /** Minimum horizontal swipe distance (px) to trigger open/close. Default: 60 */
    swipeThreshold?: number;
    /** Width of the left-edge zone (px) that triggers open on swipe-right. Default: 20 */
    swipeEdge?: number;
}
/** Collapsible sidebar navigation with backdrop, swipe gestures, and responsive breakpoint support. */
declare class SidebarNav {
    private nav;
    private backdrop;
    private toggleBtn;
    private closeBtn;
    private opts;
    private _touchStartX;
    private _touchStartY;
    private _onToggle;
    private _onBackdrop;
    private _onResize;
    private _onClose;
    private _onTouchStart;
    private _onTouchEnd;
    constructor(containerOrSelector: string | HTMLElement, options?: SidebarNavOptions);
    open(): void;
    close(): void;
    toggle(): void;
    isOpen(): boolean;
    destroy(): void;
}
export { SidebarNav, SidebarNavOptions };
