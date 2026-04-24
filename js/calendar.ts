// ============================================================
// calendar.ts — Basix Calendar Component
// ============================================================

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

// -----------------------------------------------------------
// Date Logic
// -----------------------------------------------------------

export const CalendarLogic = {
    getMonthGrid(year: number, month: number, firstDayOfWeek: number): Date[] {
        const firstOfMonth = new Date(year, month, 1);
        const lastOfMonth = new Date(year, month + 1, 0);

        let startDow = firstOfMonth.getDay() - firstDayOfWeek;
        if (startDow < 0) startDow += 7;

        const days: Date[] = [];
        for (let i = startDow; i > 0; i--) days.push(new Date(year, month, 1 - i));
        for (let d = 1; d <= lastOfMonth.getDate(); d++) days.push(new Date(year, month, d));

        const remaining = 7 - (days.length % 7);
        if (remaining < 7) {
            for (let i = 1; i <= remaining; i++) days.push(new Date(year, month + 1, i));
        }
        return days;
    },

    getWeekDays(date: Date, firstDayOfWeek: number): Date[] {
        const d = new Date(date);
        let diff = d.getDay() - firstDayOfWeek;
        if (diff < 0) diff += 7;
        d.setDate(d.getDate() - diff);
        return Array.from({ length: 7 }, (_, i) => {
            const day = new Date(d);
            day.setDate(d.getDate() + i);
            return day;
        });
    },

    isSameDay(a: Date, b: Date): boolean {
        return a.getFullYear() === b.getFullYear()
            && a.getMonth() === b.getMonth()
            && a.getDate() === b.getDate();
    },

    isToday(date: Date): boolean {
        return CalendarLogic.isSameDay(date, new Date());
    },

    isCurrentMonth(date: Date, year: number, month: number): boolean {
        return date.getFullYear() === year && date.getMonth() === month;
    },

    startOfDay(d: Date): Date {
        const r = new Date(d);
        r.setHours(0, 0, 0, 0);
        return r;
    },

    isMultiDay(event: CalendarEvent): boolean {
        return !CalendarLogic.isSameDay(event.start, event.end);
    },

    getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
        const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
        const dayEnd   = new Date(day); dayEnd.setHours(23, 59, 59, 999);
        return events.filter(e => e.start <= dayEnd && e.end >= dayStart);
    },

    getAllDayEvents(events: CalendarEvent[], day: Date): CalendarEvent[] {
        return CalendarLogic.getEventsForDay(events, day).filter(e => e.allDay);
    },

    getTimedEvents(events: CalendarEvent[], day: Date): CalendarEvent[] {
        return CalendarLogic.getEventsForDay(events, day).filter(e => !e.allDay);
    },

    getEventPosition(event: CalendarEvent, day: Date): { top: number; height: number } {
        const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
        const dayEnd   = new Date(day); dayEnd.setHours(24, 0, 0, 0);
        const totalMs  = 24 * 60 * 60 * 1000;
        const startMs  = Math.max(event.start.getTime(), dayStart.getTime()) - dayStart.getTime();
        const endMs    = Math.min(event.end.getTime(),   dayEnd.getTime())   - dayStart.getTime();
        return {
            top:    (startMs / totalMs) * 100,
            height: Math.max(((endMs - startMs) / totalMs) * 100, 2),
        };
    },

    formatTime(date: Date): string {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },

    /** Compute horizontal span layout for a set of events within a 7-day row. */
    computeSpanLayout(weekDays: Date[], events: CalendarEvent[]): SpanLayout[] {
        if (!events.length) return [];

        const weekStart = CalendarLogic.startOfDay(weekDays[0]);
        const weekEnd   = CalendarLogic.startOfDay(weekDays[6]);

        const relevant = events.filter(e => {
            const s  = CalendarLogic.startOfDay(e.start);
            const en = CalendarLogic.startOfDay(e.end);
            return s <= weekEnd && en >= weekStart;
        });

        relevant.sort((a, b) => {
            const diff = a.start.getTime() - b.start.getTime();
            if (diff !== 0) return diff;
            return (b.end.getTime() - b.start.getTime()) - (a.end.getTime() - a.start.getTime());
        });

        const laneEnds: number[] = [];
        const layouts: SpanLayout[] = [];

        for (const event of relevant) {
            const eStart = CalendarLogic.startOfDay(event.start);
            const eEnd   = CalendarLogic.startOfDay(event.end);

            const continuesBefore = eStart < weekStart;
            const continuesAfter  = eEnd   > weekEnd;

            let colStart = 0;
            if (!continuesBefore) {
                for (let i = 0; i < 7; i++) {
                    if (CalendarLogic.isSameDay(weekDays[i], eStart)) { colStart = i; break; }
                }
            }

            let colEnd = 6;
            if (!continuesAfter) {
                for (let i = 6; i >= 0; i--) {
                    if (CalendarLogic.isSameDay(weekDays[i], eEnd)) { colEnd = i; break; }
                }
            }

            let lane = 0;
            while (lane < laneEnds.length && laneEnds[lane] >= colStart) lane++;
            if (lane >= laneEnds.length) laneEnds.push(colEnd);
            else laneEnds[lane] = colEnd;

            layouts.push({ event, colStart, colEnd, lane, continuesBefore, continuesAfter });
        }

        return layouts;
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
    dayNamesShort:  ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
    dayNamesFull:   ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
    firstDayOfWeek: 1,
    today:   'Heute',
    month:   'Monat',
    week:    'Woche',
    agenda:  'Agenda',
    allDay:  'Ganztägig',
    noEvents: 'Keine Termine',
};

