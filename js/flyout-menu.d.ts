/** Configuration options for the FlyoutMenu. */
interface FlyoutMenuOptions {
    triggerSelector?: string;
    menuSelector?: string;
    overlaySelector?: string;
    closeSelector?: string;
    submenuToggleSelector?: string;
    linkSelector?: string;
    direction?: 'right' | 'left';
    title?: string;
    footerText?: string;
    enableHeader?: boolean;
    enableFooter?: boolean;
}
/** Off-canvas flyout navigation with nested submenu support. */
declare class FlyoutMenu {
    private options;
    private menuTrigger;
    private readonly flyoutMenu;
    private flyoutOverlay;
    private closeBtn;
    private submenuToggles;
    private menuLinks;
    private abortController;
    constructor(options?: FlyoutMenuOptions);
    private init;
    private hydrateMenu;
    private processListItems;
    private renderHeader;
    private renderFooter;
    private bindEvents;
    open: () => void;
    close: () => void;
    private handleSubmenu;
    private handleKeydown;
    setDirection(direction: 'left' | 'right'): void;
    destroy(): void;
}
export { FlyoutMenu, type FlyoutMenuOptions };
