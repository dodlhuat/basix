const CLOSE_ICON = '<div class="icon icon-close close"></div>';

type ModalType = 'default' | 'success' | 'error' | 'warning' | 'info';

interface ModalOptions {
    content: string;
    header?: string;
    footer?: string;
    closeable?: boolean;
    type?: ModalType;
}

class Modal {
    private content: string;
    private readonly header?: string;
    private readonly footer?: string;
    private readonly closeable: boolean;
    private readonly type: ModalType;
    private template: string;
    private modalWrapper: HTMLElement | null = null;

    constructor(options: ModalOptions);
    constructor(content: string, header?: string, footer?: string, closeable?: boolean, type?: ModalType);
    constructor(
        contentOrOptions: string | ModalOptions,
        header?: string,
        footer?: string,
        closeable: boolean = true,
        type: ModalType = 'default'
    ) {
        if (typeof contentOrOptions === 'object') {
            this.content = contentOrOptions.content;
            this.header = contentOrOptions.header;
            this.footer = contentOrOptions.footer;
            this.closeable = contentOrOptions.closeable ?? true;
            this.type = contentOrOptions.type ?? 'default';
        } else {
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

    public show(): void {
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

    public hide(): void {
        const wrapper = document.querySelector('.modal-wrapper');
        if (!wrapper) return;

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

    private handleEscape(e: KeyboardEvent): void {
        if (e.key === 'Escape') {
            this.hide();
        }
    }

    private handleBackgroundClick(e: Event): void {
        if ((e.target as HTMLElement)?.classList.contains('modal-background')) {
            this.hide();
        }
    }

    private buildTemplate(): string {
        const parts: string[] = ['<div class="modal">'];

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

    public updateContent(content: string): void {
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

    public isVisible(): boolean {
        return this.modalWrapper !== null && document.body.contains(this.modalWrapper);
    }

    public destroy(): void {
        this.hide();
    }
}

export { Modal, type ModalOptions, type ModalType };