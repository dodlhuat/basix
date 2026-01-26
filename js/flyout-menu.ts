interface FlyoutMenuOptions {
    triggerSelector?: string;
    menuSelector?: string;
    overlaySelector?: string;
    closeSelector?: string;
    submenuToggleSelector?: string;
    linkSelector?: string;
    direction?: 'right' | 'left';
    title?: string;
    footerText?: string;
    enableHeader?: boolean;
    enableFooter?: boolean;
}

class FlyoutMenu {
    private options: Required<FlyoutMenuOptions>;
    private menuTrigger: HTMLElement | null;
    private readonly flyoutMenu: HTMLElement | null;
    private flyoutOverlay: HTMLElement | null;
    private closeBtn: HTMLElement | null = null;
    private submenuToggles: NodeListOf<HTMLElement> | null = null;
    private menuLinks: NodeListOf<HTMLAnchorElement> | null = null;

    constructor(options: FlyoutMenuOptions = {}) {
        this.options = {
            triggerSelector: '.menu-trigger',
            menuSelector: '#flyoutMenu',
            overlaySelector: '#flyoutOverlay',
            closeSelector: '.close-menu',
            submenuToggleSelector: '.submenu-toggle',
            linkSelector: '.flyout-links > li > a',
            direction: 'right',
            title: 'Menu',
            footerText: '&copy; 2025 Brand Inc.',
            enableHeader: true,
            enableFooter: true,
            ...options
        };

        this.menuTrigger = document.querySelector(this.options.triggerSelector);
        this.flyoutMenu = document.querySelector(this.options.menuSelector);
        this.flyoutOverlay = document.querySelector(this.options.overlaySelector);

        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.handleSubmenu = this.handleSubmenu.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);

