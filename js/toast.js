class Toast {
    constructor(content, header, type, closeable) {
        this.content = content;
        this.header = header;
        this.type = type;
        this.closeable = closeable;
        this.closure_icon = '<div class="icon icon-close close"></div>';
        this.template = this.#buildTemplate(this.content, this.header, this.closeable);
    }

    show(ms) {
        let div = document.createElement('div');
        div.className = 'toast';
        if (this.type !== undefined) {
            div.classList.add(this.type);
        }

        div.innerHTML = this.template;
        document.querySelector('body').append(div);
        setTimeout(() => {
            document.querySelector('.toast').classList.add('show');
            document.querySelector('.toast .close').removeEventListener('click', this.hide);
            document.querySelector('.toast .close').addEventListener('click', this.hide);

            if (ms !== undefined) {
                this.#timer(ms);
            }
        }, 150);
    }
    hide() {
        document.querySelector('.toast').classList.remove('show');
        setTimeout(() => {
            const toast = document.querySelector('.toast');
            if (toast) toast.remove();
        }, 150);
    }

    #timer(ms, timing) {
        const stepSize = 250;
        if (timing === undefined) {
            timing = 0;
        }
        if (timing >= ms) {
            this.hide();
            return false;
        }
        setTimeout(() => {
            timing += stepSize;
            const width = 100 - ((100 / ms) * timing);
            const element = document.querySelector('.toast .bar');
            if (element) {
                document.querySelector('.toast .bar').style.width = width + '%';
                this.#timer(ms, timing);
            }
        }, stepSize);
    }

    #buildTemplate(content, header, closeable) {
        let template = '<div class="bar"></div>';
        if (closeable === undefined) {
            closeable = true;
        }
        if (closeable) {
            template += this.closure_icon;
        }
        template += '<div class="header">' + header + '</div>';
        template += '<div class="content">' + content + '</div>';
        return template;
    }
}



export {Toast};