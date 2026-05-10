interface TooltipOptions {
    position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
    offset?: number;
    delay?: number;
    className?: string;
    /** Set to true when content is trusted HTML (e.g. from data-tooltip-id).
     *  Defaults to false — content is treated as plain text and escaped. */
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
    constructor(trigger: HTMLElement, content: string, options?: TooltipOptions);
    static initializeAll(): void;
    show(): void;
    hide(): void;
    private static hideActive;
    private createTooltip;
    private position;
    private attachEvents;
    private handleMouseEnter;
    private handleMouseLeave;
    private handleFocus;
    private handleBlur;
    destroy(): void;
}
export { Tooltip };
export type { TooltipOptions };
