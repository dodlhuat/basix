interface PushMenuElements {
    navigation: HTMLElement | null;
    content: HTMLElement | null;
    menu: HTMLElement | null;
    header: HTMLElement | null;
    controlIcon: HTMLElement | null;
}

class PushMenu {
    private static elements: PushMenuElements = {
        navigation: null,
        content: null,
        menu: null,
        header: null,
        controlIcon: null
    };

    private static initialized = false;

    static init(): void {
        if (this.initialized) {
            console.warn('PushMenu: Already initialized');
            return;
        }

        this.refresh();

        if (!this.elements.navigation) {
            console.error('PushMenu: Navigation element not found');
            return;
        }

        if (!this.elements.content) {
            console.error('PushMenu: Content element not found');
            return;
        }

        this.elements.navigation.addEventListener('change', this.handleNavigationChange.bind(this));

        this.initialized = true;
    }

    private static handleNavigationChange(): void {
        const isPushed = this.elements.content?.classList.contains('pushed') ?? false;

        if (!isPushed) {
            this.elements.content?.addEventListener('click', this.clickNav);
        } else {
            this.elements.content?.removeEventListener('click', this.clickNav);
        }

        this.pushToggle();
    }

    static pushToggle(): void {
        if (!this.elements.content || !this.elements.menu) {
            console.error('PushMenu: Required elements not found');
            return;
        }

        const isPushed = this.elements.content.classList.contains('pushed');

        this.toggleClass(this.elements.content, 'pushed', !isPushed);
        this.toggleClass(this.elements.menu, 'pushed', !isPushed);
        this.toggleClass(this.elements.header, 'pushed', !isPushed);

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

    private static toggleClass(element: HTMLElement | null, className: string, add: boolean): void {
        if (!element) return;

        if (add) {
            element.classList.add(className);
        } else {
            element.classList.remove(className);
        }
    }

    private static clickNav = (): void => {
        const navigation = PushMenu.elements.navigation as HTMLElement;
        navigation?.click();
    };

    static open(): void {
        if (!this.elements.content?.classList.contains('pushed')) {
            this.pushToggle();
        }
    }

    static close(): void {
        if (this.elements.content?.classList.contains('pushed')) {
            this.pushToggle();
        }
    }

    static isOpen(): boolean {
        return this.elements.content?.classList.contains('pushed') ?? false;
    }

    static destroy(): void {
        if (!this.initialized) return;

        this.elements.navigation?.removeEventListener('change', this.handleNavigationChange);
        this.elements.content?.removeEventListener('click', this.clickNav);

        this.close();

        this.elements = {
            navigation: null,
            content: null,
            menu: null,
            header: null,
            controlIcon: null
        };

        this.initialized = false;
    }

    static refresh(): void {
        this.elements.navigation = document.querySelector('.navigation');
        this.elements.content = document.querySelector('.push-content');
        this.elements.menu = document.querySelector('.push-menu');
        this.elements.header = document.querySelector('.main-header');
        this.elements.controlIcon = document.querySelector('.navigation-controls .icon');
    }
}

export { PushMenu, type PushMenuElements };