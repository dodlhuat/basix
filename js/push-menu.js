class PushMenu {
    static init() {
        document.querySelector('.navigation').addEventListener('change', function () {
            const content = document.querySelector('.push-content');
            const pushed = content.classList.contains('pushed');
            if (!pushed) {
                content.addEventListener('click', PushMenu.clickNav);
            } else {
                content.removeEventListener('click', PushMenu.clickNav);
            }
            PushMenu.pushToggle();
        });
    }

    static pushToggle() {
        const content = document.querySelector('.push-content');
        const menu = document.querySelector('.push-menu');
        const pushed = content.classList.contains('pushed');
        const control_icon = document.querySelector('.navigation-controls .icon');
        const header = document.querySelector('.main-header');
        if (pushed) {
            content.classList.remove('pushed');
            menu.classList.remove('pushed');
            header.classList.remove('pushed');
            control_icon.classList.remove('icon-menu_open')
            control_icon.classList.add('icon-menu')
        } else {
            content.classList.add('pushed');
            menu.classList.add('pushed');
            header.classList.add('pushed');
            control_icon.classList.add('icon-menu_open')
            control_icon.classList.remove('icon-menu')
        }
    }

    static clickNav() {
        document.querySelector('.navigation').click();
    }
}

export {PushMenu}