        this.init();
    }

    private init(): void {
        if (!this.flyoutMenu) {
            console.error('FlyoutMenu: Menu element not found.');
            return;
        }

        this.hydrateMenu();

        if (this.options.enableHeader) this.renderHeader();
        if (this.options.enableFooter) this.renderFooter();

        this.closeBtn = document.querySelector(this.options.closeSelector);
        this.submenuToggles = this.flyoutMenu.querySelectorAll(this.options.submenuToggleSelector);
        this.menuLinks = this.flyoutMenu.querySelectorAll('a');

        this.setDirection(this.options.direction);

        this.bindEvents();
    }

    private hydrateMenu(): void {
        if (!this.flyoutMenu) return;

        const rootUl = this.flyoutMenu.querySelector('ul');
        if (rootUl) {
            rootUl.classList.add('flyout-links');
            this.processListItems(rootUl);
        }
    }

    private processListItems(ul: HTMLUListElement): void {
        const items = Array.from(ul.children) as HTMLLIElement[];
        items.forEach((li, index) => {
            // Check if it has a nested UL
            const nestedUl = li.querySelector('ul') as HTMLUListElement | null;
            if (nestedUl) {
                li.classList.add('has-submenu');
                nestedUl.classList.add('submenu');

                // Get text content (excluding nested UL text)
                const textNode = Array.from(li.childNodes).find(
                    node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim() !== ''
                ) as Text | undefined;
                const text = textNode?.textContent?.trim() || 'Menu Item';
                textNode?.remove();

                // Create Toggle Button
                const button = document.createElement('button');
                button.className = 'submenu-toggle';
                button.style.setProperty('--delay', `${(index + 1) * 0.1}s`);
                button.innerHTML = `
                    ${text}
                    <svg class="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                `;

                li.insertBefore(button, nestedUl);

                // Recursively process nested UL
                this.processListItems(nestedUl);
            } else {
                // Leaf node - ensure it has a link
                const link = li.querySelector('a');
                if (link) {
                    link.style.setProperty('--delay', `${(index + 1) * 0.1}s`);
                }
            }
        });
    }

    private renderHeader(): void {
        if (!this.flyoutMenu) return;

        const header = document.createElement('div');
        header.className = 'flyout-header';
        header.innerHTML = `
            <span class="flyout-title">${this.options.title}</span>
            <button class="close-menu" aria-label="Close Menu">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
        this.flyoutMenu.prepend(header);
    }

    private renderFooter(): void {
        if (!this.flyoutMenu) return;

        const footer = document.createElement('div');
        footer.className = 'flyout-footer';
        footer.style.setProperty('--delay', '0.6s');
        footer.innerHTML = `<p>${this.options.footerText}</p>`;
        this.flyoutMenu.append(footer);
    }

    private bindEvents(): void {
        // Open
        this.menuTrigger?.addEventListener('click', this.open);

        // Close
        this.closeBtn?.addEventListener('click', this.close);
        this.flyoutOverlay?.addEventListener('click', this.close);

        // Submenus
        this.submenuToggles?.forEach(toggle => {
            toggle.addEventListener('click', (e) => this.handleSubmenu(e, toggle));
        });

        // Close on Link Click
        this.menuLinks?.forEach(link => {
            link.addEventListener('click', this.close);
        });

        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeydown);
    }

    private open(): void {
        this.flyoutMenu?.classList.add('is-open');
        this.flyoutOverlay?.classList.add('is-visible');
        document.body.style.overflow = 'hidden';
        this.menuTrigger?.setAttribute('aria-expanded', 'true');
    }

    private close(): void {
        this.flyoutMenu?.classList.remove('is-open');
        this.flyoutOverlay?.classList.remove('is-visible');
        document.body.style.overflow = '';
        this.menuTrigger?.setAttribute('aria-expanded', 'false');
    }

    private handleSubmenu(e: Event, toggle: HTMLElement): void {
        e.preventDefault();
        e.stopPropagation();

        const submenu = toggle.nextElementSibling as HTMLElement | null;
        const parentLi = toggle.parentElement as HTMLLIElement | null;
        const parentUl = parentLi?.parentElement as HTMLUListElement | null;

        if (!parentUl || !parentLi) return;

        // Close other submenus at the same level
        const siblings = Array.from(parentUl.children) as HTMLLIElement[];
        siblings.forEach(sibling => {
            if (sibling !== parentLi) {
                const siblingSubmenu = sibling.querySelector('.submenu');
                const siblingToggle = sibling.querySelector('.submenu-toggle');
                if (siblingSubmenu?.classList.contains('is-open')) {
                    siblingSubmenu.classList.remove('is-open');
                    siblingToggle?.classList.remove('active');
                }
            }
        });

        toggle.classList.toggle('active');
        submenu?.classList.toggle('is-open');
    }

    private handleKeydown(e: KeyboardEvent): void {
        if (e.key === 'Escape' && this.flyoutMenu?.classList.contains('is-open')) {
            this.close();
        }
    }

    public setDirection(direction: 'left' | 'right'): void {
        if (!this.flyoutMenu) return;

        const validDirections: Array<'left' | 'right'> = ['left', 'right'];
        if (!validDirections.includes(direction)) return;

        this.flyoutMenu.classList.remove('flyout-from-right', 'flyout-from-left');
        this.flyoutMenu.classList.add(`flyout-from-${direction}`);

        this.options.direction = direction;
    }

    public destroy(): void {
        this.menuTrigger?.removeEventListener('click', this.open);
        this.closeBtn?.removeEventListener('click', this.close);
        this.flyoutOverlay?.removeEventListener('click', this.close);

        this.submenuToggles?.forEach(toggle => {
            toggle.removeEventListener('click', (e) => this.handleSubmenu(e, toggle));
        });

        this.menuLinks?.forEach(link => {
            link.removeEventListener('click', this.close);
        });

        document.removeEventListener('keydown', this.handleKeydown);

        document.body.style.overflow = '';
    }
}

export { FlyoutMenu, type FlyoutMenuOptions };