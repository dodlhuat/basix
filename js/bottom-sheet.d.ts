/** Options for configuring a BottomSheet instance. */
interface BottomSheetOptions {
    content: string;
    header?: string;
    footer?: string;
    closeable?: boolean;
    snapHeight?: 'auto' | 'half' | 'full';
    onClose?: () => void;
}
/** Slide-up sheet that attaches to the bottom of the viewport. */
declare class BottomSheet {
    private readonly content;
    private readonly header?;
    private readonly footer?;
    private readonly closeable;
    private snapHeight;
    private readonly onClose?;
    private wrapper;
    private sheet;
    private handle;
    private body;
    private dragStartY;
    private currentDragY;
    private isDragging;
    constructor(options: BottomSheetOptions);
    show(): void;
    hide(): void;
    snapTo(height: 'auto' | 'half' | 'full'): void;
    private handleEscape;
    private handleBackdropClick;
    private handleTouchStart;
    private handleTouchMove;
    private handleTouchEnd;
    private updateScrollMask;
    private buildTemplate;
    isVisible(): boolean;
    destroy(): void;
}
export { BottomSheet, type BottomSheetOptions };
