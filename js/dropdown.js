import { bestPlacement } from './position.js';
import { ListenerGroup } from './listeners.js';
class Dropdown {
    container;
    trigger;
    menu;
    options;
    listeners = new ListenerGroup();
    constructor(selector, options = {}) {
        const container = document.querySelector(selector);
        if (!container) {
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
        this.init();
    }
    init() {
        this.setupItems();
        this.attachEventListeners();
    }
    attachEventListeners() {
        const { signal } = this.listeners;
        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        }, { signal });
        this.trigger.addEventListener('keydown', (e) => this.handleKeydown(e), { signal });
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
        this.menu.setAttribute('role', 'menu');
        this.trigger.setAttribute('aria-haspopup', 'true');
        this.trigger.setAttribute('aria-expanded', 'false');
        const items = this.menu.querySelectorAll('.dropdown-item');
        items.forEach((item, index) => {
            const li = item.parentElement;
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
    updatePosition() {
        const triggerRect = this.trigger.getBoundingClientRect();
        const menuRect = this.menu.getBoundingClientRect();
        const placement = bestPlacement(triggerRect, menuRect, 6);
        this.container.classList.toggle('drop-up', placement === 'top');
    }
    toggle() {
        if (this.container.classList.contains('active')) {
            this.close();
        }
        else {
            this.open();
        }
    }
    close() {
        this.container.classList.remove('active');
        this.trigger.setAttribute('aria-expanded', 'false');
        this.closeAllSubmenus();
        this.clearFocus();
    }
    open() {
        this.updatePosition();
        this.container.classList.add('active');
        this.trigger.setAttribute('aria-expanded', 'true');
    }
    toggleSubmenu(li) {
        const isOpening = !li.classList.contains('open');
        const item = li.querySelector(':scope > .dropdown-item');
        if (isOpening && !this.options.allowMultipleOpen) {
            const parent = li.parentElement;
            if (parent) {
                const siblings = Array.from(parent.children);
                siblings.forEach((sibling) => {
                    if (sibling !== li && sibling.classList.contains('open')) {
                        sibling.classList.remove('open');
                        sibling.querySelector(':scope > .dropdown-item')?.setAttribute('aria-expanded', 'false');
                        const deepOpenItems = sibling.querySelectorAll('.open');
                        deepOpenItems.forEach((el) => {
                            el.classList.remove('open');
                            el.querySelector(':scope > .dropdown-item')?.setAttribute('aria-expanded', 'false');
                        });
                    }
                });
            }
        }
        li.classList.toggle('open');
        item?.setAttribute('aria-expanded', String(isOpening));
    }
    closeAllSubmenus() {
        const openItems = this.menu.querySelectorAll('li.open');
        openItems.forEach((item) => {
            item.classList.remove('open');
            item.querySelector(':scope > .dropdown-item')?.setAttribute('aria-expanded', 'false');
        });
    }
    getActiveList() {
        const focused = this.menu.querySelector('.dropdown-item.is-focused');
        const parentUl = focused?.closest('ul');
        return parentUl ?? this.menu;
    }
    getFocusableItems() {
        const list = this.getActiveList();
        return Array.from(list.children)
            .map((li) => li.querySelector(':scope > .dropdown-item'))
            .filter((el) => el !== null);
    }
    clearFocus() {
        this.menu.querySelectorAll('.dropdown-item.is-focused').forEach((el) => el.classList.remove('is-focused'));
        this.trigger.removeAttribute('aria-activedescendant');
    }
    moveFocus(direction) {
        const items = this.getFocusableItems();
        if (!items.length)
            return;
        const currentIndex = items.findIndex((el) => el.classList.contains('is-focused'));
        const nextIndex = currentIndex === -1 ? (direction === 1 ? 0 : items.length - 1) : (currentIndex + direction + items.length) % items.length;
        items[currentIndex]?.classList.remove('is-focused');
        items[nextIndex].classList.add('is-focused');
        this.trigger.setAttribute('aria-activedescendant', items[nextIndex].id);
    }
    activateFocused() {
        this.getActiveList().querySelector(':scope > li > .dropdown-item.is-focused')?.click();
    }
    openFocusedSubmenu() {
        const focused = this.getActiveList().querySelector(':scope > li > .dropdown-item.is-focused.has-children');
        if (!focused)
            return;
        const li = focused.parentElement;
        focused.classList.remove('is-focused');
        focused.click();
        const submenu = li.querySelector(':scope > ul');
        const firstItem = submenu?.querySelector(':scope > li > .dropdown-item');
        firstItem?.classList.add('is-focused');
        if (firstItem)
            this.trigger.setAttribute('aria-activedescendant', firstItem.id);
    }
    closeCurrentLevel() {
        const list = this.getActiveList();
        if (list === this.menu)
            return;
        const parentLi = list.parentElement;
        if (!parentLi)
            return;
        this.getFocusableItems().forEach((el) => el.classList.remove('is-focused'));
        this.toggleSubmenu(parentLi);
        const parentItem = parentLi.querySelector(':scope > .dropdown-item');
        parentItem?.classList.add('is-focused');
        if (parentItem)
            this.trigger.setAttribute('aria-activedescendant', parentItem.id);
    }
    handleKeydown(e) {
        if (!this.container.classList.contains('active'))
            return;
        if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
        }
        else if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.moveFocus(1);
        }
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.moveFocus(-1);
        }
        else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.activateFocused();
        }
        else if (e.key === 'ArrowRight') {
            e.preventDefault();
            this.openFocusedSubmenu();
        }
        else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            this.closeCurrentLevel();
        }
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
        this.listeners.destroy();
        this.close();
    }
}
export { Dropdown };
