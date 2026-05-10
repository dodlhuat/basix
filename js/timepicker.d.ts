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
    constructor(elementOrSelector: string | HTMLElement, options?: TimeSpanPickerOptions);
    private queryInput;
    private render;
    private readonly handleStartChange;
    private readonly handleEndChange;
    private attachEventListeners;
    private toMinutes;
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
