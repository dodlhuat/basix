type TabLayout = 'horizontal' | 'vertical';
type MenuPosition = 'top' | 'bottom' | 'left' | 'right';
/** Configuration options for a Tabs instance. */
interface TabsOptions {
    layout?: TabLayout;
    defaultTab?: number;
    menuPos?: MenuPosition;
    onChange?: (index: number) => void;
}
/** Tabbed content component with horizontal/vertical layouts and keyboard navigation. */
declare class Tabs {
    private container;
    private options;
    private tabItems;
    private tabPanels;
    private currentTab;
    constructor(elementOrSelector: string | HTMLElement, options?: TabsOptions);
    /**
     * Initializes the tabs component
     */
    private init;
    /**
     * Binds click events to tab items
     */
    private bindEvents;
    /**
     * Handles keyboard navigation (Arrow keys, Home, End)
     */
    private handleKeyboardNavigation;
    /**
     * Activates a tab by index
     */
    private activateTab;
    /**
     * Public API: Programmatically activate a tab
     */
    goToTab(index: number): void;
    /**
     * Public API: Get the currently active tab index
     */
    getCurrentTab(): number;
    /**
     * Public API: Get the total number of tabs
     */
    getTabCount(): number;
    /**
     * Public API: Enable a tab
     */
    enableTab(index: number): void;
    /**
     * Public API: Disable a tab
     */
    disableTab(index: number): void;
    /**
     * Public API: Destroy the tabs instance and clean up
     */
    destroy(): void;
}
export { Tabs };
