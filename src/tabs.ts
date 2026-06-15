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
class Tabs {
    private container: HTMLElement;
    private options: Required<Omit<TabsOptions, 'onChange'>> & Pick<TabsOptions, 'onChange'>;
    private tabItems: NodeListOf<Element>;
    private tabPanels: NodeListOf<Element>;
    private currentTab: number;
    private abortController = new AbortController();

    public constructor(elementOrSelector: string | HTMLElement, options: TabsOptions = {}) {
        const element = typeof elementOrSelector === 'string' ? document.querySelector<HTMLElement>(elementOrSelector) : elementOrSelector;

        if (!element) {
            throw new Error(`Tabs: Element not found for selector "${elementOrSelector}"`);
        }

        this.container = element;

        const layout = options.layout ?? 'horizontal';
        this.options = {
            layout,
            defaultTab: options.defaultTab ?? 0,
            menuPos: options.menuPos ?? (layout === 'vertical' ? 'left' : 'top'),
            onChange: options.onChange,
        };

        this.currentTab = this.options.defaultTab;
        this.tabItems = this.container.querySelectorAll('.tab-item');
        this.tabPanels = this.container.querySelectorAll('.tab-panel');

        this.init();
    }

    private init(): void {
        if (this.options.layout === 'vertical') {
            this.container.classList.add('tabs-vertical');
        }

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

    private bindEvents(): void {
        const sig = { signal: this.abortController.signal };
        this.tabItems.forEach((item, index) => {
            item.addEventListener(
                'click',
                (e: Event) => {
                    e.preventDefault();
                    this.activateTab(index);
                },
                sig,
            );

            item.addEventListener('keydown', (e: KeyboardEvent) => this.handleKeyboardNavigation(e, index), sig);

            item.setAttribute('role', 'tab');
            item.setAttribute('tabindex', index === this.options.defaultTab ? '0' : '-1');
            item.setAttribute('aria-selected', index === this.options.defaultTab ? 'true' : 'false');
        });

        this.tabPanels.forEach((panel, index) => {
            panel.setAttribute('role', 'tabpanel');
            panel.setAttribute('aria-hidden', index === this.options.defaultTab ? 'false' : 'true');
        });
    }

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

    private activateTab(index: number): void {
        if (index < 0 || index >= this.tabItems.length) {
            console.warn(`Invalid tab index: ${index}`);
            return;
        }

        this.tabItems.forEach((item) => {
            item.classList.remove('active');
            item.setAttribute('tabindex', '-1');
            item.setAttribute('aria-selected', 'false');
        });

        this.tabPanels.forEach((panel) => {
            panel.classList.remove('active');
            panel.setAttribute('aria-hidden', 'true');
        });

        this.tabItems[index].classList.add('active');
        this.tabItems[index].setAttribute('tabindex', '0');
        this.tabItems[index].setAttribute('aria-selected', 'true');

        this.tabPanels[index].classList.add('active');
        this.tabPanels[index].setAttribute('aria-hidden', 'false');

        const previousTab = this.currentTab;
        this.currentTab = index;

        if (previousTab !== index) this.options.onChange?.(index);
    }

    public goToTab(index: number): void {
        this.activateTab(index);

        if (this.tabItems[index]) {
            (this.tabItems[index] as HTMLElement).focus();
        }
    }

    public getCurrentTab(): number {
        return this.currentTab;
    }

    public getTabCount(): number {
        return this.tabItems.length;
    }

    public enableTab(index: number): void {
        if (index < 0 || index >= this.tabItems.length) return;

        const tab = this.tabItems[index] as HTMLElement;
        tab.classList.remove('disabled');
        tab.removeAttribute('aria-disabled');
        tab.style.pointerEvents = '';
    }

    public disableTab(index: number): void {
        if (index < 0 || index >= this.tabItems.length) return;

        const tab = this.tabItems[index] as HTMLElement;
        tab.classList.add('disabled');
        tab.setAttribute('aria-disabled', 'true');
        tab.style.pointerEvents = 'none';

        if (index === this.currentTab) {
            const firstEnabled = Array.from(this.tabItems).findIndex((item) => !item.classList.contains('disabled'));
            if (firstEnabled !== -1) {
                this.activateTab(firstEnabled);
            }
        }
    }

    public destroy(): void {
        this.abortController.abort();

        this.container.classList.remove('tabs-vertical');

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
