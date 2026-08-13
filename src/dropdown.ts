import { bestPlacement } from './position.js';
import { ListenerGroup } from './listeners.js';

/** Configuration options for a Dropdown instance. */
interface DropdownOptions {
    closeOnSelect?: boolean;
    allowMultipleOpen?: boolean;
}

/** Event detail payload for the `dropdown-select` custom event. */
interface DropdownSelectDetail {
    text: string;
    element: HTMLElement;
}

/** Hierarchical dropdown menu with optional multi-open and close-on-select behaviour. */
class Dropdown {
    private container: HTMLElement;
    private trigger: HTMLElement;
    private menu: HTMLElement;
    private options: Required<DropdownOptions>;
    private listeners = new ListenerGroup();

    public constructor(selector: string, options: DropdownOptions = {}) {
        const container = document.querySelector<HTMLElement>(selector);

        if (!container) {
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

        this.init();
    }

    private init(): void {
        this.setupItems();
        this.attachEventListeners();
    }

    private attachEventListeners(): void {
        const { signal } = this.listeners;

        this.trigger.addEventListener(
            'click',
            (e: MouseEvent) => {
                e.stopPropagation();
                this.toggle();
            },
            { signal },
        );

        this.trigger.addEventListener('keydown', (e: KeyboardEvent) => this.handleKeydown(e), { signal });

        document.addEventListener(
            'click',
            (e: MouseEvent) => {
                if (!this.container.contains(e.target as Node)) {
                    this.close();
                }
            },
            { signal },
        );

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
            { signal },
        );
    }

    private setupItems(): void {
        this.menu.setAttribute('role', 'menu');
        this.trigger.setAttribute('aria-haspopup', 'true');
        this.trigger.setAttribute('aria-expanded', 'false');

        const items = this.menu.querySelectorAll<HTMLElement>('.dropdown-item');

        items.forEach((item, index) => {
            const li = item.parentElement as HTMLLIElement;
            const submenu = li.querySelector('ul');

            item.setAttribute('role', 'menuitem');
            item.id ||= `${this.container.id || 'dropdown'}-item-${index}`;

            if (submenu) {
                item.classList.add('has-children');
                item.setAttribute('aria-haspopup', 'true');
                item.setAttribute('aria-expanded', 'false');
                submenu.setAttribute('role', 'menu');
            }
        });
    }

    private updatePosition(): void {
        const triggerRect = this.trigger.getBoundingClientRect();
        const menuRect = this.menu.getBoundingClientRect();
        const placement = bestPlacement(triggerRect, menuRect, 6);
        this.container.classList.toggle('drop-up', placement === 'top');
    }

    public toggle(): void {
        if (this.container.classList.contains('active')) {
            this.close();
        } else {
            this.open();
        }
    }

    public close(): void {
        this.container.classList.remove('active');
        this.trigger.setAttribute('aria-expanded', 'false');
        this.closeAllSubmenus();
        this.clearFocus();
    }

    public open(): void {
        this.updatePosition();
        this.container.classList.add('active');
        this.trigger.setAttribute('aria-expanded', 'true');
    }

    private toggleSubmenu(li: HTMLLIElement): void {
        const isOpening = !li.classList.contains('open');
        const item = li.querySelector<HTMLElement>(':scope > .dropdown-item');

        if (isOpening && !this.options.allowMultipleOpen) {
            const parent = li.parentElement;
            if (parent) {
                const siblings = Array.from(parent.children) as HTMLLIElement[];

                siblings.forEach((sibling) => {
                    if (sibling !== li && sibling.classList.contains('open')) {
                        sibling.classList.remove('open');
                        sibling.querySelector<HTMLElement>(':scope > .dropdown-item')?.setAttribute('aria-expanded', 'false');

                        const deepOpenItems = sibling.querySelectorAll<HTMLLIElement>('.open');
                        deepOpenItems.forEach((el) => {
                            el.classList.remove('open');
                            el.querySelector<HTMLElement>(':scope > .dropdown-item')?.setAttribute('aria-expanded', 'false');
                        });
                    }
                });
            }
        }

        li.classList.toggle('open');
        item?.setAttribute('aria-expanded', String(isOpening));
    }

