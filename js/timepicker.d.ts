interface TimeSpan {
    start: string;
    end: string;
}
interface TimeSpanPickerOptions {
    onChange?: (start: string, end: string) => void;
    defaultStart?: string;
    defaultEnd?: string;
    fromString?: string;
    toLabel?: string;
}
declare class TimeSpanPicker {
    private container;
    private startTimeInput;
    private endTimeInput;
    private onChange?;
    private readonly uid;
    private fromString;
    private toLabel;
    private pickerEl;
    private durationEl;
    private barEl;
    private barFillEl;
    private startHandleEl;
    private endHandleEl;
    private dragState;
    private listeners;
    private dragListeners;
    constructor(elementOrSelector: string | HTMLElement, options?: TimeSpanPickerOptions);
    private queryEl;
    private render;
    private handleChange;
    private attachEventListeners;
    private attachBarListeners;
    private beginDrag;
    private onStartHandleDown;
    private onEndHandleDown;
    private onFillDown;
    private onPointerMove;
    private onPointerUp;
    private toMinutes;
    private minutesToTime;
    private snap;
    private formatDuration;
    private updateUI;
    getValue(): TimeSpan;
    setValue(start: string, end: string): void;
    reset(): void;
    isValid(): boolean;
    destroy(): void;
}
export { TimeSpanPicker };
export type { TimeSpan, TimeSpanPickerOptions };
