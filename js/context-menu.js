class ContextMenu {
    /**
     * @param {string} selector - CSS selector for elements that trigger the menu
     * @param {Array} menuItems - Array of objects { label, action }
     */
    constructor(selector, menuItems) {
        this.selector = selector;
        this.menuItems = menuItems;
        this.menu = null;
        this.targetElement = null;

        this.init();
    }

    init() {
        // Create the menu DOM
        this.createMenu();

        // Event Listeners
        document.addEventListener('contextmenu', (e) => {
            const target = e.target.closest(this.selector);
            if (target) {
                e.preventDefault();
                this.targetElement = target;
                this.show(e.clientX, e.clientY);
            } else {
                this.hide();
            }
        });

        document.addEventListener('click', (e) => {
            // Close if clicking outside or on an item (handled in item click)
            if (this.menu && !this.menu.contains(e.target)) {
                this.hide();
            }
        });

        window.addEventListener('scroll', () => this.hide());
        window.addEventListener('resize', () => this.hide());
    }

    createMenu() {
        this.menu = document.createElement('div');
        this.menu.classList.add('context-menu');

        this.menuItems.forEach((item, index) => {
            if (item === 'separator') {
                const sep = document.createElement('div');
                sep.classList.add('context-menu-separator');
                this.menu.appendChild(sep);
                return;
            }

            const el = document.createElement('div');
            el.classList.add('context-menu-item');
            el.textContent = item.label;

            el.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent document click from firing immediately
                this.hide();
                if (item.action) {
                    item.action(this.targetElement, e);
                }
            });

            this.menu.appendChild(el);
        });

        document.body.appendChild(this.menu);
    }

    show(x, y) {
        // Position checking to keep within viewport
        const { width, height } = this.menu.getBoundingClientRect();
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;

        if (x + width > winWidth) x -= width;
        if (y + height > winHeight) y -= height;

        this.menu.style.left = `${x}px`;
        this.menu.style.top = `${y}px`;
        this.menu.classList.add('visible');
    }

    hide() {
        if (this.menu) {
            this.menu.classList.remove('visible');
        }
    }
}
