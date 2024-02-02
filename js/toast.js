import {utils} from "./utils";

const closure_icon = '<div class="icon close"></div>';
const toast = {
    show(content, header, type, closeable) {
        let div = document.createElement('div');
        div.className = 'toast';
        if (type !== undefined) {
            div.classList.add(type);
        }

        div.innerHTML = buildTemplate(content, header, closeable);
        utils.getElement('body').append(div);
    },
    hide() {

    }
}

const buildTemplate = function (content, header, closeable) {
    let template = '';
    if (closeable === undefined) {
        closeable = true;
    }
    if (closeable) {
        template += closure_icon;
    }
    template += '<div class="header">' + header + '</div>';
    template += '<div class="content">' + content + '</div>';
    return template;
}

export {toast};