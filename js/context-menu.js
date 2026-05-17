/** Right-click context menu with keyboard navigation and nested submenu support. */
class ContextMenu {
    items;
    targets;
    menuEl = null;
    currentTarget = null;
    abortController = new AbortController();
    spritePath;
    constructor(selectorOrElement, items, options = {}) {
        this.items = items;
        this.spritePath = options.spritePath ?? null;
        if (typeof selectorOrElement === 'string') {
            this.targets = Array.from(document.querySelectorAll(selectorOrElement));
        }
        else if (Array.isArray(selectorOrElement)) {
            this.targets = selectorOrElement;
        }
        else {
            this.targets = [selectorOrElement];
        }
        this.init();
    }
    init() {
        const { signal } = this.abortController;
        this.targets.forEach((target) => {
            target.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.currentTarget = target;
                this.open(e.clientX, e.clientY);
            }, { signal });
        });
        document.addEventListener('click', () => this.close(), { signal });
        document.addEventListener('contextmenu', (e) => {
            if (this.menuEl && !this.menuEl.contains(e.target)) {
                this.close();
            }
        }, { signal, capture: true });
        document.addEventListener('keydown', (e) => {
            if (!this.menuEl)
                return;
            if (e.key === 'Escape') {
                this.close();
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.moveFocus(1);
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.moveFocus(-1);
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                this.activateFocused();
            }
        }, { signal });
        window.addEventListener('scroll', (e) => {
            if (!this.menuEl?.contains(e.target))
                this.close();
        }, { signal, capture: true });
        window.addEventListener('resize', () => this.close(), { signal });
    }
    open(x, y) {
        this.close();
        this.menuEl = this.buildMenu(this.items);
        document.body.appendChild(this.menuEl);
        const w = this.menuEl.offsetWidth;
        const h = this.menuEl.offsetHeight;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const left = x + w > vw ? vw - w - 8 : x;
        const top = y + h > vh ? vh - h - 8 : y;
        const originX = x + w > vw ? 'right' : 'left';
        const originY = y + h > vh ? 'bottom' : 'top';
        this.menuEl.style.left = `${left}px`;
        this.menuEl.style.top = `${top}px`;
        this.menuEl.style.transformOrigin = `${originY} ${originX}`;
        requestAnimationFrame(() => this.menuEl?.classList.add('is-visible'));
    }
    close() {
        if (!this.menuEl)
            return;
        const el = this.menuEl;
        this.menuEl = null;
        el.classList.remove('is-visible');
        el.addEventListener('transitionend', () => el.remove(), { once: true });
        setTimeout(() => el.isConnected && el.remove(), 200);
    }
    buildMenu(items) {
        const ul = document.createElement('ul');
        ul.className = 'context-menu';
        for (const item of items) {
            if (item === 'separator') {
                const li = document.createElement('li');
                li.className = 'context-menu-separator';
                ul.appendChild(li);
                continue;
            }
            if ('group' in item) {
                const li = document.createElement('li');
                li.className = 'context-menu-group-label';
                li.textContent = item.group;
                ul.appendChild(li);
                continue;
            }
            ul.appendChild(this.buildItem(item));
        }
        return ul;
    }
    buildItem(def) {
        const li = document.createElement('li');
        li.className = 'context-menu-item';
        if (def.disabled)
            li.classList.add('is-disabled');
        if (def.destructive)
            li.classList.add('is-destructive');
        if (def.submenu)
            li.classList.add('has-submenu');
        const iconWrap = document.createElement('span');
        iconWrap.className = 'context-menu-icon';
        if (def.icon && this.spritePath) {
            const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svgEl.setAttribute('aria-hidden', 'true');
            svgEl.setAttribute('fill', 'currentColor');
            const useEl = document.createElementNS('http://www.w3.org/2000/svg', 'use');
            useEl.setAttribute('href', `${this.spritePath}#${def.icon}`);
            svgEl.appendChild(useEl);
            iconWrap.appendChild(svgEl);
        }
        li.appendChild(iconWrap);
        const label = document.createElement('span');
        label.className = 'context-menu-label';
        label.textContent = def.label;
        li.appendChild(label);
        if (def.shortcut) {
            const sc = document.createElement('span');
            sc.className = 'context-menu-shortcut';
            sc.textContent = def.shortcut;
            li.appendChild(sc);
        }
        if (def.submenu) {
            const chevron = document.createElement('span');
            chevron.className = 'context-menu-chevron';
            li.appendChild(chevron);
            const submenuEl = this.buildMenu(def.submenu);
            li.appendChild(submenuEl);
            const shouldFlip = () => {
                const rect = li.getBoundingClientRect();
                return rect.right + submenuEl.offsetWidth > window.innerWidth;
            };
            // Delay timer prevents the submenu closing when mouse travels from
            // item → submenu (mouseleave fires before mouseenter on the submenu)
            let closeTimer = null;
            const openSub = () => {
                if (closeTimer) {
                    clearTimeout(closeTimer);
                    closeTimer = null;
                }
                this.closeAllSubmenus(li.closest('.context-menu'));
                li.classList.toggle('submenu-flip', shouldFlip());
                li.classList.add('is-active');
            };
            const closeSub = () => {
                closeTimer = setTimeout(() => li.classList.remove('is-active'), 120);
            };
            li.addEventListener('mouseenter', openSub);
            li.addEventListener('mouseleave', closeSub);
            submenuEl.addEventListener('mouseenter', () => {
                if (closeTimer) {
                    clearTimeout(closeTimer);
                    closeTimer = null;
                }
            });
            submenuEl.addEventListener('mouseleave', closeSub);
        }
        else if (!def.disabled) {
            li.addEventListener('click', (e) => {
                e.stopPropagation();
                def.action?.(this.currentTarget);
                this.close();
            });
        }
        return li;
    }
    closeAllSubmenus(menu) {
        Array.from(menu.children).forEach((child) => {
            child.classList.remove('is-active');
        });
    }
    getFocusableItems() {
        if (!this.menuEl)
            return [];
        return Array.from(this.menuEl.children).filter((el) => el.classList.contains('context-menu-item') &&
            !el.classList.contains('is-disabled'));
    }
    moveFocus(direction) {
        const items = this.getFocusableItems();
        if (!items.length)
            return;
        const currentIndex = items.findIndex((el) => el.classList.contains('is-focused'));
        const nextIndex = (currentIndex + direction + items.length) % items.length;
        items[currentIndex]?.classList.remove('is-focused');
        items[nextIndex].classList.add('is-focused');
    }
    activateFocused() {
        this.menuEl
            ?.querySelector('.context-menu-item.is-focused')
            ?.click();
    }
    destroy() {
        this.close();
        this.abortController.abort();
    }
}
export { ContextMenu };
