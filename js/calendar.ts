// ============================================================
// calendar.ts — Basix Calendar Component
// Integrates with @dodlhuat/basix design tokens & conventions
// ============================================================

// -----------------------------------------------------------
// Types & Interfaces
// -----------------------------------------------------------

export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    /** Extra CSS class — use Basix badge/alert classes e.g. "badge-success" */
    className?: string;
}

export type CalendarView = 'month' | 'week' | 'agenda';

export interface CalendarLocale {
    monthNames: string[];
    dayNamesShort: string[];
    dayNamesFull: string[];
    /** 0 = Sunday, 1 = Monday */
    firstDayOfWeek: number;
    today: string;
    month: string;
    week: string;
    agenda: string;
    allDay: string;
    noEvents: string;
}

export interface CalendarOptions {
    /** Target container element or CSS selector */
    container: HTMLElement | string;
    events?: CalendarEvent[];
    view?: CalendarView;
    locale?: Partial<CalendarLocale>;
    /** Show days outside the current month in month view */
    showOutsideDays?: boolean;
    /** Callback when a day cell is clicked */
    onDayClick?: (date: Date) => void;
    /** Callback when an event is clicked */
    onEventClick?: (event: CalendarEvent) => void;
    /** Callback when view or date changes */
    onChange?: (date: Date, view: CalendarView) => void;
    /** Extra CSS class injected on the root .cal element */
    className?: string;
}

// -----------------------------------------------------------
// Date Logic (pure functions, no side effects)
// -----------------------------------------------------------

export const CalendarLogic = {
    /**
     * Returns all days to render for a month grid (including leading/trailing
     * days from adjacent months to fill the 7-column grid).
     */
    getMonthGrid(year: number, month: number, firstDayOfWeek: number): Date[] {
        const firstOfMonth = new Date(year, month, 1);
        const lastOfMonth = new Date(year, month + 1, 0);

        // Leading days from previous month
        let startDow = firstOfMonth.getDay() - firstDayOfWeek;
        if (startDow < 0) startDow += 7;

        const days: Date[] = [];

        for (let i = startDow; i > 0; i--) {
            days.push(new Date(year, month, 1 - i));
        }
        for (let d = 1; d <= lastOfMonth.getDate(); d++) {
            days.push(new Date(year, month, d));
        }

        // Trailing days to fill remaining cells (always complete the row)
        const remaining = 7 - (days.length % 7);
        if (remaining < 7) {
            for (let i = 1; i <= remaining; i++) {
                days.push(new Date(year, month + 1, i));
            }
        }

        return days;
    },

    /** Returns the 7 dates of the week containing `date`. */
    getWeekDays(date: Date, firstDayOfWeek: number): Date[] {
        const d = new Date(date);
        const dow = d.getDay();
        let diff = dow - firstDayOfWeek;
        if (diff < 0) diff += 7;
        d.setDate(d.getDate() - diff);

        return Array.from({ length: 7 }, (_, i) => {
            const day = new Date(d);
            day.setDate(d.getDate() + i);
            return day;
        });
    },

    isSameDay(a: Date, b: Date): boolean {
        return (
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate()
        );
    },

    isToday(date: Date): boolean {
        return CalendarLogic.isSameDay(date, new Date());
    },

    isCurrentMonth(date: Date, year: number, month: number): boolean {
        return date.getFullYear() === year && date.getMonth() === month;
    },

    /** Returns all events that fall (fully or partially) on a given day. */
    getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        return events.filter(
            (e) => e.start <= dayEnd && e.end >= dayStart
        );
    },

    /** Returns only allDay events for a day. */
    getAllDayEvents(events: CalendarEvent[], day: Date): CalendarEvent[] {
        return CalendarLogic.getEventsForDay(events, day).filter((e) => e.allDay);
    },

    /** Returns only timed events for a day. */
    getTimedEvents(events: CalendarEvent[], day: Date): CalendarEvent[] {
        return CalendarLogic.getEventsForDay(events, day).filter((e) => !e.allDay);
    },

    /** Returns top-offset % and height % for a timed event within a day column. */
    getEventPosition(event: CalendarEvent, day: Date): { top: number; height: number } {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(24, 0, 0, 0);

        const totalMs = 24 * 60 * 60 * 1000;
        const startMs = Math.max(event.start.getTime(), dayStart.getTime()) - dayStart.getTime();
        const endMs = Math.min(event.end.getTime(), dayEnd.getTime()) - dayStart.getTime();

        return {
            top: (startMs / totalMs) * 100,
            height: Math.max(((endMs - startMs) / totalMs) * 100, 2), // min 2%
        };
    },

    formatTime(date: Date): string {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
};

