interface TimeSpan {
    start: string;
    end: string;
}
interface TimeSpanPickerOptions {
    onChange?: (start: string, end: string) => void;
    defaultStart?: string;
    defaultEnd?: string;
    fromString?: string;
    toString?: string;
}
declare class TimeSpanPicker {
    private container;
    private startTimeInput;
    private endTimeInput;
    private onChange?;
    private readonly uid;
    private fromString;
    private toString;
    private barEl;
    private barFillEl;
    private startHandleEl;
    private endHandleEl;
    private dragState;
    constructor(elementOrSelector: string | HTMLElement, options?: TimeSpanPickerOptions);
    private queryInput;
    private render;
    private readonly handleStartChange;
    private readonly handleEndChange;
    private attachEventListeners;
    private attachBarListeners;
    private beginDrag;
    private readonly onStartHandleDown;
    private readonly onEndHandleDown;
    private readonly onFillDown;
    private readonly onPointerMove;
    private readonly onPointerUp;
    private toMinutes;
    private minutesToTime;
    private snap;
    private formatDuration;
    private updateUI;
    private handleChange;
    getValue(): TimeSpan;
    setValue(start: string, end: string): void;
    reset(): void;
    isValid(): boolean;
    destroy(): void;
}
export { TimeSpanPicker };
export type { TimeSpan, TimeSpanPickerOptions };
