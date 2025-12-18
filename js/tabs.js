class Tabs {
    constructor(containerSelector, options = {}) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) {
            console.error(`Tabs container not found: ${containerSelector}`);
            return;
        }

        this.options = {
            layout: 'horizontal', // 'horizontal' or 'vertical'
            defaultTab: 0,
            menuPos: options.layout === 'vertical' ? 'left' : 'top', // purely internal tracking if needed, CSS handles most
            ...options
        };

        this.init();
    }

    init() {
        // Apply layout class
        if (this.options.layout === 'vertical') {
            this.container.classList.add('tabs-vertical');
        }

        this.tabItems = this.container.querySelectorAll('.tab-item');
        this.tabPanels = this.container.querySelectorAll('.tab-panel');

        this.bindEvents();
        this.activateTab(this.options.defaultTab);
    }

    bindEvents() {
        this.tabItems.forEach((item, index) => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.activateTab(index);
            });

            // Accessibility: Add basic keyboard navigation support if needed,
            // simple click usage for now as requested.
        });
    }

    activateTab(index) {
        if (index < 0 || index >= this.tabItems.length) return;

        // Remove active class from all
        this.tabItems.forEach(item => item.classList.remove('active'));
        this.tabPanels.forEach(panel => panel.classList.remove('active'));

        // Add active class to selected
        this.tabItems[index].classList.add('active');
        this.tabPanels[index].classList.add('active');
    }
}

export {Tabs}