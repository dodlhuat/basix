interface ContextMenuItemDef {
    label: string;
    icon?: string;
    shortcut?: string;
    disabled?: boolean;
    destructive?: boolean;
    action?: (target: HTMLElement) => void;
    submenu?: ContextMenuInput[];
}

type ContextMenuInput = ContextMenuItemDef | 'separator' | { group: string };

class ContextMenu {
    private items: ContextMenuInput[];
    private targets: HTMLElement[];
    private menuEl: HTMLElement | null = null;
    private currentTarget: HTMLElement | null = null;
    private abortController = new AbortController();

    constructor(
        selectorOrElement: string | HTMLElement | HTMLElement[],
        items: ContextMenuInput[]
    ) {
        this.items = items;

        if (typeof selectorOrElement === 'string') {
            this.targets = Array.from(document.querySelectorAll<HTMLElement>(selectorOrElement));
        } else if (Array.isArray(selectorOrElement)) {
            this.targets = selectorOrElement;
        } else {
            this.targets = [selectorOrElement];
        }

        this.init();
    }

    private init(): void {
        const { signal } = this.abortController;

        this.targets.forEach((target) => {
            target.addEventListener('contextmenu', (e: MouseEvent) => {
                e.preventDefault();
                this.currentTarget = target;
                this.open(e.clientX, e.clientY);
            }, { signal });
        });

        document.addEventListener('click', () => this.close(), { signal });

        // Close on right-click outside the menu
        document.addEventListener('contextmenu', (e: MouseEvent) => {
            if (this.menuEl && !this.menuEl.contains(e.target as Node)) {
                this.close();
            }
        }, { signal, capture: true });

        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (!this.menuEl) return;
            if (e.key === 'Escape')    { this.close(); }
            if (e.key === 'ArrowDown') { e.preventDefault(); this.moveFocus(1); }
            if (e.key === 'ArrowUp')   { e.preventDefault(); this.moveFocus(-1); }
            if (e.key === 'Enter')     { e.preventDefault(); this.activateFocused(); }
        }, { signal });

        // Close on scroll outside the menu
        window.addEventListener('scroll', (e: Event) => {
            if (!this.menuEl?.contains(e.target as Node)) this.close();
        }, { signal, capture: true });

        window.addEventListener('resize', () => this.close(), { signal });
    }

    private open(x: number, y: number): void {
        this.close();

        this.menuEl = this.buildMenu(this.items);
        document.body.appendChild(this.menuEl);

        // Use offsetWidth/offsetHeight — unaffected by CSS transform
        const w = this.menuEl.offsetWidth;
        const h = this.menuEl.offsetHeight;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const left = x + w > vw ? vw - w - 8 : x;
        const top  = y + h > vh ? vh - h - 8 : y;

        // Set transform-origin to match the corner the menu opens from
        const originX = x + w > vw ? 'right' : 'left';
        const originY = y + h > vh ? 'bottom' : 'top';

        this.menuEl.style.left = `${left}px`;
        this.menuEl.style.top  = `${top}px`;
        this.menuEl.style.transformOrigin = `${originY} ${originX}`;

        requestAnimationFrame(() => this.menuEl?.classList.add('is-visible'));
    }

    private close(): void {
        if (!this.menuEl) return;
        const el = this.menuEl;
        this.menuEl = null;

        el.classList.remove('is-visible');

        // Wait for exit transition then remove from DOM
        el.addEventListener('transitionend', () => el.remove(), { once: true });
        setTimeout(() => el.isConnected && el.remove(), 200);
    }

    private buildMenu(items: ContextMenuInput[]): HTMLElement {
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

    private buildItem(def: ContextMenuItemDef): HTMLElement {
        const li = document.createElement('li');
        li.className = 'context-menu-item';

        if (def.disabled)    li.classList.add('is-disabled');
        if (def.destructive) li.classList.add('is-destructive');
        if (def.submenu)     li.classList.add('has-submenu');

        // Always render icon slot — keeps label column aligned across all items
        const iconWrap = document.createElement('span');
        iconWrap.className = 'context-menu-icon';
        if (def.icon) {
            iconWrap.innerHTML = `<svg class="icon-svg"><use href="svg-icons/icons.svg#${def.icon}"/></svg>`;
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

            // Determine flip synchronously from parent position — no rAF flash
            const shouldFlip = (): boolean => {
                const rect = li.getBoundingClientRect();
                return rect.right + submenuEl.offsetWidth > window.innerWidth;
            };

            // Delay timer prevents the submenu closing when mouse travels from
            // item → submenu (mouseleave fires before mouseenter on the submenu)
            let closeTimer: ReturnType<typeof setTimeout> | null = null;

            const openSub = () => {
                if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
                this.closeAllSubmenus(li.closest<HTMLElement>('.context-menu')!);
                li.classList.toggle('submenu-flip', shouldFlip());
                li.classList.add('is-active');
            };

            const closeSub = () => {
                closeTimer = setTimeout(() => li.classList.remove('is-active'), 120);
            };

            li.addEventListener('mouseenter', openSub);
            li.addEventListener('mouseleave', closeSub);
            submenuEl.addEventListener('mouseenter', () => {
                if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
            });
            submenuEl.addEventListener('mouseleave', closeSub);
        } else if (!def.disabled) {
            li.addEventListener('click', (e: MouseEvent) => {
                e.stopPropagation();
                def.action?.(this.currentTarget!);
                this.close();
            });
        }

        return li;
    }

    private closeAllSubmenus(menu: HTMLElement): void {
        // Only close direct-child submenus of this menu level
        Array.from(menu.children).forEach((child) => {
            child.classList.remove('is-active');
        });
    }

    private getFocusableItems(): HTMLElement[] {
        if (!this.menuEl) return [];
        return Array.from(
            this.menuEl.children
        ).filter(
            (el): el is HTMLElement =>
                el.classList.contains('context-menu-item') &&
                !el.classList.contains('is-disabled')
        ) as HTMLElement[];
    }

    private moveFocus(direction: 1 | -1): void {
        const items = this.getFocusableItems();
        if (!items.length) return;

        const currentIndex = items.findIndex((el) => el.classList.contains('is-focused'));
        const nextIndex = (currentIndex + direction + items.length) % items.length;

        items[currentIndex]?.classList.remove('is-focused');
        items[nextIndex].classList.add('is-focused');
    }

    private activateFocused(): void {
        this.menuEl
            ?.querySelector<HTMLElement>('.context-menu-item.is-focused')
            ?.click();
    }

    public destroy(): void {
        this.close();
        this.abortController.abort();
    }
}

export { ContextMenu, type ContextMenuInput, type ContextMenuItemDef };
