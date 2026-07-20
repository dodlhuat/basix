import { sanitizeHtml } from './utils.js';
import { ListenerGroup } from './listeners.js';
const CLOSE_ICON = '<div class="icon icon-close close"></div>';
class Modal {
    content;
    header;
    footer;
    closeable;
    type;
    template;
    modalWrapper = null;
    listeners = new ListenerGroup();
    constructor(contentOrOptions, header, footer, closeable = true, type = 'default') {
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
    }
    show() {
        this.hide();
        const wrapper = document.createElement('div');
        wrapper.className = 'modal-wrapper';
        wrapper.innerHTML = this.template;
        document.body.append(wrapper);
        this.modalWrapper = wrapper;
        const sig = { signal: this.listeners.signal };
        if (this.closeable) {
            wrapper.querySelector('.close')?.addEventListener('click', () => this.hide(), sig);
            wrapper.querySelector('.modal-background')?.addEventListener('click', (e) => this.handleBackgroundClick(e), sig);
            document.addEventListener('keydown', (e) => this.handleEscape(e), sig);
        }
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => {
            wrapper.classList.add('is-visible');
        });
    }
    hide() {
        const wrapper = this.modalWrapper;
        if (!wrapper)
            return;
        this.listeners.reset();
        document.body.style.overflow = '';
        wrapper.classList.remove('is-visible');
        setTimeout(() => {
            wrapper.remove();
            if (this.modalWrapper === wrapper) {
                this.modalWrapper = null;
            }
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
        const parts = [`<div class="modal modal-${this.type}">`];
        if (this.closeable) {
            parts.push(CLOSE_ICON);
        }
        if (this.header !== undefined) {
            const headerClass = `header ${this.type}-bg`;
            parts.push(`<div class="${headerClass}">${sanitizeHtml(this.header)}</div>`);
        }
        parts.push(sanitizeHtml(this.content));
        if (this.footer !== undefined) {
            parts.push(`<div class="footer">${sanitizeHtml(this.footer)}</div>`);
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
