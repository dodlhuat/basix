interface DropdownOptions {
    closeOnSelect?: boolean;
    allowMultipleOpen?: boolean;
}

interface DropdownSelectDetail {
    text: string;
    element: HTMLElement;
}

class Dropdown {
    private container: HTMLElement;
    private trigger: HTMLElement;
    private menu: HTMLElement;
    private options: Required<DropdownOptions>;
    private abortController: AbortController;

    constructor(selector: string, options: DropdownOptions = {}) {
        const container = document.querySelector<HTMLElement>(selector);

        if (!container) {
            console.error(`Dropdown container not found: ${selector}`);
            throw new Error(`Dropdown container "${selector}" not found`);
        }

        this.container = container;

        const trigger = this.container.querySelector<HTMLElement>('.dropdown-trigger');
        const menu = this.container.querySelector<HTMLElement>('.dropdown-menu');

        if (!trigger || !menu) {
            throw new Error('Dropdown requires .dropdown-trigger and .dropdown-menu elements');
        }

        this.trigger = trigger;
        this.menu = menu;

        this.options = {
            closeOnSelect: options.closeOnSelect ?? true,
            allowMultipleOpen: options.allowMultipleOpen ?? false,
        };

        this.abortController = new AbortController();
        this.init();
    }

    private init(): void {
        this.setupItems();
        this.attachEventListeners();
    }

    private attachEventListeners(): void {
        const { signal } = this.abortController;

        // Toggle main dropdown
        this.trigger.addEventListener(
            'click',
            (e: MouseEvent) => {
                e.stopPropagation();
                this.toggle();
            },
            { signal }
        );

        // Close when clicking outside
        document.addEventListener(
            'click',
            (e: MouseEvent) => {
                if (!this.container.contains(e.target as Node)) {
                    this.close();
                }
            },
            { signal }
        );

        // Handle item clicks using event delegation
        this.menu.addEventListener(
            'click',
            (e: MouseEvent) => {
                e.stopPropagation();

                const target = e.target as HTMLElement;
                const item = target.closest<HTMLElement>('.dropdown-item');

                if (!item) return;

                const li = item.parentElement as HTMLLIElement;
                const submenu = li.querySelector<HTMLUListElement>('ul');

                if (submenu) {
                    this.toggleSubmenu(li);
                } else {
                    this.handleSelection(item);
                    if (this.options.closeOnSelect) {
                        this.close();
                    }
                }
            },
            { signal }
        );
    }

    private setupItems(): void {
        const items = this.menu.querySelectorAll<HTMLElement>('.dropdown-item');

        items.forEach((item) => {
            const li = item.parentElement as HTMLLIElement;
            if (li.querySelector('ul')) {
                item.classList.add('has-children');
            }
        });
    }

    public toggle(): void {
        this.container.classList.toggle('active');
    }

    public close(): void {
        this.container.classList.remove('active');
        this.closeAllSubmenus();
    }

    public open(): void {
        this.container.classList.add('active');
    }

    private toggleSubmenu(li: HTMLLIElement): void {
        const isOpening = !li.classList.contains('open');

        // Close siblings if not allowing multiple open menus
        if (isOpening && !this.options.allowMultipleOpen) {
            const parent = li.parentElement;
            if (parent) {
                const siblings = Array.from(parent.children) as HTMLLIElement[];

                siblings.forEach((sibling) => {
                    if (sibling !== li && sibling.classList.contains('open')) {
                        sibling.classList.remove('open');

                        // Close deeply nested open items
                        const deepOpenItems = sibling.querySelectorAll<HTMLLIElement>('.open');
                        deepOpenItems.forEach((el) => el.classList.remove('open'));
                    }
                });
            }
        }

        li.classList.toggle('open');
    }

    private closeAllSubmenus(): void {
        const openItems = this.menu.querySelectorAll<HTMLLIElement>('li.open');
        openItems.forEach((item) => item.classList.remove('open'));
    }

    private handleSelection(item: HTMLElement): void {
        const text = item.textContent?.trim() ?? '';

        // Dispatch custom event with proper typing
        const event = new CustomEvent<DropdownSelectDetail>('dropdown-select', {
            detail: {
                text,
                element: item,
            },
            bubbles: true,
        });

        this.container.dispatchEvent(event);
    }

    /**
     * Cleanup method to remove event listeners
     */
    public destroy(): void {
        this.abortController.abort();
        this.close();
    }
}

export { Dropdown, DropdownSelectDetail };