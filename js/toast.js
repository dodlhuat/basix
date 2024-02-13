import {utils} from "./utils.js";

const closure_icon = '<div class="icon close"></div>';
const toast = {
    show(content, header, type, closeable, ms) {
        let div = document.createElement('div');
        div.className = 'toast';
        if (type !== undefined) {
            div.classList.add(type);
        }

        div.innerHTML = buildTemplate(content, header, closeable);
        utils.getElement('body').append(div);
        setTimeout(() => {
            utils.getElement('.toast').classList.add('show');
            utils.getElement('.toast .close').removeEventListener('click', hideToast);
            utils.getElement('.toast .close').addEventListener('click', hideToast);

            if (ms !== undefined) {
                timer(ms);
            }
        }, 150);
    },
    hide() {
        utils.getElement('.toast').classList.remove('show');
        setTimeout(() => {
            utils.getElement('.toast').remove();
        }, 150);
    }
}

const hideToast = function () {
    toast.hide();
}

const timer = function (ms, timing) {
    const stepSize = 250;
    if (timing === undefined) {
        timing = 0;
    }
    if (timing >= ms) {
        hideToast();
        return false;
    }
    setTimeout(() => {
        timing += stepSize;
        const width = 100 - ((100 / ms) * timing);
        document.querySelector('.toast .bar').style.width = width + '%';
        timer(ms, timing);
    }, stepSize);
}

const buildTemplate = function (content, header, closeable) {
    let template = '<div class="bar"></div>';
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