// -----------------------------------------------------------
// Default Locale
// -----------------------------------------------------------

const DEFAULT_LOCALE: CalendarLocale = {
    monthNames: [
        'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
    ],
    dayNamesShort: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
    dayNamesFull: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
    firstDayOfWeek: 1,
    today: 'Heute',
    month: 'Monat',
    week: 'Woche',
    agenda: 'Agenda',
    allDay: 'Ganztägig',
    noEvents: 'Keine Termine',
};

// -----------------------------------------------------------
// Renderer — builds DOM from CalendarLogic output
// -----------------------------------------------------------

export class CalendarRenderer {
    private locale: CalendarLocale;

    constructor(locale: CalendarLocale) {
        this.locale = locale;
    }

    /** Ordered day-name headers respecting firstDayOfWeek */
    renderWeekdayHeaders(): string {
        const { dayNamesShort, firstDayOfWeek } = this.locale;
        const ordered = [
            ...dayNamesShort.slice(firstDayOfWeek),
            ...dayNamesShort.slice(0, firstDayOfWeek),
        ];
        return ordered
            .map((name) => `<div class="cal__weekday" aria-label="${name}">${name}</div>`)
            .join('');
    }

    renderEvent(event: CalendarEvent, compact = false): string {
        const extraClass = event.className ?? '';
        if (compact) {
            return `<div class="cal__event-pill ${extraClass}"
        data-event-id="${event.id}"
        role="button"
        tabindex="0"
        aria-label="${event.title}"
        title="${event.title}">${event.title}</div>`;
        }
        return `<div class="cal__event-pill ${extraClass}"
      data-event-id="${event.id}"
      role="button"
      tabindex="0"
      aria-label="${event.title}, ${CalendarLogic.formatTime(event.start)} – ${CalendarLogic.formatTime(event.end)}"
      title="${event.title}">
      <span class="cal__event-time">${CalendarLogic.formatTime(event.start)}</span>
      ${event.title}
    </div>`;
    }

    renderMonthDay(
        date: Date,
        currentMonth: number,
        currentYear: number,
        events: CalendarEvent[],
        selectedDate: Date | null,
        showOutsideDays: boolean
    ): string {
        const dayEvents = CalendarLogic.getEventsForDay(events, date);
        const isToday = CalendarLogic.isToday(date);
        const isSelected = selectedDate ? CalendarLogic.isSameDay(date, selectedDate) : false;
        const isOutside = !CalendarLogic.isCurrentMonth(date, currentYear, currentMonth);

        if (isOutside && !showOutsideDays) {
            return `<div class="cal__day cal__day--empty" aria-hidden="true"></div>`;
        }

        const classes = [
            'cal__day',
            isToday ? 'is-today' : '',
            isSelected ? 'is-selected' : '',
            isOutside ? 'cal__day--outside' : '',
            dayEvents.length > 0 ? 'has-events' : '',
        ]
            .filter(Boolean)
            .join(' ');

        const eventsHtml = dayEvents
            .slice(0, 3)
            .map((e) => this.renderEvent(e, true))
            .join('');

        const moreCount = dayEvents.length - 3;
        const moreHtml =
            moreCount > 0
                ? `<div class="cal__event-more">+${moreCount}</div>`
                : '';

        return `<div class="${classes}"
        role="gridcell"
        tabindex="0"
        aria-label="${date.toLocaleDateString()}"
        aria-selected="${isSelected}"
        data-date="${date.toISOString()}">
      <span class="cal__day-num">${date.getDate()}</span>
      <div class="cal__day-events">${eventsHtml}${moreHtml}</div>
    </div>`;
    }

    renderMonthView(
        year: number,
        month: number,
        events: CalendarEvent[],
        selectedDate: Date | null,
        showOutsideDays: boolean,
        firstDayOfWeek: number
    ): string {
        const days = CalendarLogic.getMonthGrid(year, month, firstDayOfWeek);
        const cells = days
            .map((d) =>
                this.renderMonthDay(d, month, year, events, selectedDate, showOutsideDays)
            )
            .join('');

        return `<div class="cal__month-grid" role="grid" aria-label="${this.locale.monthNames[month]} ${year}">
      ${this.renderWeekdayHeaders()}
      ${cells}
    </div>`;
    }

