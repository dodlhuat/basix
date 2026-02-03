class Dropdown {
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
        // Toggle main dropdown
        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        }, { signal });
        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.close();
            }
        }, { signal });
        // Handle item clicks using event delegation
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
    toggle() {
        this.container.classList.toggle('active');
    }
    close() {
        this.container.classList.remove('active');
        this.closeAllSubmenus();
    }
    open() {
        this.container.classList.add('active');
    }
    toggleSubmenu(li) {
        const isOpening = !li.classList.contains('open');
        // Close siblings if not allowing multiple open menus
        if (isOpening && !this.options.allowMultipleOpen) {
            const parent = li.parentElement;
            if (parent) {
                const siblings = Array.from(parent.children);
                siblings.forEach((sibling) => {
                    if (sibling !== li && sibling.classList.contains('open')) {
                        sibling.classList.remove('open');
                        // Close deeply nested open items
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
        // Dispatch custom event with proper typing
        const event = new CustomEvent('dropdown-select', {
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
    destroy() {
        this.abortController.abort();
        this.close();
    }
}
export { Dropdown };