// -----------------------------------------------------------
// Renderer
// -----------------------------------------------------------

export class CalendarRenderer {
    private locale: CalendarLocale;

    constructor(locale: CalendarLocale) {
        this.locale = locale;
    }

    renderWeekdayHeaders(): string {
        const { dayNamesShort, firstDayOfWeek } = this.locale;
        const ordered = [
            ...dayNamesShort.slice(firstDayOfWeek),
            ...dayNamesShort.slice(0, firstDayOfWeek),
        ];
        return ordered
            .map(name => `<div class="cal__weekday" aria-label="${name}">${name}</div>`)
            .join('');
    }

    renderEvent(event: CalendarEvent, compact = false): string {
        const cls = event.className ?? '';
        if (compact) {
            return `<div class="cal__event-pill ${cls}" data-event-id="${event.id}" role="button" tabindex="0" aria-label="${event.title}" title="${event.title}">${event.title}</div>`;
        }
        return `<div class="cal__event-pill ${cls}" data-event-id="${event.id}" role="button" tabindex="0" aria-label="${event.title}, ${CalendarLogic.formatTime(event.start)} – ${CalendarLogic.formatTime(event.end)}" title="${event.title}">
      <span class="cal__event-time">${CalendarLogic.formatTime(event.start)}</span>
      ${event.title}
    </div>`;
    }

    renderSpanBar(layout: SpanLayout): string {
        const { event, colStart, colEnd, lane, continuesBefore, continuesAfter } = layout;
        const colSpan = colEnd - colStart + 1;
        const cls = [
            'cal__span-bar',
            event.className ?? '',
            continuesBefore ? 'cal__span-bar--cont-before' : '',
            continuesAfter  ? 'cal__span-bar--cont-after'  : '',
        ].filter(Boolean).join(' ');

        return `<div class="${cls}"
        style="--span-col:${colStart};--span-len:${colSpan};--span-lane:${lane}"
        data-event-id="${event.id}"
        role="button" tabindex="0"
        aria-label="${event.title}"
        title="${event.title}">${event.title}</div>`;
    }