    renderWeekView(
        date: Date,
        events: CalendarEvent[],
        selectedDate: Date | null,
        firstDayOfWeek: number
    ): string {
        const days = CalendarLogic.getWeekDays(date, firstDayOfWeek);

        // All-day row
        const allDayCols = days
            .map((d) => {
                const adEvents = CalendarLogic.getAllDayEvents(events, d);
                const pills = adEvents.map((e) => this.renderEvent(e, true)).join('');
                return `<div class="cal__allday-col">${pills}</div>`;
            })
            .join('');

        // Day column headers
        const headCols = days
            .map((d) => {
                const isToday = CalendarLogic.isToday(d);
                const isSelected = selectedDate ? CalendarLogic.isSameDay(d, selectedDate) : false;
                const classes = [
                    'cal__week-head-day',
                    isToday ? 'is-today' : '',
                    isSelected ? 'is-selected' : '',
                ]
                    .filter(Boolean)
                    .join(' ');

                const dow = this.locale.dayNamesShort[(d.getDay() + 7) % 7];
                return `<div class="${classes}" data-date="${d.toISOString()}">
          ${dow}<span>${d.getDate()}</span>
        </div>`;
            })
            .join('');

        // Hour slots + events
        const hourLabels = Array.from({ length: 24 }, (_, h) => {
            const label = h === 0 ? '' : `${String(h).padStart(2, '0')}:00`;
            return `<div class="cal__time-slot">${label}</div>`;
        }).join('');

        const dayCols = days
            .map((d) => {
                const timedEvents = CalendarLogic.getTimedEvents(events, d);
                const hourCells = Array.from({ length: 24 }, () => `<div class="cal__day-col-hour"></div>`).join('');

                const eventOverlays = timedEvents
                    .map((e) => {
                        const { top, height } = CalendarLogic.getEventPosition(e, d);
                        const extraClass = e.className ?? '';
                        return `<div class="cal__week-event ${extraClass}"
              style="top:${top.toFixed(2)}%;height:${height.toFixed(2)}%"
              data-event-id="${e.id}"
              role="button"
              tabindex="0"
              aria-label="${e.title}">
              <span class="cal__event-time">${CalendarLogic.formatTime(e.start)}</span>
              ${e.title}
            </div>`;
                    })
                    .join('');

                return `<div class="cal__day-col" data-date="${d.toISOString()}">${hourCells}${eventOverlays}</div>`;
            })
            .join('');

        return `<div class="cal__week" role="grid">
      <div class="cal__week-head">
        <div class="cal__week-head-time"></div>
        ${headCols}
      </div>
      <div class="cal__allday">
        <div class="cal__allday-label">${this.locale.allDay}</div>
        ${allDayCols}
      </div>
      <div class="cal__week-body">
        <div class="cal__week-grid">
          <div class="cal__time-col">${hourLabels}</div>
          ${dayCols}
        </div>
      </div>
    </div>`;
    }

    renderAgendaView(year: number, month: number, events: CalendarEvent[]): string {
        // Collect all days in this month that have events
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let html = '';

        for (let d = 1; d <= daysInMonth; d++) {
            const day = new Date(year, month, d);
            const dayEvents = CalendarLogic.getEventsForDay(events, day);
            if (dayEvents.length === 0) continue;

            const isToday = CalendarLogic.isToday(day);
            const dow = this.locale.dayNamesFull[day.getDay()];

            html += `<div class="cal__agenda-day ${isToday ? 'is-today' : ''}">
        <div class="cal__agenda-date">
          <span class="cal__agenda-dow">${dow}</span>
          <span class="cal__agenda-num ${isToday ? 'is-today' : ''}">${d}</span>
        </div>
        <div class="cal__agenda-events">
          ${dayEvents.map((e) => `
            <div class="cal__agenda-event ${e.className ?? ''}"
              data-event-id="${e.id}"
              role="button"
              tabindex="0">
              <span class="cal__agenda-event-time">
                ${e.allDay ? this.locale.allDay : CalendarLogic.formatTime(e.start) + ' – ' + CalendarLogic.formatTime(e.end)}
              </span>
              <span class="cal__agenda-event-title">${e.title}</span>
            </div>`).join('')}
        </div>
      </div>`;
        }

        if (!html) {
            html = `<div class="cal__agenda-empty">${this.locale.noEvents}</div>`;
        }

        return `<div class="cal__agenda">${html}</div>`;
    }
}

// -----------------------------------------------------------
// Calendar — main controller class
// -----------------------------------------------------------

