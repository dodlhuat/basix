class PushMenu {
    static init() {
        if (this.initialized) {
            console.warn('PushMenu: Already initialized');
            return;
        }
        this.refresh();
        if (!this.elements.navigation || !this.elements.content) {
            throw new Error('PushMenu: Required elements not found (.navigation, .push-content)');
        }
        this.buildPanels();
        this.elements.navigation.addEventListener('change', this.handleNavigationChange.bind(this));
        this.elements.backdrop?.addEventListener('click', this.handleBackdropClick);
        this.initialized = true;
    }
    // ─── Panel construction ────────────────────────────────────────────────
    static buildPanels() {
        const menu = this.elements.menu;
        if (!menu)
            return;
        const rootUl = menu.querySelector(':scope > ul');
        if (!rootUl)
            return;
        // Wrap root ul in a panel
        const rootPanel = document.createElement('div');
        rootPanel.classList.add('push-menu-panel', 'is-active');
        rootPanel.dataset.level = '0';
        rootPanel.appendChild(rootUl);
        menu.appendChild(rootPanel);
        // Recursively extract nested uls into sibling panels
        this.extractSubPanels(rootPanel, 1);
        this.panelStack = [rootPanel];
    }
    static extractSubPanels(panel, level) {
        // Collect all uls currently in this panel before any mutations
        const uls = Array.from(panel.querySelectorAll('ul'));
        for (const ul of uls) {
            const listItems = Array.from(ul.children);
            for (const li of listItems) {
                const childUl = li.querySelector(':scope > ul');
                if (!childUl)
                    continue;
                // Determine label from the immediate anchor child
                const parentAnchor = li.querySelector(':scope > a');
                const title = parentAnchor?.textContent?.trim() ?? '';
                // ── Build sub-panel ──────────────────────────────────────
                const subPanel = document.createElement('div');
                subPanel.classList.add('push-menu-panel');
                subPanel.dataset.level = String(level);
                // Header: back button + breadcrumb title
                const header = document.createElement('div');
                header.classList.add('push-menu-panel-header');
                const backBtn = document.createElement('button');
                backBtn.classList.add('push-menu-back');
                backBtn.setAttribute('aria-label', 'Back');
                backBtn.innerHTML = `<span class="icon icon-navigate_before" aria-hidden="true"></span>`;
                header.addEventListener('click', () => PushMenu.goBack());
                const titleEl = document.createElement('span');
                titleEl.classList.add('push-menu-panel-title');
                titleEl.textContent = title;
                header.appendChild(backBtn);
                header.appendChild(titleEl);
                subPanel.appendChild(header);
                // Move the child ul into the sub-panel
                subPanel.appendChild(childUl);
                // Append sub-panel as sibling inside the nav
                this.elements.menu?.appendChild(subPanel);
                // ── Replace anchor with a trigger span in the parent li ──
                const trigger = document.createElement('span');
                trigger.classList.add('push-menu-item');
                trigger.textContent = title;
                // Chevron icon
                const chevron = document.createElement('span');
                chevron.classList.add('push-menu-chevron');
                chevron.setAttribute('aria-hidden', 'true');
                chevron.innerHTML = `<span class="icon icon-navigate_next" aria-hidden="true"></span>`;
                trigger.appendChild(chevron);
                if (parentAnchor) {
                    parentAnchor.replaceWith(trigger);
                }
                else {
                    li.prepend(trigger);
                }
                trigger.addEventListener('click', () => PushMenu.openPanel(subPanel));
                // Recurse into the newly created sub-panel
                this.extractSubPanels(subPanel, level + 1);
            }
        }
    }
    // ─── Panel navigation ──────────────────────────────────────────────────
    static openPanel(panel) {
        const currentPanel = this.panelStack[this.panelStack.length - 1];
        currentPanel.classList.remove('is-active');
        currentPanel.classList.add('is-prev');
        panel.classList.add('is-active');
        this.panelStack.push(panel);
    }
    static goBack() {
        if (this.panelStack.length <= 1)
            return;
        const currentPanel = this.panelStack.pop();
        const prevPanel = this.panelStack[this.panelStack.length - 1];
        currentPanel.classList.remove('is-active');
        prevPanel.classList.remove('is-prev');
        prevPanel.classList.add('is-active');
    }
    static resetPanels() {
        const menu = this.elements.menu;
        if (!menu)
            return;
        // Wait for the close animation before snapping panels back
        setTimeout(() => {
            const panels = Array.from(menu.querySelectorAll('.push-menu-panel'));
            panels.forEach((panel, index) => {
                panel.classList.remove('is-active', 'is-prev');
                if (index === 0)
                    panel.classList.add('is-active');
            });
            if (panels[0]) {
                this.panelStack = [panels[0]];
            }
        }, 300);
    }
    // ─── Open / close ──────────────────────────────────────────────────────
    static handleNavigationChange() {
        const isPushed = this.elements.content?.classList.contains('pushed') ?? false;
        if (!isPushed) {
            this.elements.content?.addEventListener('click', this.clickNav);
        }
        else {
            this.elements.content?.removeEventListener('click', this.clickNav);
            this.resetPanels();
        }
        this.pushToggle();
    }
    static pushToggle() {
        if (!this.elements.content || !this.elements.menu) {
            throw new Error('PushMenu: Required elements not found (.push-content, .push-menu)');
        }
        const isPushed = this.elements.content.classList.contains('pushed');
        this.toggleClass(this.elements.content, 'pushed', !isPushed);
        this.toggleClass(this.elements.menu, 'pushed', !isPushed);
        this.toggleClass(this.elements.header, 'pushed', !isPushed);
        this.toggleClass(this.elements.backdrop, 'pushed', !isPushed);
        if (this.elements.controlIcon) {
            if (isPushed) {
                this.elements.controlIcon.classList.remove('icon-menu_open');
                this.elements.controlIcon.classList.add('icon-menu');
            }
            else {
                this.elements.controlIcon.classList.add('icon-menu_open');
                this.elements.controlIcon.classList.remove('icon-menu');
            }
        }
    }
    static toggleClass(element, className, add) {
        if (!element)
            return;
        if (add) {
            element.classList.add(className);
        }
        else {
            element.classList.remove(className);
        }
    }
    static open() {
        if (!this.elements.content?.classList.contains('pushed')) {
            this.pushToggle();
        }
    }
    static close() {
        if (this.elements.content?.classList.contains('pushed')) {
            this.pushToggle();
        }
    }
    static isOpen() {
        return this.elements.content?.classList.contains('pushed') ?? false;
    }
    static destroy() {
        if (!this.initialized)
            return;
        this.elements.navigation?.removeEventListener('change', this.handleNavigationChange);
        this.elements.content?.removeEventListener('click', this.clickNav);
        this.elements.backdrop?.removeEventListener('click', this.handleBackdropClick);
        this.close();
        this.elements = {
            navigation: null,
            content: null,
            menu: null,
            header: null,
            controlIcon: null,
            backdrop: null
        };
        this.panelStack = [];
        this.initialized = false;
    }
    static refresh() {
        this.elements.navigation = document.querySelector('.navigation');
        this.elements.content = document.querySelector('.push-content');
        this.elements.menu = document.querySelector('.push-menu');
        this.elements.header = document.querySelector('.main-header');
        this.elements.controlIcon = document.querySelector('.navigation-controls .icon');
        this.elements.backdrop = document.querySelector('.push-menu-backdrop');
    }
}
PushMenu.elements = {
    navigation: null,
    content: null,
    menu: null,
    header: null,
    controlIcon: null,
    backdrop: null
};
PushMenu.initialized = false;
PushMenu.panelStack = [];
PushMenu.clickNav = () => {
    const navigation = PushMenu.elements.navigation;
    navigation?.click();
};
PushMenu.handleBackdropClick = () => {
    if (PushMenu.isOpen()) {
        const navigation = PushMenu.elements.navigation;
        navigation?.click();
    }
};
export { PushMenu };
