/** Localised day and month names for the DatePicker. */
interface DatePickerLocales {
    days: string[];
    months: string[];
}
/** Configuration options for the DatePicker. */
interface DatePickerOptions {
    mode?: 'single' | 'range';
    startDay?: number;
    timePicker?: boolean;
    locales?: DatePickerLocales;
    format?: (date: Date) => string;
    onSelect?: (date: Date | DateRange) => void;
}
/** A date range with optional start and end dates. */
interface DateRange {
    start: Date | null;
    end: Date | null;
}
/** Calendar-based date (or date-range) picker that attaches to an input element. */
declare class DatePicker {
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
    private handleDocumentClick;
    private abortController;
    constructor(elementOrSelector: string | HTMLInputElement, options?: DatePickerOptions);
    private init;
    private createCalendarElement;
    private attachEvents;
    private show;
    private hide;
    private render;
    private createHeader;
    private navigate;
    private createMonthGrid;
    private createYearGrid;
    private createGrid;
    private createTimePicker;
    private createSpinner;
    private applyTimeToSelection;
    private changeMonth;
    private handleDateClick;
    private updateInput;
    destroy(): void;
}
export { DatePicker };
export type { DatePickerOptions, DatePickerLocales, DateRange };
