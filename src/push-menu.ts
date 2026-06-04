/** DOM element references managed by the PushMenu static class. */
interface PushMenuElements {
    navigation: HTMLElement | null;
    content: HTMLElement | null;
    menu: HTMLElement | null;
    header: HTMLElement | null;
    controlIcon: HTMLElement | null;
    backdrop: HTMLElement | null;
}

/** Static class that manages a push-style side navigation panel. */
class PushMenu {
    private static elements: PushMenuElements = {
        navigation: null,
        content: null,
        menu: null,
        header: null,
        controlIcon: null,
        backdrop: null
    };

    private static initialized = false;
    private static panelStack: HTMLElement[] = [];
    private static boundHandleNavigationChange: () => void;

    public static init(): void {
        if (this.initialized) {
            console.warn('PushMenu: Already initialized');
            return;
        }

        this.refresh();

        if (!this.elements.navigation || !this.elements.content) {
            throw new Error('PushMenu: Required elements not found (.navigation, .push-content)');
        }

        this.buildPanels();

        this.boundHandleNavigationChange = this.handleNavigationChange.bind(this);
        this.elements.navigation.addEventListener('change', this.boundHandleNavigationChange);
        this.elements.backdrop?.addEventListener('click', this.handleBackdropClick);

        this.initialized = true;
    }

    private static buildPanels(): void {
        const menu = this.elements.menu;
        if (!menu) return;

        const rootUl = menu.querySelector(':scope > ul');
        if (!rootUl) return;

        const rootPanel = document.createElement('div');
        rootPanel.classList.add('push-menu-panel', 'is-active');
        rootPanel.dataset.level = '0';
        rootPanel.appendChild(rootUl);
        menu.appendChild(rootPanel);

        this.extractSubPanels(rootPanel, 1);

        this.panelStack = [rootPanel];
    }

    private static extractSubPanels(panel: HTMLElement, level: number): void {
        const uls = Array.from(panel.querySelectorAll('ul')) as HTMLUListElement[];

        for (const ul of uls) {
            const listItems = Array.from(ul.children) as HTMLElement[];

            for (const li of listItems) {
                const childUl = li.querySelector(':scope > ul') as HTMLElement | null;
                if (!childUl) continue;

                const parentAnchor = li.querySelector(':scope > a') as HTMLElement | null;
                const title = parentAnchor?.textContent?.trim() ?? '';

                const subPanel = document.createElement('div');
                subPanel.classList.add('push-menu-panel');
                subPanel.dataset.level = String(level);

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

                subPanel.appendChild(childUl);

                this.elements.menu?.appendChild(subPanel);

                const trigger = document.createElement('span');
                trigger.classList.add('push-menu-item');
                trigger.textContent = title;

                const chevron = document.createElement('span');
                chevron.classList.add('push-menu-chevron');
                chevron.setAttribute('aria-hidden', 'true');
                chevron.innerHTML = `<span class="icon icon-navigate_next" aria-hidden="true"></span>`;
                trigger.appendChild(chevron);

                if (parentAnchor) {
                    parentAnchor.replaceWith(trigger);
                } else {
                    li.prepend(trigger);
                }

                trigger.addEventListener('click', () => PushMenu.openPanel(subPanel));

                this.extractSubPanels(subPanel, level + 1);
            }
        }
    }

    public static openPanel(panel: HTMLElement): void {
        const currentPanel = this.panelStack[this.panelStack.length - 1];

        currentPanel.classList.remove('is-active');
        currentPanel.classList.add('is-prev');

        panel.classList.add('is-active');

        this.panelStack.push(panel);
    }

    public static goBack(): void {
        if (this.panelStack.length <= 1) return;

        const currentPanel = this.panelStack.pop()!;
        const prevPanel = this.panelStack[this.panelStack.length - 1];

        currentPanel.classList.remove('is-active');
        prevPanel.classList.remove('is-prev');
        prevPanel.classList.add('is-active');
    }

    private static resetPanels(): void {
        const menu = this.elements.menu;
        if (!menu) return;

        setTimeout(() => {
            const panels = Array.from(menu.querySelectorAll('.push-menu-panel')) as HTMLElement[];
            panels.forEach((panel, index) => {
                panel.classList.remove('is-active', 'is-prev');
                if (index === 0) panel.classList.add('is-active');
            });

            if (panels[0]) {
                this.panelStack = [panels[0]];
            }
        }, 300);
    }

    private static handleNavigationChange(): void {
        const isPushed = this.elements.content?.classList.contains('pushed') ?? false;

        if (!isPushed) {
            this.elements.content?.addEventListener('click', this.clickNav);
        } else {
            this.elements.content?.removeEventListener('click', this.clickNav);
            this.resetPanels();
        }

        this.pushToggle();
    }

    public static pushToggle(): void {
        if (!this.elements.content || !this.elements.menu) {
            throw new Error('PushMenu: Required elements not found (.push-content, .push-menu)');
        }

        const isPushed = this.elements.content.classList.contains('pushed');

        this.elements.content.classList.toggle('pushed', !isPushed);
        this.elements.menu.classList.toggle('pushed', !isPushed);
        this.elements.header?.classList.toggle('pushed', !isPushed);
        this.elements.backdrop?.classList.toggle('pushed', !isPushed);

        if (this.elements.controlIcon) {
            if (isPushed) {
                this.elements.controlIcon.classList.remove('icon-menu_open');
                this.elements.controlIcon.classList.add('icon-menu');
            } else {
                this.elements.controlIcon.classList.add('icon-menu_open');
                this.elements.controlIcon.classList.remove('icon-menu');
            }
        }
    }

    private static clickNav = (): void => {
        (PushMenu.elements.navigation as HTMLElement).click();
    };

    private static handleBackdropClick = (): void => {
        if (PushMenu.isOpen()) {
            (PushMenu.elements.navigation as HTMLElement).click();
        }
    };

    public static open(): void {
        if (!this.elements.content?.classList.contains('pushed')) {
            this.pushToggle();
        }
    }

    public static close(): void {
        if (this.elements.content?.classList.contains('pushed')) {
            this.pushToggle();
        }
    }

    public static isOpen(): boolean {
        return this.elements.content?.classList.contains('pushed') ?? false;
    }

    public static destroy(): void {
        if (!this.initialized) return;

        this.elements.navigation?.removeEventListener('change', this.boundHandleNavigationChange);
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

    public static refresh(): void {
        this.elements.navigation = document.querySelector('.navigation');
        this.elements.content = document.querySelector('.push-content');
        this.elements.menu = document.querySelector('.push-menu');
        this.elements.header = document.querySelector('.main-header');
        this.elements.controlIcon = document.querySelector('.navigation-controls .icon');
        this.elements.backdrop = document.querySelector('.push-menu-backdrop');
    }
}

export { PushMenu, type PushMenuElements };
