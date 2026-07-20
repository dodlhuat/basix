interface TooltipOptions {
    position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
    offset?: number;
    delay?: number;
    className?: string;
    isHtml?: boolean;
}
declare class Tooltip {
    private static activeTooltip;
    private static idCounter;
    private readonly trigger;
    private readonly content;
    private readonly options;
    private tooltipElement;
    private showTimeout;
    private isVisible;
    private listeners;
    constructor(trigger: HTMLElement, content: string, options?: TooltipOptions);
    static initializeAll(): void;
    show(): void;
    hide(): void;
    private static hideActive;
    private createTooltip;
    private position;
    private attachEvents;
    destroy(): void;
}
export { Tooltip };
export type { TooltipOptions };
