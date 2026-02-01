type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
    content: string;
    header?: string;
    type?: ToastType;
    closeable?: boolean;
}

class Toast {
    private readonly content: string;
    private readonly header: string;
    private readonly type?: ToastType;
    private readonly closeable: boolean;
    private readonly closureIcon: string = '<div class="icon icon-close close"></div>';
    private readonly template: string;
    private toastElement: HTMLDivElement | null = null;
    private timerId: number | null = null;

    constructor(options: ToastOptions);
    constructor(content: string, header?: string, type?: ToastType, closeable?: boolean);
    constructor(
        contentOrOptions: string | ToastOptions,
        header: string = '',
        type?: ToastType,
        closeable: boolean = true
    ) {
        if (typeof contentOrOptions === 'object') {
            this.content = contentOrOptions.content;
            this.header = contentOrOptions.header ?? '';
            this.type = contentOrOptions.type;
            this.closeable = contentOrOptions.closeable ?? true;
        } else {
            this.content = contentOrOptions;
            this.header = header;
            this.type = type;
            this.closeable = closeable;
        }

        this.template = this.buildTemplate();
    }

    public show(ms?: number): void {
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

                const closeButton = this.toastElement?.querySelector<HTMLElement>('.close');
                if (closeButton) {
                    closeButton.addEventListener('click', this.handleClose);
                }

                if (ms !== undefined && ms > 0) {
                    this.startTimer(ms);
                }
            });
        });
    }

    public hide = (): void => {
        if (this.timerId !== null) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }

        this.toastElement?.classList.remove('show');

        setTimeout(() => {
            const closeButton = this.toastElement?.querySelector<HTMLElement>('.close');
            if (closeButton) {
                closeButton.removeEventListener('click', this.handleClose);
            }

            this.toastElement?.remove();
            this.toastElement = null;
        }, 150);
    };

    private handleClose = (): void => {
        this.hide();
    };

    private startTimer(ms: number, elapsed: number = 0): void {
        const stepSize = 250;

        if (elapsed >= ms) {
            this.hide();
            return;
        }

        this.timerId = window.setTimeout(() => {
            elapsed += stepSize;
            const width = 100 - (100 / ms) * elapsed;

            const barElement = this.toastElement?.querySelector<HTMLElement>('.bar');
            if (barElement) {
                barElement.style.width = `${width}%`;
                this.startTimer(ms, elapsed);
            }
        }, stepSize);
    }

    private buildTemplate(): string {
        const parts: string[] = ['<div class="bar"></div>'];

        if (this.closeable) {
            parts.push(this.closureIcon);
        }

        if (this.header) {
            parts.push(`<div class="header">${this.escapeHtml(this.header)}</div>`);
        }

        parts.push(`<div class="content">${this.escapeHtml(this.content)}</div>`);

        return parts.join('');
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

export { Toast };
export type { ToastOptions, ToastType };