export class Calendar {
    private container: HTMLElement;
    private options: Required<CalendarOptions>;
    private locale: CalendarLocale;
    private renderer: CalendarRenderer;

    private currentDate: Date;
    private currentView: CalendarView;
    private selectedDate: Date | null = null;
    private events: CalendarEvent[] = [];

    constructor(options: CalendarOptions) {
        // Resolve container
        if (typeof options.container === 'string') {
            const el = document.querySelector<HTMLElement>(options.container);
            if (!el) throw new Error(`Calendar: container "${options.container}" not found.`);
            this.container = el;
        } else {
            this.container = options.container;
        }

        this.locale = { ...DEFAULT_LOCALE, ...(options.locale ?? {}) };
        this.renderer = new CalendarRenderer(this.locale);

        this.options = {
            container: this.container,
            events: options.events ?? [],
            view: options.view ?? 'month',
            locale: options.locale ?? {},
            showOutsideDays: options.showOutsideDays ?? true,
            onDayClick: options.onDayClick ?? (() => {}),
            onEventClick: options.onEventClick ?? (() => {}),
            onChange: options.onChange ?? (() => {}),
            className: options.className ?? '',
        };

        this.events = [...this.options.events];
        this.currentView = this.options.view;
        this.currentDate = new Date();

        this.render();
        this.attachEvents();
    }

    // ----------------------------------------------------------
    // Public API
    // ----------------------------------------------------------

    setView(view: CalendarView): void {
        this.currentView = view;
        this.render();
        this.options.onChange(this.currentDate, this.currentView);
    }

    next(): void {
        if (this.currentView === 'month' || this.currentView === 'agenda') {
            this.currentDate = new Date(
                this.currentDate.getFullYear(),
                this.currentDate.getMonth() + 1,
                1
            );
        } else {
            this.currentDate = new Date(
                this.currentDate.getFullYear(),
                this.currentDate.getMonth(),
                this.currentDate.getDate() + 7
            );
        }
        this.render();
        this.options.onChange(this.currentDate, this.currentView);
    }

    prev(): void {
        if (this.currentView === 'month' || this.currentView === 'agenda') {
            this.currentDate = new Date(
                this.currentDate.getFullYear(),
                this.currentDate.getMonth() - 1,
                1
            );
        } else {
            this.currentDate = new Date(
                this.currentDate.getFullYear(),
                this.currentDate.getMonth(),
                this.currentDate.getDate() - 7
            );
        }
        this.render();
        this.options.onChange(this.currentDate, this.currentView);
    }

    today(): void {
        this.currentDate = new Date();
        this.render();
        this.options.onChange(this.currentDate, this.currentView);
    }

    addEvent(event: CalendarEvent): void {
        this.events.push(event);
        this.render();
    }

    removeEvent(id: string): void {
        this.events = this.events.filter((e) => e.id !== id);
        this.render();
    }

    setEvents(events: CalendarEvent[]): void {
        this.events = [...events];
        this.render();
    }

    getEvents(): CalendarEvent[] {
        return [...this.events];
    }

    destroy(): void {
        this.container.innerHTML = '';
        this.container.removeAttribute('data-cal');
    }

    // ----------------------------------------------------------
    // Internal rendering
    // ----------------------------------------------------------

    private getTitle(): string {
        const { monthNames } = this.locale;
        const y = this.currentDate.getFullYear();
        const m = this.currentDate.getMonth();

        if (this.currentView === 'week') {
            const days = CalendarLogic.getWeekDays(this.currentDate, this.locale.firstDayOfWeek);
            const first = days[0];
            const last = days[6];
            if (first.getMonth() === last.getMonth()) {
                return `${monthNames[first.getMonth()]} ${y}`;
            }
            return `${monthNames[first.getMonth()]} – ${monthNames[last.getMonth()]} ${y}`;
        }

        return `${monthNames[m]} ${y}`;
    }

