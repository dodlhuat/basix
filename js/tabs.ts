type TabLayout = 'horizontal' | 'vertical';
type MenuPosition = 'top' | 'bottom' | 'left' | 'right';

interface TabsOptions {
    layout?: TabLayout;
    defaultTab?: number;
    menuPos?: MenuPosition;
    onChange?: (index: number) => void;
}

class Tabs {
    private container: HTMLElement;
    private options: Required<Omit<TabsOptions, 'onChange'>> & Pick<TabsOptions, 'onChange'>;
    private tabItems: NodeListOf<Element>;
    private tabPanels: NodeListOf<Element>;
    private currentTab: number;

    constructor(containerSelector: string, options: TabsOptions = {}) {
        const element = document.querySelector(containerSelector);

        if (!element) {
            throw new Error(`Tabs: Container not found for selector "${containerSelector}"`);
        }

        this.container = element as HTMLElement;

        // Set default options
        const layout = options.layout || 'horizontal';
        this.options = {
            layout,
            defaultTab: options.defaultTab ?? 0,
            menuPos: options.menuPos || (layout === 'vertical' ? 'left' : 'top'),
            onChange: options.onChange
        };

        this.currentTab = this.options.defaultTab;
        this.tabItems = document.querySelectorAll('.tab-item'); // Will be set in init
        this.tabPanels = document.querySelectorAll('.tab-panel'); // Will be set in init

        this.init();
    }

    /**
     * Initializes the tabs component
     */
    private init(): void {
        // Apply layout class
        if (this.options.layout === 'vertical') {
            this.container.classList.add('tabs-vertical');
        }

        this.tabItems = this.container.querySelectorAll('.tab-item');
        this.tabPanels = this.container.querySelectorAll('.tab-panel');

        // Validate that we have tabs and panels
        if (this.tabItems.length === 0) {
            console.warn('No tab items found in container');
            return;
        }

        if (this.tabPanels.length === 0) {
            console.warn('No tab panels found in container');
            return;
        }

        if (this.tabItems.length !== this.tabPanels.length) {
            console.warn('Number of tab items does not match number of tab panels');
        }

        this.bindEvents();
        this.activateTab(this.options.defaultTab);
    }

    /**
     * Binds click events to tab items
     */
    private bindEvents(): void {
        this.tabItems.forEach((item, index) => {
            item.addEventListener('click', (e: Event) => {
                e.preventDefault();
                this.activateTab(index);
            });

            // Add keyboard navigation for accessibility
            item.addEventListener('keydown', (e: Event) => {
                const keyEvent = e as KeyboardEvent;
                this.handleKeyboardNavigation(keyEvent, index);
            });

            // Set ARIA attributes
            item.setAttribute('role', 'tab');
            item.setAttribute('tabindex', index === this.options.defaultTab ? '0' : '-1');
            item.setAttribute('aria-selected', index === this.options.defaultTab ? 'true' : 'false');
        });

        // Set ARIA attributes for panels
        this.tabPanels.forEach((panel, index) => {
            panel.setAttribute('role', 'tabpanel');
            panel.setAttribute('aria-hidden', index === this.options.defaultTab ? 'false' : 'true');
        });
    }

    /**
     * Handles keyboard navigation (Arrow keys, Home, End)
     */
    private handleKeyboardNavigation(e: KeyboardEvent, currentIndex: number): void {
        let newIndex = currentIndex;
        const isVertical = this.options.layout === 'vertical';

        switch (e.key) {
            case 'ArrowLeft':
                if (!isVertical) {
                    newIndex = currentIndex > 0 ? currentIndex - 1 : this.tabItems.length - 1;
                    e.preventDefault();
                }
                break;
            case 'ArrowRight':
                if (!isVertical) {
                    newIndex = currentIndex < this.tabItems.length - 1 ? currentIndex + 1 : 0;
                    e.preventDefault();
                }
                break;
            case 'ArrowUp':
                if (isVertical) {
                    newIndex = currentIndex > 0 ? currentIndex - 1 : this.tabItems.length - 1;
                    e.preventDefault();
                }
                break;
            case 'ArrowDown':
                if (isVertical) {
                    newIndex = currentIndex < this.tabItems.length - 1 ? currentIndex + 1 : 0;
                    e.preventDefault();
                }
                break;
            case 'Home':
                newIndex = 0;
                e.preventDefault();
                break;
            case 'End':
                newIndex = this.tabItems.length - 1;
                e.preventDefault();
                break;
            default:
                return;
        }

        if (newIndex !== currentIndex) {
            this.activateTab(newIndex);
            (this.tabItems[newIndex] as HTMLElement).focus();
        }
    }

