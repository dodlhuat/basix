import { ListenerGroup } from './listeners.js';
class PushMenu {
    static iconBasePath = 'svg-icons/';
    static elements = {
        navigation: null,
        content: null,
        menu: null,
        header: null,
        controlIcon: null,
        backdrop: null,
    };
    static initialized = false;
    static panelStack = [];
    static listeners = new ListenerGroup();
    static clickNavListeners = null;
    static init(options = {}) {
        if (this.initialized) {
            console.warn('PushMenu: Already initialized');
            return;
        }
        this.iconBasePath = options.iconBasePath ?? 'svg-icons/';
        this.refresh();
        if (!this.elements.navigation || !this.elements.content) {
            throw new Error('PushMenu: Required elements not found (.navigation, .push-content)');
        }
        this.buildPanels();
        const sig = { signal: this.listeners.signal };
        this.elements.navigation.addEventListener('change', () => this.handleNavigationChange(), sig);
        this.elements.backdrop?.addEventListener('click', () => this.handleBackdropClick(), sig);
        this.initialized = true;
    }
    static buildPanels() {
        const menu = this.elements.menu;
        if (!menu)
            return;
        const rootUl = menu.querySelector(':scope > ul');
        if (!rootUl)
            return;
        const rootPanel = document.createElement('div');
        rootPanel.classList.add('push-menu-panel', 'is-active');
        rootPanel.dataset.level = '0';
        rootPanel.appendChild(rootUl);
        menu.appendChild(rootPanel);
        this.extractSubPanels(rootPanel, 1);
        this.panelStack = [rootPanel];
    }
    static extractSubPanels(panel, level) {
        const uls = Array.from(panel.querySelectorAll('ul'));
        for (const ul of uls) {
            const listItems = Array.from(ul.children);
            for (const li of listItems) {
                const childUl = li.querySelector(':scope > ul');
                if (!childUl)
                    continue;
                const parentAnchor = li.querySelector(':scope > a');
                const title = parentAnchor?.textContent?.trim() ?? '';
                const subPanel = document.createElement('div');
                subPanel.classList.add('push-menu-panel');
                subPanel.dataset.level = String(level);
                const header = document.createElement('div');
                header.classList.add('push-menu-panel-header');
                const backBtn = document.createElement('button');
                backBtn.classList.add('push-menu-back');
                backBtn.setAttribute('aria-label', 'Back');
                backBtn.innerHTML = `<svg class="icon-svg" aria-hidden="true"><use href="${PushMenu.iconBasePath}icons.svg#chevron_left"/></svg>`;
                header.addEventListener('click', () => PushMenu.goBack());
                const titleEl = document.createElement('span');
                titleEl.classList.add('push-menu-panel-title');
                titleEl.textContent = title;
                header.appendChild(backBtn);
                header.appendChild(titleEl);
                subPanel.appendChild(header);
                subPanel.appendChild(childUl);
                this.elements.menu?.appendChild(subPanel);
                const trigger = document.createElement('span');
                trigger.classList.add('push-menu-item');
                trigger.textContent = title;
                const chevron = document.createElement('span');
                chevron.classList.add('push-menu-chevron');
                chevron.setAttribute('aria-hidden', 'true');
                chevron.innerHTML = `<svg class="icon-svg" aria-hidden="true"><use href="${PushMenu.iconBasePath}icons.svg#chevron_right"/></svg>`;
                trigger.appendChild(chevron);
                if (parentAnchor) {
                    parentAnchor.replaceWith(trigger);
                }
                else {
                    li.prepend(trigger);
                }
                trigger.addEventListener('click', () => PushMenu.openPanel(subPanel));
                this.extractSubPanels(subPanel, level + 1);
            }
        }
    }
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
    static handleNavigationChange() {
        const isPushed = this.elements.content?.classList.contains('pushed') ?? false;
        if (!isPushed) {
            this.clickNavListeners = new ListenerGroup();
            this.elements.content?.addEventListener('click', () => this.clickNav(), { signal: this.clickNavListeners.signal });
        }
        else {
            this.clickNavListeners?.destroy();
            this.clickNavListeners = null;
            this.resetPanels();
        }
        this.pushToggle();
    }
    static pushToggle() {
        if (!this.elements.content || !this.elements.menu) {
            throw new Error('PushMenu: Required elements not found (.push-content, .push-menu)');
        }
        const isPushed = this.elements.content.classList.contains('pushed');
        this.elements.content.classList.toggle('pushed', !isPushed);
        this.elements.menu.classList.toggle('pushed', !isPushed);
        this.elements.header?.classList.toggle('pushed', !isPushed);
        this.elements.backdrop?.classList.toggle('pushed', !isPushed);
        if (this.elements.controlIcon) {
            const iconName = isPushed ? 'menu' : 'menu_open';
            const useEl = this.elements.controlIcon.querySelector('use');
            if (useEl) {
                const existingHref = useEl.getAttribute('href') ?? '';
                const basePath = existingHref.includes('#') ? existingHref.split('#')[0] : PushMenu.iconBasePath + 'icons.svg';
                useEl.setAttribute('href', `${basePath}#${iconName}`);
            }
            else {
                this.elements.controlIcon.classList.remove('icon-menu_open', 'icon-menu');
                this.elements.controlIcon.classList.add(`icon-${iconName}`);
            }
        }
    }
    static clickNav() {
        PushMenu.elements.navigation.click();
    }
    static handleBackdropClick() {
        if (PushMenu.isOpen()) {
            PushMenu.elements.navigation.click();
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
        this.listeners.reset();
        this.clickNavListeners?.destroy();
        this.clickNavListeners = null;
        this.close();
        this.elements = {
            navigation: null,
            content: null,
            menu: null,
            header: null,
            controlIcon: null,
            backdrop: null,
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
export { PushMenu };
