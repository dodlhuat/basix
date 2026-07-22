type ToastType = 'success' | 'error' | 'warning' | 'info';
interface ToastOptions {
    content: string;
    header?: string;
    type?: ToastType;
    closeable?: boolean;
    iconBasePath?: string;
}
declare class Toast {
    private readonly content;
    private readonly header;
    private readonly type?;
    private readonly closeable;
    private readonly iconBasePath;
    private readonly closureIcon;
    private readonly template;
    private toastElement;
    private timerId;
    private openListeners;
    constructor(options: ToastOptions);
    constructor(content: string, header?: string, type?: ToastType, closeable?: boolean);
    show(ms?: number): void;
    hide(): void;
    private startTimer;
    destroy(): void;
    private buildTemplate;
}
export { Toast };
export type { ToastOptions, ToastType };
