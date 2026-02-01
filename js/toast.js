class Toast {
    constructor(contentOrOptions, header = '', type, closeable = true) {
        this.closureIcon = '<div class="icon icon-close close"></div>';
        this.toastElement = null;
        this.timerId = null;
        this.hide = () => {
            if (this.timerId !== null) {
                clearTimeout(this.timerId);
                this.timerId = null;
            }
            this.toastElement?.classList.remove('show');
            setTimeout(() => {
                const closeButton = this.toastElement?.querySelector('.close');
                if (closeButton) {
                    closeButton.removeEventListener('click', this.handleClose);
                }
                this.toastElement?.remove();
                this.toastElement = null;
            }, 150);
        };
        this.handleClose = () => {
            this.hide();
        };
        if (typeof contentOrOptions === 'object') {
            this.content = contentOrOptions.content;
            this.header = contentOrOptions.header ?? '';
            this.type = contentOrOptions.type;
            this.closeable = contentOrOptions.closeable ?? true;
        }
        else {
            this.content = contentOrOptions;
            this.header = header;
            this.type = type;
            this.closeable = closeable;
        }
        this.template = this.buildTemplate();
    }
    show(ms) {
        const div = document.createElement('div');
        div.className = 'toast';
        if (this.type) {
            div.classList.add(this.type);
        }
        div.innerHTML = this.template;
        document.body.appendChild(div);
        this.toastElement = div;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.toastElement?.classList.add('show');
                const closeButton = this.toastElement?.querySelector('.close');
                if (closeButton) {
                    closeButton.addEventListener('click', this.handleClose);
                }
                if (ms !== undefined && ms > 0) {
                    this.startTimer(ms);
                }
            });
        });
    }
    startTimer(ms, elapsed = 0) {
        const stepSize = 250;
        if (elapsed >= ms) {
            this.hide();
            return;
        }
        this.timerId = window.setTimeout(() => {
            elapsed += stepSize;
            const width = 100 - (100 / ms) * elapsed;
            const barElement = this.toastElement?.querySelector('.bar');
            if (barElement) {
                barElement.style.width = `${width}%`;
                this.startTimer(ms, elapsed);
            }
        }, stepSize);
    }
    buildTemplate() {
        const parts = ['<div class="bar"></div>'];
        if (this.closeable) {
            parts.push(this.closureIcon);
        }
        if (this.header) {
            parts.push(`<div class="header">${this.escapeHtml(this.header)}</div>`);
        }
        parts.push(`<div class="content">${this.escapeHtml(this.content)}</div>`);
        return parts.join('');
    }
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
export { Toast };
