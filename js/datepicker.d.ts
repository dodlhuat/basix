interface DatePickerLocales {
    days: string[];
    months: string[];
}
interface DatePickerOptions {
    mode?: 'single' | 'range';
    startDay?: number;
    timePicker?: boolean;
    locales?: DatePickerLocales;
    format?: (date: Date) => string;
    onSelect?: (date: Date | DateRange) => void;
}
interface DateRange {
    start: Date | null;
    end: Date | null;
}
declare class DatePicker {
    private static readonly CLOCK_OUTER_RADIUS_PERCENT;
    private static readonly CLOCK_INNER_RADIUS_PERCENT;
    private input;
    private options;
    private currentDate;
    private selectedDate;
    private rangeStart;
    private rangeEnd;
    private viewYear;
    private viewMonth;
    private viewMode;
    private yearRangeStart;
    private selectedHours;
    private selectedMinutes;
    private calendar;
    private backdrop;
    private clockMode;
    private listeners;
    private showListeners;
    private clockListeners;
    constructor(elementOrSelector: string | HTMLInputElement, options?: DatePickerOptions);
    private init;
    private createCalendarElement;
    private attachEvents;
    private show;
    private hide;
    private render;
    private renderTimePicker;
    private createHeader;
    private navigate;
    private createMonthGrid;
    private createYearGrid;
    private createGrid;
    private createTimePicker;
    private createClockHeader;
    private createClockFace;
    private createClockNumber;
    private clockPosition;
    private positionHand;
    private bindClockDrag;
    private selectClockValue;
    private applyTimeToSelection;
    private changeMonth;
    private handleDateClick;
    private updateInput;
    destroy(): void;
}
export { DatePicker };
export type { DatePickerOptions, DatePickerLocales, DateRange };
