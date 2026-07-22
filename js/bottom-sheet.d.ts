interface BottomSheetOptions {
    content: string;
    header?: string;
    footer?: string;
    closeable?: boolean;
    snapHeight?: 'auto' | 'half' | 'full';
    onClose?: () => void;
    iconBasePath?: string;
}
declare class BottomSheet {
    private readonly content;
    private readonly header?;
    private readonly footer?;
    private readonly closeable;
    private snapHeight;
    private readonly onClose?;
    private readonly iconBasePath;
    private wrapper;
    private sheet;
    private listeners;
    private dragStartY;
    private currentDragY;
    private isDragging;
    private isDesktop;
    constructor(options: BottomSheetOptions);
    show(): void;
    hide(): void;
    snapTo(height: 'auto' | 'half' | 'full'): void;
    private handleTouchStart;
    private handleTouchMove;
    private handleTouchEnd;
    private updateScrollMask;
    private buildTemplate;
    isVisible(): boolean;
    destroy(): void;
}
export { BottomSheet, type BottomSheetOptions };
