type TabLayout = 'horizontal' | 'vertical';
type MenuPosition = 'top' | 'bottom' | 'left' | 'right';
interface TabsOptions {
    layout?: TabLayout;
    defaultTab?: number;
    menuPos?: MenuPosition;
    onChange?: (index: number) => void;
}
declare class Tabs {
    private container;
    private options;
    private tabItems;
    private tabPanels;
    private currentTab;
    private abortController;
    constructor(elementOrSelector: string | HTMLElement, options?: TabsOptions);
    private init;
    private bindEvents;
    private handleKeyboardNavigation;
    private activateTab;
    goToTab(index: number): void;
    getCurrentTab(): number;
    getTabCount(): number;
    enableTab(index: number): void;
    disableTab(index: number): void;
    destroy(): void;
}
export { Tabs };