    renderMonthDay(
        date: Date,
        currentMonth: number,
        currentYear: number,
        events: CalendarEvent[],
        selectedDate: Date | null,
        showOutsideDays: boolean,
    ): string {
        const isOutside = !CalendarLogic.isCurrentMonth(date, currentYear, currentMonth);

        if (isOutside && !showOutsideDays) {
            return `<div class="cal__day cal__day--empty" aria-hidden="true"></div>`;
        }

        const allForDay  = CalendarLogic.getEventsForDay(events, date);
        // Pills show only single-day events; multi-day are rendered as span bars in the week row
        const pillEvents = allForDay.filter(e => !CalendarLogic.isMultiDay(e));

        const isToday    = CalendarLogic.isToday(date);
        const isSelected = selectedDate ? CalendarLogic.isSameDay(date, selectedDate) : false;

        const classes = [
            'cal__day',
            isToday    ? 'is-today'        : '',
            isSelected ? 'is-selected'     : '',
            isOutside  ? 'cal__day--outside' : '',
            allForDay.length > 0 ? 'has-events' : '',
        ].filter(Boolean).join(' ');

        const eventsHtml = pillEvents.slice(0, 3).map(e => this.renderEvent(e, true)).join('');
        const moreCount  = pillEvents.length - 3;
        const moreHtml   = moreCount > 0 ? `<div class="cal__event-more">+${moreCount}</div>` : '';

        return `<div class="${classes}"
        role="gridcell" tabindex="0"
        aria-label="${date.toLocaleDateString()}"
        aria-selected="${isSelected}"
        data-date="${date.toISOString()}">
      <span class="cal__day-num">${date.getDate()}</span>
      <div class="cal__day-events">${eventsHtml}${moreHtml}</div>
    </div>`;
    }

    renderWeekRow(
        weekDays: Date[],
        currentMonth: number,
        currentYear: number,
        events: CalendarEvent[],
        selectedDate: Date | null,
        showOutsideDays: boolean,
    ): string {
        const multiDay = events.filter(e => CalendarLogic.isMultiDay(e));
        const spans    = CalendarLogic.computeSpanLayout(weekDays, multiDay);
        const maxLanes = spans.length > 0 ? Math.max(...spans.map(s => s.lane)) + 1 : 0;

        const dayCells = weekDays
            .map(d => this.renderMonthDay(d, currentMonth, currentYear, events, selectedDate, showOutsideDays))
            .join('');
        const spanBars = spans.map(s => this.renderSpanBar(s)).join('');

        return `<div class="cal__week-row" style="--span-lanes:${maxLanes}">
      ${dayCells}${spanBars}
    </div>`;
    }

    renderMonthView(
        year: number,
        month: number,
        events: CalendarEvent[],
        selectedDate: Date | null,
        showOutsideDays: boolean,
        firstDayOfWeek: number,
    ): string {
        const days = CalendarLogic.getMonthGrid(year, month, firstDayOfWeek);
        const weekRows: string[] = [];
        for (let i = 0; i < days.length; i += 7) {
            weekRows.push(this.renderWeekRow(
                days.slice(i, i + 7),
                month, year, events, selectedDate, showOutsideDays,
            ));
        }

        return `<div class="cal__month-grid" role="grid" aria-label="${this.locale.monthNames[month]} ${year}">
      <div class="cal__month-head">${this.renderWeekdayHeaders()}</div>
      ${weekRows.join('')}
    </div>`;
    }