    /**
     * Activates a tab by index
     */
    private activateTab(index: number): void {
        if (index < 0 || index >= this.tabItems.length) {
            console.warn(`Invalid tab index: ${index}`);
            return;
        }

        // Remove active class from all
        this.tabItems.forEach((item, i) => {
            item.classList.remove('active');
            item.setAttribute('tabindex', '-1');
            item.setAttribute('aria-selected', 'false');
        });

        this.tabPanels.forEach((panel) => {
            panel.classList.remove('active');
            panel.setAttribute('aria-hidden', 'true');
        });

        // Add active class to selected
        this.tabItems[index].classList.add('active');
        this.tabItems[index].setAttribute('tabindex', '0');
        this.tabItems[index].setAttribute('aria-selected', 'true');

        this.tabPanels[index].classList.add('active');
        this.tabPanels[index].setAttribute('aria-hidden', 'false');

        const previousTab = this.currentTab;
        this.currentTab = index;

        // Call onChange callback if provided
        if (this.options.onChange && previousTab !== index) {
            this.options.onChange(index);
        }
    }

    /**
     * Public API: Programmatically activate a tab
     */
    public goToTab(index: number): void {
        this.activateTab(index);

        // Focus the tab for keyboard users
        if (this.tabItems[index]) {
            (this.tabItems[index] as HTMLElement).focus();
        }
    }

    /**
     * Public API: Get the currently active tab index
     */
    public getCurrentTab(): number {
        return this.currentTab;
    }

    /**
     * Public API: Get the total number of tabs
     */
    public getTabCount(): number {
        return this.tabItems.length;
    }

    /**
     * Public API: Enable a tab
     */
    public enableTab(index: number): void {
        if (index < 0 || index >= this.tabItems.length) return;

        const tab = this.tabItems[index] as HTMLElement;
        tab.classList.remove('disabled');
        tab.removeAttribute('aria-disabled');
        tab.style.pointerEvents = '';
    }

    /**
     * Public API: Disable a tab
     */
    public disableTab(index: number): void {
        if (index < 0 || index >= this.tabItems.length) return;

        const tab = this.tabItems[index] as HTMLElement;
        tab.classList.add('disabled');
        tab.setAttribute('aria-disabled', 'true');
        tab.style.pointerEvents = 'none';

        // If disabling the current tab, switch to the first enabled tab
        if (index === this.currentTab) {
            const firstEnabled = Array.from(this.tabItems).findIndex(
                (item) => !item.classList.contains('disabled')
            );
            if (firstEnabled !== -1) {
                this.activateTab(firstEnabled);
            }
        }
    }

    /**
     * Public API: Destroy the tabs instance and clean up
     */
    public destroy(): void {
        // Remove event listeners by cloning and replacing nodes
        this.tabItems.forEach((item) => {
            const newItem = item.cloneNode(true);
            item.parentNode?.replaceChild(newItem, item);
        });

        // Remove classes
        this.container.classList.remove('tabs-vertical');

        // Remove ARIA attributes
        this.tabItems.forEach((item) => {
            item.removeAttribute('role');
            item.removeAttribute('tabindex');
            item.removeAttribute('aria-selected');
        });

        this.tabPanels.forEach((panel) => {
            panel.removeAttribute('role');
            panel.removeAttribute('aria-hidden');
        });
    }
}

export { Tabs };