    private closeAllSubmenus(): void {
        const openItems = this.menu.querySelectorAll<HTMLLIElement>('li.open');
        openItems.forEach((item) => {
            item.classList.remove('open');
            item.querySelector<HTMLElement>(':scope > .dropdown-item')?.setAttribute('aria-expanded', 'false');
        });
    }

    private getActiveList(): HTMLElement {
        const focused = this.menu.querySelector<HTMLElement>('.dropdown-item.is-focused');
        const parentUl = focused?.closest('ul');
        return parentUl ?? this.menu;
    }

    private getFocusableItems(): HTMLElement[] {
        const list = this.getActiveList();
        return Array.from(list.children)
            .map((li) => li.querySelector<HTMLElement>(':scope > .dropdown-item'))
            .filter((el): el is HTMLElement => el !== null);
    }

    private clearFocus(): void {
        this.menu.querySelectorAll<HTMLElement>('.dropdown-item.is-focused').forEach((el) => el.classList.remove('is-focused'));
        this.trigger.removeAttribute('aria-activedescendant');
    }

    private moveFocus(direction: 1 | -1): void {
        const items = this.getFocusableItems();
        if (!items.length) return;

        const currentIndex = items.findIndex((el) => el.classList.contains('is-focused'));
        const nextIndex = currentIndex === -1 ? (direction === 1 ? 0 : items.length - 1) : (currentIndex + direction + items.length) % items.length;

        items[currentIndex]?.classList.remove('is-focused');
        items[nextIndex].classList.add('is-focused');
        this.trigger.setAttribute('aria-activedescendant', items[nextIndex].id);
    }

    private activateFocused(): void {
        this.getActiveList().querySelector<HTMLElement>(':scope > li > .dropdown-item.is-focused')?.click();
    }

    private openFocusedSubmenu(): void {
        const focused = this.getActiveList().querySelector<HTMLElement>(':scope > li > .dropdown-item.is-focused.has-children');
        if (!focused) return;

        const li = focused.parentElement as HTMLLIElement;
        focused.classList.remove('is-focused');
        focused.click();

        const submenu = li.querySelector<HTMLElement>(':scope > ul');
        const firstItem = submenu?.querySelector<HTMLElement>(':scope > li > .dropdown-item');
        firstItem?.classList.add('is-focused');
        if (firstItem) this.trigger.setAttribute('aria-activedescendant', firstItem.id);
    }

    private closeCurrentLevel(): void {
        const list = this.getActiveList();
        if (list === this.menu) return;

        const parentLi = list.parentElement as HTMLLIElement | null;
        if (!parentLi) return;

        this.getFocusableItems().forEach((el) => el.classList.remove('is-focused'));
        this.toggleSubmenu(parentLi);

        const parentItem = parentLi.querySelector<HTMLElement>(':scope > .dropdown-item');
        parentItem?.classList.add('is-focused');
        if (parentItem) this.trigger.setAttribute('aria-activedescendant', parentItem.id);
    }

    private handleKeydown(e: KeyboardEvent): void {
        if (!this.container.classList.contains('active')) return;

        if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.moveFocus(1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.moveFocus(-1);
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.activateFocused();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            this.openFocusedSubmenu();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            this.closeCurrentLevel();
        }
    }

    private handleSelection(item: HTMLElement): void {
        const text = item.textContent?.trim() ?? '';

        const event = new CustomEvent<DropdownSelectDetail>('dropdown-select', {
            detail: {
                text,
                element: item,
            },
            bubbles: true,
        });

        this.container.dispatchEvent(event);
    }

    public destroy(): void {
        this.listeners.destroy();
        this.close();
    }
}

export { Dropdown, type DropdownSelectDetail };
