type ModalType = 'default' | 'success' | 'error' | 'warning' | 'info';
/** Configuration options for a Modal dialog. */
interface ModalOptions {
    content: string;
    header?: string;
    footer?: string;
    closeable?: boolean;
    type?: ModalType;
}
/** Overlay dialog with optional header, footer, close button, and type variants. */
declare class Modal {
    private content;
    private readonly header?;
    private readonly footer?;
    private readonly closeable;
    private readonly type;
    private template;
    private modalWrapper;
    constructor(options: ModalOptions);
    constructor(content: string, header?: string, footer?: string, closeable?: boolean, type?: ModalType);
    show(): void;
    hide: () => void;
    private handleEscape;
    private handleBackgroundClick;
    private buildTemplate;
    updateContent(content: string): void;
    isVisible(): boolean;
    destroy(): void;
}
export { Modal, type ModalOptions, type ModalType };