    private buildHeader(): string {
        const activeMonth = this.currentView === 'month' || this.currentView === 'agenda' ? 'cal__btn--active' : '';
        const activeWeek = this.currentView === 'week' ? 'cal__btn--active' : '';
        const activeAgenda = this.currentView === 'agenda' ? 'cal__btn--active' : '';

        return `<div class="cal__header">
      <div class="cal__nav">
        <button class="cal__btn cal__btn--today" data-action="today" aria-label="${this.locale.today}">${this.locale.today}</button>
        <button class="cal__btn" data-action="prev" aria-label="Zurück">
          <svg class="icon-svg" aria-hidden="true"><use href="svg-icons/icons.svg#chevron_left"/></svg>
        </button>
        <button class="cal__btn" data-action="next" aria-label="Vor">
          <svg class="icon-svg" aria-hidden="true"><use href="svg-icons/icons.svg#chevron_right"/></svg>
        </button>
      </div>
      <h2 class="cal__title" aria-live="polite">${this.getTitle()}</h2>
      <div class="cal__view-toggle" role="group" aria-label="Ansicht wählen">
        <button class="cal__btn ${activeMonth}" data-action="view-month" aria-pressed="${this.currentView === 'month'}">${this.locale.month}</button>
        <button class="cal__btn ${activeWeek}" data-action="view-week" aria-pressed="${this.currentView === 'week'}">${this.locale.week}</button>
        <button class="cal__btn ${activeAgenda}" data-action="view-agenda" aria-pressed="${this.currentView === 'agenda'}">${this.locale.agenda}</button>
      </div>
    </div>`;
    }

    private buildBody(): string {
        const { firstDayOfWeek } = this.locale;
        const y = this.currentDate.getFullYear();
        const m = this.currentDate.getMonth();

        switch (this.currentView) {
            case 'month':
                return this.renderer.renderMonthView(
                    y, m, this.events, this.selectedDate,
                    this.options.showOutsideDays, firstDayOfWeek
                );
            case 'week':
                return this.renderer.renderWeekView(
                    this.currentDate, this.events, this.selectedDate, firstDayOfWeek
                );
            case 'agenda':
                return this.renderer.renderAgendaView(y, m, this.events);
        }
    }

    private render(): void {
        const rootClass = ['cal', this.options.className].filter(Boolean).join(' ');
        this.container.setAttribute('data-cal', this.currentView);
        this.container.innerHTML = `<div class="${rootClass}" role="application" aria-label="Kalender">
      ${this.buildHeader()}
      <div class="cal__body">
        ${this.buildBody()}
      </div>
    </div>`;
    }

    // ----------------------------------------------------------
    // Event delegation
    // ----------------------------------------------------------

    private attachEvents(): void {
        this.container.addEventListener('click', (e) => this.handleClick(e));
        this.container.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    private handleClick(e: MouseEvent): void {
        const target = e.target as HTMLElement;

        // Nav / view buttons
        const btn = target.closest<HTMLElement>('[data-action]');
        if (btn) {
            const action = btn.dataset.action!;
            if (action === 'prev') this.prev();
            else if (action === 'next') this.next();
            else if (action === 'today') this.today();
            else if (action === 'view-month') this.setView('month');
            else if (action === 'view-week') this.setView('week');
            else if (action === 'view-agenda') this.setView('agenda');
            return;
        }

        // Event click
        const eventEl = target.closest<HTMLElement>('[data-event-id]');
        if (eventEl) {
            const id = eventEl.dataset.eventId!;
            const event = this.events.find((ev) => ev.id === id);
            if (event) {
                e.stopPropagation();
                this.options.onEventClick(event);
            }
            return;
        }

        // Day click
        const dayEl = target.closest<HTMLElement>('[data-date]');
        if (dayEl && dayEl.dataset.date) {
            const date = new Date(dayEl.dataset.date);
            this.selectedDate = date;
            this.options.onDayClick(date);
            // Re-render to update selection state
            this.render();
        }
    }

    private handleKeydown(e: KeyboardEvent): void {
        const target = e.target as HTMLElement;

        // Allow Enter/Space to trigger click on focused interactive elements
        if (e.key === 'Enter' || e.key === ' ') {
            if (target.closest('[data-date], [data-event-id], [data-action]')) {
                e.preventDefault();
                target.click();
            }
        }

        // Arrow key navigation within month grid
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
        const dayEl = target.closest<HTMLElement>('.cal__day[data-date]');
        if (!dayEl) return;

        e.preventDefault();
        const all = Array.from(
            this.container.querySelectorAll<HTMLElement>('.cal__day[data-date]:not(.cal__day--empty)')
        );
        const idx = all.indexOf(dayEl);
        let next = idx;

        if (e.key === 'ArrowRight') next = idx + 1;
        else if (e.key === 'ArrowLeft') next = idx - 1;
        else if (e.key === 'ArrowDown') next = idx + 7;
        else if (e.key === 'ArrowUp') next = idx - 7;

        all[Math.max(0, Math.min(next, all.length - 1))]?.focus();
    }
}