const menu = {
    init() {
        document.querySelector('#navigation').addEventListener('change', function (event) {
            const content = document.querySelector('.push-content');
            const menu = document.querySelector('.push-menu');
            const pushed = content.classList.contains('pushed')
            if (pushed) {
                content.classList.remove('pushed');
                menu.classList.remove('pushed');
            } else {
                content.classList.add('pushed');
                menu.classList.add('pushed');
            }
        });
    }
}

export {menu}