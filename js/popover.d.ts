import type { Placement } from './position.js';
type PopoverPlacement = Placement | 'auto';
type PopoverAlign = 'start' | 'center' | 'end';
type PopoverTrigger = 'click' | 'hover';
interface PopoverOptions {
    content: string;
    placement?: PopoverPlacement;
    align?: PopoverAlign;
    offset?: number;
    arrow?: boolean;
    triggerMode?: PopoverTrigger;
    closeOnOutsideClick?: boolean;
    closeOnEscape?: boolean;
    className?: string;
    onOpen?: () => void;
    onClose?: () => void;
}
declare class Popover {
    private static openPopovers;
    private static idCounter;
    private readonly trigger;
    private readonly opts;
    private popoverEl;
    private hoverTimer;
    private listeners;
    private openListeners;
    constructor(triggerEl: HTMLElement | string, options: PopoverOptions);
    get isOpen(): boolean;
    open(): void;
    close(): void;
    toggle(): void;
    destroy(): void;
    static closeAll(): void;
    static initAll(): void;
    private buildEl;
    private reposition;
    private onClick;
    private onMouseEnter;
    private onMouseLeave;
    private onOutsideClick;
    private onEscape;
    private attachTrigger;
}
export { Popover };
export type { PopoverOptions, PopoverPlacement, PopoverAlign, PopoverTrigger };
