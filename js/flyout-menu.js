class FlyoutMenu {
    constructor(options = {}) {
        // Default options
        this.options = Object.assign({
            triggerSelector: '.menu-trigger',
            menuSelector: '#flyoutMenu',
            overlaySelector: '#flyoutOverlay',
            closeSelector: '.close-menu',
            submenuToggleSelector: '.submenu-toggle',
            linkSelector: '.flyout-links > li > a',
            direction: 'right', // right, left
            title: 'Menu',
            footerText: '&copy; 2025 Brand Inc.',
            enableHeader: true,
            enableFooter: true
        }, options);

        // DOM Elements
        this.menuTrigger = document.querySelector(this.options.triggerSelector);
        this.flyoutMenu = document.querySelector(this.options.menuSelector);
        this.flyoutOverlay = document.querySelector(this.options.overlaySelector);

        // Bind methods
        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.handleSubmenu = this.handleSubmenu.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);

        this.init();
    }

    init() {
        if (!this.flyoutMenu) {
            console.error('FlyoutMenu: Menu element not found.');
            return;
        }

        // Hydrate Menu Structure
        this.hydrateMenu();

        // Render Header & Footer
        if (this.options.enableHeader) this.renderHeader();
        if (this.options.enableFooter) this.renderFooter();

        // Re-query elements after hydration
        this.closeBtn = document.querySelector(this.options.closeSelector);
        this.submenuToggles = this.flyoutMenu.querySelectorAll(this.options.submenuToggleSelector);
        this.menuLinks = this.flyoutMenu.querySelectorAll('a');

        // Set initial direction
        this.setDirection(this.options.direction);

        this.bindEvents();
    }

    hydrateMenu() {
        const rootUl = this.flyoutMenu.querySelector('ul');
        if (rootUl) {
            rootUl.classList.add('flyout-links');
            this.processListItems(rootUl);
        }
    }

    processListItems(ul) {
        const items = Array.from(ul.children);
        items.forEach((li, index) => {
            // Check if it has a nested UL
            const nestedUl = li.querySelector('ul');
            if (nestedUl) {
                li.classList.add('has-submenu');
                nestedUl.classList.add('submenu');

                // Get text content (excluding nested UL text)
                const textNode = Array.from(li.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '');
                const text = textNode ? textNode.textContent.trim() : 'Menu Item';
                if (textNode) textNode.remove();

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
                // Leaf node - ensure it has a link or wrap text
                const link = li.querySelector('a');
                if (link) {
                    link.style.setProperty('--delay', `${(index + 1) * 0.1}s`);
                }
            }
        });
    }

    renderHeader() {
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
        const footer = document.createElement('div');
        footer.className = 'flyout-footer';
        footer.style.setProperty('--delay', '0.6s');
        footer.innerHTML = `<p>${this.options.footerText}</p>`;
        this.flyoutMenu.append(footer);
    }

    bindEvents() {
        // Open
        if (this.menuTrigger) {
            this.menuTrigger.addEventListener('click', this.open);
        }

        // Close
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', this.close);
        }
        if (this.flyoutOverlay) {
            this.flyoutOverlay.addEventListener('click', this.close);
        }

        // Submenus
        this.submenuToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => this.handleSubmenu(e, toggle));
        });

        // Close on Link Click
        this.menuLinks.forEach(link => {
            link.addEventListener('click', this.close);
        });

        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeydown);
    }

    open() {
        this.flyoutMenu.classList.add('is-open');
        if (this.flyoutOverlay) this.flyoutOverlay.classList.add('is-visible');
        document.body.style.overflow = 'hidden';
        if (this.menuTrigger) this.menuTrigger.setAttribute('aria-expanded', 'true');
    }

    close() {
        this.flyoutMenu.classList.remove('is-open');
        if (this.flyoutOverlay) this.flyoutOverlay.classList.remove('is-visible');
        document.body.style.overflow = '';
        if (this.menuTrigger) this.menuTrigger.setAttribute('aria-expanded', 'false');
    }

    handleSubmenu(e, toggle) {
        e.preventDefault();
        e.stopPropagation(); // Stop event from bubbling to parent toggles

        const submenu = toggle.nextElementSibling;
        const parentLi = toggle.parentElement;
        const parentUl = parentLi.parentElement;

        // Close other submenus at the same level
        const siblings = Array.from(parentUl.children);
        siblings.forEach(sibling => {
            if (sibling !== parentLi) {
                const siblingSubmenu = sibling.querySelector('.submenu');
                const siblingToggle = sibling.querySelector('.submenu-toggle');
                if (siblingSubmenu && siblingSubmenu.classList.contains('is-open')) {
                    siblingSubmenu.classList.remove('is-open');
                    if (siblingToggle) siblingToggle.classList.remove('active');
                }
            }
        });

        toggle.classList.toggle('active');
        if (submenu) submenu.classList.toggle('is-open');
    }

    handleKeydown(e) {
        if (e.key === 'Escape' && this.flyoutMenu.classList.contains('is-open')) {
            this.close();
        }
    }

    setDirection(direction) {
        const validDirections = ['left', 'right'];
        if (!validDirections.includes(direction)) return;

        // Remove all direction classes
        this.flyoutMenu.classList.remove('flyout-from-right', 'flyout-from-left');

        // Add new direction class
        this.flyoutMenu.classList.add(`flyout-from-${direction}`);

        this.options.direction = direction;
    }
}

export {FlyoutMenu}