    renderWeekView(
        date: Date,
        events: CalendarEvent[],
        selectedDate: Date | null,
        firstDayOfWeek: number,
    ): string {
        const days = CalendarLogic.getWeekDays(date, firstDayOfWeek);

        const headCols = days.map(d => {
            const isToday    = CalendarLogic.isToday(d);
            const isSelected = selectedDate ? CalendarLogic.isSameDay(d, selectedDate) : false;
            const cls = ['cal__week-head-day', isToday ? 'is-today' : '', isSelected ? 'is-selected' : '']
                .filter(Boolean).join(' ');
            const dow = this.locale.dayNamesShort[(d.getDay() + 7) % 7];
            return `<div class="${cls}" data-date="${d.toISOString()}">${dow}<span>${d.getDate()}</span></div>`;
        }).join('');

        // All-day row: span layout for all allDay events (both single-day and multi-day)
        const allDayEvents  = events.filter(e => e.allDay);
        const allDayLayouts = CalendarLogic.computeSpanLayout(days, allDayEvents);
        const allDayLanes   = allDayLayouts.length > 0 ? Math.max(...allDayLayouts.map(l => l.lane)) + 1 : 0;

        const allDayCols = days.map(() => `<div class="cal__allday-col"></div>`).join('');
        const allDayBars = allDayLayouts.map(l => this.renderSpanBar(l)).join('');

        const hourLabels = Array.from({ length: 24 }, (_, h) => {
            const label = h === 0 ? '' : `${String(h).padStart(2, '0')}:00`;
            return `<div class="cal__time-slot">${label}</div>`;
        }).join('');

        const dayCols = days.map(d => {
            const timedEvents  = CalendarLogic.getTimedEvents(events, d);
            const hourCells    = Array.from({ length: 24 }, () => `<div class="cal__day-col-hour"></div>`).join('');
            const eventOverlays = timedEvents.map(e => {
                const { top, height } = CalendarLogic.getEventPosition(e, d);
                const cls = e.className ?? '';
                return `<div class="cal__week-event ${cls}"
              style="top:${top.toFixed(2)}%;height:${height.toFixed(2)}%"
              data-event-id="${e.id}" role="button" tabindex="0" aria-label="${e.title}">
              <span class="cal__event-time">${CalendarLogic.formatTime(e.start)}</span>
              ${e.title}
            </div>`;
            }).join('');
            return `<div class="cal__day-col" data-date="${d.toISOString()}">${hourCells}${eventOverlays}</div>`;
        }).join('');

        return `<div class="cal__week" role="grid">
      <div class="cal__week-head">
        <div class="cal__week-head-time"></div>
        ${headCols}
      </div>
      <div class="cal__allday">
        <div class="cal__allday-label">${this.locale.allDay}</div>
        <div class="cal__allday-spans" style="--allday-lanes:${allDayLanes}">
          ${allDayCols}${allDayBars}
        </div>
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
        const daysInMonth  = new Date(year, month + 1, 0).getDate();
        const shownMultiDay = new Set<string>();
        let html = '';

        for (let d = 1; d <= daysInMonth; d++) {
            const day       = new Date(year, month, d);
            const dayEvents = CalendarLogic.getEventsForDay(events, day);

            // Multi-day events show only once (first occurrence in this month)
            const filtered = dayEvents.filter(e => {
                if (!CalendarLogic.isMultiDay(e)) return true;
                if (shownMultiDay.has(e.id)) return false;
                shownMultiDay.add(e.id);
                return true;
            });

            if (!filtered.length) continue;

            const isToday = CalendarLogic.isToday(day);
            const dow     = this.locale.dayNamesFull[day.getDay()];

            html += `<div class="cal__agenda-day ${isToday ? 'is-today' : ''}">
        <div class="cal__agenda-date">
          <span class="cal__agenda-dow">${dow}</span>
          <span class="cal__agenda-num ${isToday ? 'is-today' : ''}">${d}</span>
        </div>
        <div class="cal__agenda-events">
          ${filtered.map(e => {
              const isMulti = CalendarLogic.isMultiDay(e);
              let timeLabel: string;
              if (isMulti) {
                  timeLabel = `${e.start.toLocaleDateString()} – ${e.end.toLocaleDateString()}`;
              } else if (e.allDay) {
                  timeLabel = this.locale.allDay;
              } else {
                  timeLabel = `${CalendarLogic.formatTime(e.start)} – ${CalendarLogic.formatTime(e.end)}`;
              }
              return `<div class="cal__agenda-event ${e.className ?? ''}"
              data-event-id="${e.id}" role="button" tabindex="0">
              <span class="cal__agenda-event-time">${timeLabel}</span>
              <span class="cal__agenda-event-title">${e.title}</span>
            </div>`;
          }).join('')}
        </div>
      </div>`;
        }

        if (!html) html = `<div class="cal__agenda-empty">${this.locale.noEvents}</div>`;
        return `<div class="cal__agenda">${html}</div>`;
    }
}

// -----------------------------------------------------------
// Calendar — main controller
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
        if (typeof options.container === 'string') {
            const el = document.querySelector<HTMLElement>(options.container);
            if (!el) throw new Error(`Calendar: container "${options.container}" not found.`);
            this.container = el;
        } else {
            this.container = options.container;
        }

        this.locale   = { ...DEFAULT_LOCALE, ...(options.locale ?? {}) };
        this.renderer = new CalendarRenderer(this.locale);

        this.options = {
            container:       this.container,
            events:          options.events          ?? [],
            view:            options.view            ?? 'month',
            locale:          options.locale          ?? {},
            showOutsideDays: options.showOutsideDays ?? true,
            onDayClick:      options.onDayClick      ?? (() => {}),
            onEventClick:    options.onEventClick    ?? (() => {}),
            onChange:        options.onChange        ?? (() => {}),
            className:       options.className       ?? '',
            iconBasePath:    options.iconBasePath    ?? 'svg-icons/',
        };

        this.events      = [...this.options.events];
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
            this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
        } else {
            this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate() + 7);
        }
        this.render();
        this.options.onChange(this.currentDate, this.currentView);
    }

    prev(): void {
        if (this.currentView === 'month' || this.currentView === 'agenda') {
            this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
        } else {
            this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate() - 7);
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
        this.events = this.events.filter(e => e.id !== id);
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
        this.container.removeEventListener('click',   this.boundHandleClick);
        this.container.removeEventListener('keydown', this.boundHandleKeydown);
        this.container.innerHTML = '';
        this.container.removeAttribute('data-cal');
    }

    // ----------------------------------------------------------
    // Rendering
    // ----------------------------------------------------------

    private getTitle(): string {
        const { monthNames } = this.locale;
        const y = this.currentDate.getFullYear();
        const m = this.currentDate.getMonth();

        if (this.currentView === 'week') {
            const days  = CalendarLogic.getWeekDays(this.currentDate, this.locale.firstDayOfWeek);
            const first = days[0];
            const last  = days[6];
            return first.getMonth() === last.getMonth()
                ? `${monthNames[first.getMonth()]} ${y}`
                : `${monthNames[first.getMonth()]} – ${monthNames[last.getMonth()]} ${y}`;
        }
        return `${monthNames[m]} ${y}`;
    }

    private buildHeader(): string {
        const v = this.currentView;
        return `<div class="cal__header">
      <div class="cal__nav">
        <button class="cal__btn cal__btn--today" data-action="today" aria-label="${this.locale.today}">${this.locale.today}</button>
        <button class="cal__btn" data-action="prev" aria-label="Zurück">
          <svg class="icon-svg" aria-hidden="true"><use href="${this.options.iconBasePath}icons.svg#chevron_left"/></svg>
        </button>
        <button class="cal__btn" data-action="next" aria-label="Vor">
          <svg class="icon-svg" aria-hidden="true"><use href="${this.options.iconBasePath}icons.svg#chevron_right"/></svg>
        </button>
      </div>
      <h2 class="cal__title" aria-live="polite">${this.getTitle()}</h2>
      <div class="cal__view-toggle" role="group" aria-label="Ansicht wählen">
        <button class="cal__btn ${v === 'month'  ? 'cal__btn--active' : ''}" data-action="view-month"  aria-pressed="${v === 'month'}">${this.locale.month}</button>
        <button class="cal__btn ${v === 'week'   ? 'cal__btn--active' : ''}" data-action="view-week"   aria-pressed="${v === 'week'}">${this.locale.week}</button>
        <button class="cal__btn ${v === 'agenda' ? 'cal__btn--active' : ''}" data-action="view-agenda" aria-pressed="${v === 'agenda'}">${this.locale.agenda}</button>
      </div>
    </div>`;
    }

    private buildBody(): string {
        const { firstDayOfWeek } = this.locale;
        const y = this.currentDate.getFullYear();
        const m = this.currentDate.getMonth();

        switch (this.currentView) {
            case 'month':
                return this.renderer.renderMonthView(y, m, this.events, this.selectedDate, this.options.showOutsideDays, firstDayOfWeek);
            case 'week':
                return this.renderer.renderWeekView(this.currentDate, this.events, this.selectedDate, firstDayOfWeek);
            case 'agenda':
                return this.renderer.renderAgendaView(y, m, this.events);
        }
    }

    private render(): void {
        const rootClass = ['cal', this.options.className].filter(Boolean).join(' ');
        this.container.setAttribute('data-cal', this.currentView);
        this.container.innerHTML = `<div class="${rootClass}" role="application" aria-label="Kalender">
      ${this.buildHeader()}
      <div class="cal__body">${this.buildBody()}</div>
    </div>`;
    }

    // ----------------------------------------------------------
    // Event delegation
    // ----------------------------------------------------------

    private readonly boundHandleClick   = (e: MouseEvent)  => this.handleClick(e);
    private readonly boundHandleKeydown = (e: KeyboardEvent) => this.handleKeydown(e);

    private attachEvents(): void {
        this.container.addEventListener('click',   this.boundHandleClick);
        this.container.addEventListener('keydown', this.boundHandleKeydown);
    }

    private handleClick(e: MouseEvent): void {
        const target = e.target as HTMLElement;

        const btn = target.closest<HTMLElement>('[data-action]');
        if (btn) {
            const action = btn.dataset.action!;
            if      (action === 'prev')        this.prev();
            else if (action === 'next')        this.next();
            else if (action === 'today')       this.today();
            else if (action === 'view-month')  this.setView('month');
            else if (action === 'view-week')   this.setView('week');
            else if (action === 'view-agenda') this.setView('agenda');
            return;
        }

        const eventEl = target.closest<HTMLElement>('[data-event-id]');
        if (eventEl) {
            const id    = eventEl.dataset.eventId!;
            const event = this.events.find(ev => ev.id === id);
            if (event) { e.stopPropagation(); this.options.onEventClick(event); }
            return;
        }

        const dayEl = target.closest<HTMLElement>('[data-date]');
        if (dayEl?.dataset.date) {
            this.selectedDate = new Date(dayEl.dataset.date);
            this.options.onDayClick(this.selectedDate);
            this.render();
        }
    }

    private handleKeydown(e: KeyboardEvent): void {
        const target = e.target as HTMLElement;

        if (e.key === 'Enter' || e.key === ' ') {
            if (target.closest('[data-date], [data-event-id], [data-action]')) {
                e.preventDefault();
                target.click();
            }
        }

        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
        const dayEl = target.closest<HTMLElement>('.cal__day[data-date]');
        if (!dayEl) return;

        e.preventDefault();
        const all = Array.from(
            this.container.querySelectorAll<HTMLElement>('.cal__day[data-date]:not(.cal__day--empty)')
        );
        const idx  = all.indexOf(dayEl);
        let   next = idx;

        if      (e.key === 'ArrowRight') next = idx + 1;
        else if (e.key === 'ArrowLeft')  next = idx - 1;
        else if (e.key === 'ArrowDown')  next = idx + 7;
        else if (e.key === 'ArrowUp')    next = idx - 7;

        all[Math.max(0, Math.min(next, all.length - 1))]?.focus();
    }
}
