const CLOSE_ICON = '<div class="icon icon-close close"></div>';
class Modal {
    constructor(contentOrOptions, header, footer, closeable = true, type = 'default') {
        this.modalWrapper = null;
        if (typeof contentOrOptions === 'object') {
            this.content = contentOrOptions.content;
            this.header = contentOrOptions.header;
            this.footer = contentOrOptions.footer;
            this.closeable = contentOrOptions.closeable ?? true;
            this.type = contentOrOptions.type ?? 'default';
        }
        else {
            this.content = contentOrOptions;
            this.header = header;
            this.footer = footer;
            this.closeable = closeable;
            this.type = type;
        }
        this.template = this.buildTemplate();
        this.hide = this.hide.bind(this);
        this.handleEscape = this.handleEscape.bind(this);
        this.handleBackgroundClick = this.handleBackgroundClick.bind(this);
    }
    show() {
        this.hide();
        const wrapper = document.createElement('div');
        wrapper.className = 'modal-wrapper';
        wrapper.innerHTML = this.template;
        document.body.append(wrapper);
        this.modalWrapper = wrapper;
        if (this.closeable) {
            const closeBtn = wrapper.querySelector('.close');
            closeBtn?.addEventListener('click', this.hide);
        }
        const background = wrapper.querySelector('.modal-background');
        if (this.closeable && background) {
            background.addEventListener('click', this.handleBackgroundClick);
        }
        if (this.closeable) {
            document.addEventListener('keydown', this.handleEscape);
        }
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => {
            wrapper.classList.add('is-visible');
        });
    }
    hide() {
        const wrapper = document.querySelector('.modal-wrapper');
        if (!wrapper)
            return;
        // Remove event listeners
        const closeBtn = wrapper.querySelector('.close');
        closeBtn?.removeEventListener('click', this.hide);
        const background = wrapper.querySelector('.modal-background');
        background?.removeEventListener('click', this.handleBackgroundClick);
        document.removeEventListener('keydown', this.handleEscape);
        document.body.style.overflow = '';
        wrapper.classList.remove('is-visible');
        setTimeout(() => {
            wrapper.remove();
            this.modalWrapper = null;
        }, 300);
    }
    handleEscape(e) {
        if (e.key === 'Escape') {
            this.hide();
        }
    }
    handleBackgroundClick(e) {
        if (e.target?.classList.contains('modal-background')) {
            this.hide();
        }
    }
    buildTemplate() {
        const parts = ['<div class="modal">'];
        if (this.closeable) {
            parts.push(CLOSE_ICON);
        }
        if (this.header !== undefined) {
            const headerClass = `header ${this.type}-bg`;
            parts.push(`<div class="${headerClass}">${this.header}</div>`);
        }
        parts.push(this.content);
        if (this.footer !== undefined) {
            parts.push(`<div class="footer">${this.footer}</div>`);
        }
        parts.push('</div>');
        parts.push('<div class="modal-background"></div>');
        return parts.join('');
    }
    updateContent(content) {
        this.content = content;
        this.template = this.buildTemplate();
        if (this.modalWrapper) {
            const modalElement = this.modalWrapper.querySelector('.modal');
            if (modalElement) {
                const tempWrapper = document.createElement('div');
                tempWrapper.innerHTML = this.template;
                const newModal = tempWrapper.querySelector('.modal');
                if (newModal) {
                    modalElement.innerHTML = newModal.innerHTML;
                }
            }
        }
    }
    isVisible() {
        return this.modalWrapper !== null && document.body.contains(this.modalWrapper);
    }
    destroy() {
        this.hide();
    }
}
export { Modal };
