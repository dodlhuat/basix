const closure_icon = '<div class="icon close"></div>';
const modal = {
    show(content, header, footer, closeable) {
        let div = document.createElement('div');
        div.className = 'modal-wrapper'
        div.innerHTML = buildTemplate(content, header, footer, closeable);
        document.querySelector('body').append(div);

        document.querySelector('.modal-wrapper .close').removeEventListener('click', hideModal);
        document.querySelector('.modal-wrapper .close').addEventListener('click', hideModal);
    },
    hide() {
        document.querySelector('.modal-wrapper').remove();
    }
}

const hideModal = function () {
    modal.hide();
}

const buildTemplate = function (content, header, footer, closeable) {
    let template = '<div class="modal">';
    if (closeable === undefined) {
        closeable = true;
    }
    if (closeable) {
        template += closure_icon;
    }
    if (header !== undefined) {
        template += '<div class="header">' + header + '</div>';
    }
    template += content;
    if (footer !== undefined) {
        template += '<div class="footer">' + footer + '</div>';
    }
    template += '</div>';
    template += '<div class="modal-background"></div>'
    return template;
}

export {modal};