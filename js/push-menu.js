const menu = {
    init() {
        document.querySelector('#navigation').addEventListener('change', function (event) {
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
    if (pushed) {
        content.classList.remove('pushed');
        menu.classList.remove('pushed');
        control_icon.classList.remove('arrow-left');
        control_icon.classList.add('arrow-right');
    } else {
        content.classList.add('pushed');
        menu.classList.add('pushed');
        control_icon.classList.remove('arrow-right');
        control_icon.classList.add('arrow-left');
    }
}

const clickNav = function () {
    document.querySelector('#navigation').click();
}

export {menu}