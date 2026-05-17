/** Configuration options for a SidebarNav instance. */
interface SidebarNavOptions {
    /** Selector for the toggle button. Default: '.sidebar-toggle' */
    toggleSelector?: string;
    /** Breakpoint (px) above which the sidebar is always visible. Default: 768 */
    breakpoint?: number;
}
/** Collapsible sidebar navigation with backdrop and responsive breakpoint support. */
declare class SidebarNav {
    private nav;
    private backdrop;
    private toggleBtn;
    private opts;
    private _onToggle;
    private _onBackdrop;
    private _onResize;
    constructor(containerOrSelector: string | HTMLElement, options?: SidebarNavOptions);
    open(): void;
    close(): void;
    toggle(): void;
    isOpen(): boolean;
    destroy(): void;
}
export { SidebarNav, SidebarNavOptions };
