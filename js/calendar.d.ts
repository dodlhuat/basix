export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    className?: string;
}
export type CalendarView = 'month' | 'week' | 'agenda';
export interface CalendarLocale {
    monthNames: string[];
    dayNamesShort: string[];
    dayNamesFull: string[];
    firstDayOfWeek: number;
    today: string;
    month: string;
    week: string;
    agenda: string;
    allDay: string;
    noEvents: string;
}
export interface CalendarOptions {
    container: HTMLElement | string;
    events?: CalendarEvent[];
    view?: CalendarView;
    locale?: Partial<CalendarLocale>;
    showOutsideDays?: boolean;
    onDayClick?: (date: Date) => void;
    onEventClick?: (event: CalendarEvent) => void;
    onChange?: (date: Date, view: CalendarView) => void;
    className?: string;
    iconBasePath?: string;
}
interface SpanLayout {
    event: CalendarEvent;
    colStart: number;
    colEnd: number;
    lane: number;
    continuesBefore: boolean;
    continuesAfter: boolean;
}
interface TimedEventLayout {
    event: CalendarEvent;
    top: number;
    height: number;
    col: number;
    cols: number;
}
export declare const CalendarLogic: {
    getMonthGrid(year: number, month: number, firstDayOfWeek: number): Date[];
    getWeekDays(date: Date, firstDayOfWeek: number): Date[];
    isSameDay(a: Date, b: Date): boolean;
    isToday(date: Date): boolean;
    isCurrentMonth(date: Date, year: number, month: number): boolean;
    startOfDay(d: Date): Date;
    isMultiDay(event: CalendarEvent): boolean;
    getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[];
    getAllDayEvents(events: CalendarEvent[], day: Date): CalendarEvent[];
    getTimedEvents(events: CalendarEvent[], day: Date): CalendarEvent[];
    getEventPosition(event: CalendarEvent, day: Date): {
        top: number;
        height: number;
    };
    formatTime(date: Date): string;
    /** Compute horizontal span layout for a set of events within a 7-day row. */
    computeSpanLayout(weekDays: Date[], events: CalendarEvent[]): SpanLayout[];
    /** Compute side-by-side column layout for overlapping timed events in a day column. */
    computeTimedLayout(events: CalendarEvent[], day: Date): TimedEventLayout[];
    nowLinePct(): number;
};
export declare class CalendarRenderer {
    private locale;
    constructor(locale: CalendarLocale);
    renderWeekdayHeaders(): string;
    renderEvent(event: CalendarEvent, compact?: boolean): string;
    renderSpanBar(layout: SpanLayout): string;
    renderMonthDay(date: Date, currentMonth: number, currentYear: number, events: CalendarEvent[], showOutsideDays: boolean): string;
    renderWeekRow(weekDays: Date[], currentMonth: number, currentYear: number, events: CalendarEvent[], showOutsideDays: boolean): string;
    renderMonthView(year: number, month: number, events: CalendarEvent[], showOutsideDays: boolean, firstDayOfWeek: number): string;
    renderWeekView(date: Date, events: CalendarEvent[], firstDayOfWeek: number, showNowLine?: boolean): string;
    renderAgendaView(year: number, month: number, events: CalendarEvent[]): string;
}
export declare class Calendar {
    private container;
    private options;
    private locale;
    private renderer;
    private currentDate;
    private currentView;
    private events;
    private nowLineTimer;
    constructor(options: CalendarOptions);
    setView(view: CalendarView): void;
    next(): void;
    prev(): void;
    today(): void;
    addEvent(event: CalendarEvent): void;
    removeEvent(id: string): void;
    setEvents(events: CalendarEvent[]): void;
    getEvents(): CalendarEvent[];
    destroy(): void;
    private getTitle;
    private buildHeader;
    private buildBody;
    private render;
    private scrollToNow;
    private startNowLineTimer;
    private clearNowLineTimer;
    private readonly boundHandleClick;
    private readonly boundHandleKeydown;
    private attachEvents;
    private handleClick;
    private handleKeydown;
}
export {};
