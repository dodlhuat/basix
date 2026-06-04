class FlyoutMenu {
    options;
    menuTrigger;
    flyoutMenu;
    flyoutOverlay;
    closeBtn = null;
    submenuToggles = null;
    menuLinks = null;
    abortController = new AbortController();
    constructor(options = {}) {
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
        this.init();
    }
    init() {
        if (!this.flyoutMenu) {
            throw new Error(`FlyoutMenu: Menu element not found for selector "${this.options.menuSelector}"`);
        }
        this.hydrateMenu();
        if (this.options.enableHeader)
            this.renderHeader();
        if (this.options.enableFooter)
            this.renderFooter();
        this.closeBtn = document.querySelector(this.options.closeSelector);
        this.submenuToggles = this.flyoutMenu.querySelectorAll(this.options.submenuToggleSelector);
        this.menuLinks = this.flyoutMenu.querySelectorAll('a');
        this.setDirection(this.options.direction);
        this.bindEvents();
    }
    hydrateMenu() {
        if (!this.flyoutMenu)
            return;
        const rootUl = this.flyoutMenu.querySelector('ul');
        if (rootUl) {
            rootUl.classList.add('flyout-links');
            this.processListItems(rootUl);
        }
    }
    processListItems(ul) {
        const items = Array.from(ul.children);
        items.forEach((li, index) => {
            const nestedUl = li.querySelector('ul');
            if (nestedUl) {
                li.classList.add('has-submenu');
                nestedUl.classList.add('submenu');
                const textNode = Array.from(li.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim() !== '');
                const text = textNode?.textContent?.trim() || 'Menu Item';
                textNode?.remove();
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
                this.processListItems(nestedUl);
            }
            else {
                const link = li.querySelector('a');
                if (link) {
                    link.style.setProperty('--delay', `${(index + 1) * 0.1}s`);
                }
            }
        });
    }
    renderHeader() {
        if (!this.flyoutMenu)
            return;
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
    renderFooter() {
        if (!this.flyoutMenu)
            return;
        const footer = document.createElement('div');
        footer.className = 'flyout-footer';
        footer.style.setProperty('--delay', '0.6s');
        footer.innerHTML = `<p>${this.options.footerText}</p>`;
        this.flyoutMenu.append(footer);
    }
    bindEvents() {
        const sig = { signal: this.abortController.signal };
        this.menuTrigger?.addEventListener('click', this.open, sig);
        this.closeBtn?.addEventListener('click', this.close, sig);
        this.flyoutOverlay?.addEventListener('click', this.close, sig);
        this.submenuToggles?.forEach(toggle => {
            toggle.addEventListener('click', (e) => this.handleSubmenu(e, toggle), sig);
        });
        this.menuLinks?.forEach(link => {
            link.addEventListener('click', this.close, sig);
        });
        document.addEventListener('keydown', this.handleKeydown, sig);
    }
    open = () => {
        this.flyoutMenu?.classList.add('is-open');
        this.flyoutOverlay?.classList.add('is-visible');
        document.body.style.overflow = 'hidden';
        this.menuTrigger?.setAttribute('aria-expanded', 'true');
    };
    close = () => {
        this.flyoutMenu?.classList.remove('is-open');
        this.flyoutOverlay?.classList.remove('is-visible');
        document.body.style.overflow = '';
        this.menuTrigger?.setAttribute('aria-expanded', 'false');
    };
    handleSubmenu(e, toggle) {
        e.preventDefault();
        e.stopPropagation();
        const submenu = toggle.nextElementSibling;
        const parentLi = toggle.parentElement;
        const parentUl = parentLi?.parentElement;
        if (!parentUl || !parentLi)
            return;
        const siblings = Array.from(parentUl.children);
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
    handleKeydown = (e) => {
        if (e.key === 'Escape' && this.flyoutMenu?.classList.contains('is-open')) {
            this.close();
        }
    };
    setDirection(direction) {
        if (!this.flyoutMenu)
            return;
        const validDirections = ['left', 'right'];
        if (!validDirections.includes(direction))
            return;
        this.flyoutMenu.classList.remove('flyout-from-right', 'flyout-from-left');
        this.flyoutMenu.classList.add(`flyout-from-${direction}`);
        this.options.direction = direction;
    }
    destroy() {
        this.abortController.abort();
        document.body.style.overflow = '';
    }
}
export { FlyoutMenu };
