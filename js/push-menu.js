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
        this.elements.navigation.addEventListener('change', this.handleNavigationChange.bind(this));
        this.initialized = true;
    }
    static handleNavigationChange() {
        const isPushed = this.elements.content?.classList.contains('pushed') ?? false;
        if (!isPushed) {
            this.elements.content?.addEventListener('click', this.clickNav);
        }
        else {
            this.elements.content?.removeEventListener('click', this.clickNav);
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
    static refresh() {
        this.elements.navigation = document.querySelector('.navigation');
        this.elements.content = document.querySelector('.push-content');
        this.elements.menu = document.querySelector('.push-menu');
        this.elements.header = document.querySelector('.main-header');
        this.elements.controlIcon = document.querySelector('.navigation-controls .icon');
    }
}
PushMenu.elements = {
    navigation: null,
    content: null,
    menu: null,
    header: null,
    controlIcon: null
};
PushMenu.initialized = false;
PushMenu.clickNav = () => {
    const navigation = PushMenu.elements.navigation;
    navigation?.click();
};
export { PushMenu };
