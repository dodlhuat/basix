import { bestPlacement } from './position.js';
/** Hierarchical dropdown menu with optional multi-open and close-on-select behaviour. */
class Dropdown {
    container;
    trigger;
    menu;
    options;
    abortController;
    constructor(selector, options = {}) {
        const container = document.querySelector(selector);
        if (!container) {
            console.error(`Dropdown container not found: ${selector}`);
            throw new Error(`Dropdown container "${selector}" not found`);
        }
        this.container = container;
        const trigger = this.container.querySelector('.dropdown-trigger');
        const menu = this.container.querySelector('.dropdown-menu');
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
    init() {
        this.setupItems();
        this.attachEventListeners();
    }
    attachEventListeners() {
        const { signal } = this.abortController;
        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        }, { signal });
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.close();
            }
        }, { signal });
        this.menu.addEventListener('click', (e) => {
            e.stopPropagation();
            const target = e.target;
            const item = target.closest('.dropdown-item');
            if (!item)
                return;
            const li = item.parentElement;
            const submenu = li.querySelector('ul');
            if (submenu) {
                this.toggleSubmenu(li);
            }
            else {
                this.handleSelection(item);
                if (this.options.closeOnSelect) {
                    this.close();
                }
            }
        }, { signal });
    }
    setupItems() {
        const items = this.menu.querySelectorAll('.dropdown-item');
        items.forEach((item) => {
            const li = item.parentElement;
            if (li.querySelector('ul')) {
                item.classList.add('has-children');
            }
        });
    }
    updatePosition() {
        const triggerRect = this.trigger.getBoundingClientRect();
        const menuRect = this.menu.getBoundingClientRect();
        const placement = bestPlacement(triggerRect, menuRect, 6);
        this.container.classList.toggle('drop-up', placement === 'top');
    }
    toggle() {
        if (!this.container.classList.contains('active')) {
            this.updatePosition();
        }
        this.container.classList.toggle('active');
    }
    close() {
        this.container.classList.remove('active');
        this.closeAllSubmenus();
    }
    open() {
        this.updatePosition();
        this.container.classList.add('active');
    }
    toggleSubmenu(li) {
        const isOpening = !li.classList.contains('open');
        if (isOpening && !this.options.allowMultipleOpen) {
            const parent = li.parentElement;
            if (parent) {
                const siblings = Array.from(parent.children);
                siblings.forEach((sibling) => {
                    if (sibling !== li && sibling.classList.contains('open')) {
                        sibling.classList.remove('open');
                        const deepOpenItems = sibling.querySelectorAll('.open');
                        deepOpenItems.forEach((el) => el.classList.remove('open'));
                    }
                });
            }
        }
        li.classList.toggle('open');
    }
    closeAllSubmenus() {
        const openItems = this.menu.querySelectorAll('li.open');
        openItems.forEach((item) => item.classList.remove('open'));
    }
    handleSelection(item) {
        const text = item.textContent?.trim() ?? '';
        const event = new CustomEvent('dropdown-select', {
            detail: {
                text,
                element: item,
            },
            bubbles: true,
        });
        this.container.dispatchEvent(event);
    }
    destroy() {
        this.abortController.abort();
        this.close();
    }
}
export { Dropdown };
