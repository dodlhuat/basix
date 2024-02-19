const menu = {
    init() {
        document.querySelector('.navigation').addEventListener('change', function (event) {
            const content = document.querySelector('.push-content');
            const pushed = content.classList.contains('pushed');
            if (!pushed) {
                content.addEventListener('click', clickNav);
            } else {
                content.removeEventListener('click', clickNav);
            }
            pushToggle();
        });
    }
}

const pushToggle = function () {
    const content = document.querySelector('.push-content');
    const menu = document.querySelector('.push-menu');
    const pushed = content.classList.contains('pushed');
    const control_icon = document.querySelector('.navigation-controls .icon');
    const header = document.querySelector('.main-header');
    if (pushed) {
        content.classList.remove('pushed');
        menu.classList.remove('pushed');
        header.classList.remove('pushed');
        control_icon.innerText = 'menu'
    } else {
        content.classList.add('pushed');
        menu.classList.add('pushed');
        header.classList.add('pushed');
        control_icon.innerText = 'menu_open'
    }
}

const clickNav = function () {
    document.querySelector('.navigation').click();
}

export {menu}