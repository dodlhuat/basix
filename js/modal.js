const closure_icon = '<div class="icon icon-close close"></div>';

class Modal {
    constructor(content, header, footer, closeable) {
        if (closeable === undefined) {
            closeable = true;
        }
        this.content = content;
        this.header = header;
        this.footer = footer;
        this.closeable = closeable;
        this.template = this.#buildTemplate();
    }

    show() {
        let div = document.createElement('div');
        div.className = 'modal-wrapper'
        div.innerHTML = this.template;
        document.querySelector('body').append(div);

        document.querySelector('.modal-wrapper .close').removeEventListener('click', this.hide);
        document.querySelector('.modal-wrapper .close').addEventListener('click', this.hide);
    }

    hide() {
        document.querySelector('.modal-wrapper').remove();
    }

    #buildTemplate() {
        let template = '<div class="modal">';
        if (this.closeable) {
            template += closure_icon;
        }
        if (this.header !== undefined) {
            template += '<div class="header">' + this.header + '</div>';
        }
        template += this.content;
        if (this.footer !== undefined) {
            template += '<div class="footer">' + this.footer + '</div>';
        }
        template += '</div>';
        template += '<div class="modal-background"></div>'
        return template;
    }
}

export {Modal};