import { ListenerGroup } from './listeners.js';
import { escapeAttr, escapeHtml } from './utils.js';
const CalendarLogic = {
    getMonthGrid(year, month, firstDayOfWeek) {
        const firstOfMonth = new Date(year, month, 1);
        const lastOfMonth = new Date(year, month + 1, 0);
        let startDow = firstOfMonth.getDay() - firstDayOfWeek;
        if (startDow < 0)
            startDow += 7;
        const days = [];
        for (let i = startDow; i > 0; i--)
            days.push(new Date(year, month, 1 - i));
        for (let d = 1; d <= lastOfMonth.getDate(); d++)
            days.push(new Date(year, month, d));
        const remaining = 7 - (days.length % 7);
        if (remaining < 7) {
            for (let i = 1; i <= remaining; i++)
                days.push(new Date(year, month + 1, i));
        }
        return days;
    },
    getWeekDays(date, firstDayOfWeek) {
        const d = new Date(date);
        let diff = d.getDay() - firstDayOfWeek;
        if (diff < 0)
            diff += 7;
        d.setDate(d.getDate() - diff);
        return Array.from({ length: 7 }, (_, i) => {
            const day = new Date(d);
            day.setDate(d.getDate() + i);
            return day;
        });
    },
    isSameDay(a, b) {
        return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    },
    isToday(date) {
        return CalendarLogic.isSameDay(date, new Date());
    },
    isCurrentMonth(date, year, month) {
        return date.getFullYear() === year && date.getMonth() === month;
    },
    startOfDay(d) {
        const r = new Date(d);
        r.setHours(0, 0, 0, 0);
        return r;
    },
    endOf(event) {
        return event.end < event.start ? event.start : event.end;
    },
    isMultiDay(event) {
        return !CalendarLogic.isSameDay(event.start, CalendarLogic.endOf(event));
    },
    getEventsForDay(events, day) {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);
        return events.filter((e) => e.start <= dayEnd && CalendarLogic.endOf(e) >= dayStart);
    },
    getAllDayEvents(events, day) {
        return CalendarLogic.getEventsForDay(events, day).filter((e) => e.allDay);
    },
    getTimedEvents(events, day) {
        return CalendarLogic.getEventsForDay(events, day).filter((e) => !e.allDay);
    },
    getEventPosition(event, day) {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(24, 0, 0, 0);
        const wallMinutes = (d) => d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
        const end = CalendarLogic.endOf(event);
        const startMin = event.start <= dayStart ? 0 : wallMinutes(event.start);
        const endMin = end >= dayEnd ? 1440 : wallMinutes(end);
        return {
            top: (startMin / 1440) * 100,
            height: Math.max(((endMin - startMin) / 1440) * 100, 2),
        };
    },
    formatTime(date, format = {}) {
        return date.toLocaleTimeString(format.dateLocale ?? [], {
            hour: '2-digit',
            minute: '2-digit',
            ...(format.hour12 === undefined ? {} : { hour12: format.hour12 }),
        });
    },
    computeSpanLayout(weekDays, events) {
        if (!events.length)
            return [];
        const weekStart = CalendarLogic.startOfDay(weekDays[0]);
        const weekEnd = CalendarLogic.startOfDay(weekDays[6]);
        const relevant = events.filter((e) => {
            const s = CalendarLogic.startOfDay(e.start);
            const en = CalendarLogic.startOfDay(CalendarLogic.endOf(e));
            return s <= weekEnd && en >= weekStart;
        });
        relevant.sort((a, b) => {
            const diff = a.start.getTime() - b.start.getTime();
            if (diff !== 0)
                return diff;
            return CalendarLogic.endOf(b).getTime() - b.start.getTime() - (CalendarLogic.endOf(a).getTime() - a.start.getTime());
        });
        const laneEnds = [];
        const layouts = [];
        for (const event of relevant) {
            const eStart = CalendarLogic.startOfDay(event.start);
            const eEnd = CalendarLogic.startOfDay(CalendarLogic.endOf(event));
            const continuesBefore = eStart < weekStart;
            const continuesAfter = eEnd > weekEnd;
            let colStart = 0;
            if (!continuesBefore) {
                for (let i = 0; i < 7; i++) {
                    if (CalendarLogic.isSameDay(weekDays[i], eStart)) {
                        colStart = i;
                        break;
                    }
                }
            }
            let colEnd = 6;
            if (!continuesAfter) {
                for (let i = 6; i >= 0; i--) {
                    if (CalendarLogic.isSameDay(weekDays[i], eEnd)) {
                        colEnd = i;
                        break;
                    }
                }
            }
            let lane = 0;
            while (lane < laneEnds.length && laneEnds[lane] >= colStart)
                lane++;
            if (lane >= laneEnds.length)
                laneEnds.push(colEnd);
            else
                laneEnds[lane] = colEnd;
            layouts.push({ event, colStart, colEnd, lane, continuesBefore, continuesAfter });
        }
        return layouts;
    },
    computeTimedLayout(events, day) {
        if (!events.length)
            return [];
        const sorted = [...events].sort((a, b) => {
            const diff = a.start.getTime() - b.start.getTime();
            if (diff !== 0)
                return diff;
            return CalendarLogic.endOf(b).getTime() - b.start.getTime() - (CalendarLogic.endOf(a).getTime() - a.start.getTime());
        });
        const colEnds = [];
        const assigns = [];
        for (const event of sorted) {
            let col = 0;
            while (col < colEnds.length && colEnds[col] > event.start)
                col++;
            if (col >= colEnds.length)
                colEnds.push(CalendarLogic.endOf(event));
            else
                colEnds[col] = CalendarLogic.endOf(event);
            assigns.push({ event, col });
        }
        return assigns.map(({ event, col }) => {
            const cols = assigns
                .filter((a) => a.event.start < CalendarLogic.endOf(event) && CalendarLogic.endOf(a.event) > event.start)
                .reduce((max, a) => Math.max(max, a.col), 0) + 1;
            const pos = CalendarLogic.getEventPosition(event, day);
            return { event, top: pos.top, height: pos.height, col, cols };
        });
    },
    nowLinePct() {
        const now = new Date();
        return ((now.getHours() * 60 + now.getMinutes()) / 1440) * 100;
    },
};
const DEFAULT_LOCALE = {
    monthNames: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    dayNamesShort: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
    dayNamesFull: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
    firstDayOfWeek: 1,
    today: 'Heute',
    month: 'Monat',
    week: 'Woche',
    agenda: 'Agenda',
    allDay: 'Ganztägig',
    noEvents: 'Keine Termine',
    previous: 'Zurück',
    next: 'Vor',
    viewSwitch: 'Ansicht wählen',
    calendar: 'Kalender',
};
class CalendarRenderer {
    locale;
    format;
    constructor(locale, format = {}) {
        this.locale = locale;
        this.format = format;
    }
    time(date) {
        return CalendarLogic.formatTime(date, this.format);
    }
    date(date) {
        return date.toLocaleDateString(this.format.dateLocale);
    }
    renderWeekdayHeaders() {
        const { dayNamesShort, firstDayOfWeek } = this.locale;
        const ordered = [...dayNamesShort.slice(firstDayOfWeek), ...dayNamesShort.slice(0, firstDayOfWeek)];
        return ordered.map((name) => `<div class="cal__weekday" role="columnheader" aria-label="${escapeAttr(name)}">${escapeHtml(name)}</div>`).join('');
    }
    renderBadge(event) {
        if (!event.badge)
            return '';
        return ` <span class="cal__event-badge ${escapeAttr(event.badgeClassName ?? '')}">${escapeHtml(event.badge)}</span>`;
    }
    ariaLabel(event, suffix = '') {
        return escapeAttr([event.title, event.badge].filter(Boolean).join(', ') + suffix);
    }
    renderEvent(event, compact = false) {
        const cls = escapeAttr(event.className ?? '');
        const id = escapeAttr(event.id);
        const titleAttr = escapeAttr(event.title);
        const title = escapeHtml(event.title) + this.renderBadge(event);
        if (compact) {
            return `<div class="cal__event-pill ${cls}" data-event-id="${id}" role="button" tabindex="0" aria-label="${this.ariaLabel(event)}" title="${this.ariaLabel(event)}">${title}</div>`;
        }
        return `<div class="cal__event-pill ${cls}" data-event-id="${id}" role="button" tabindex="0" aria-label="${this.ariaLabel(event, `, ${this.time(event.start)} – ${this.time(CalendarLogic.endOf(event))}`)}" title="${titleAttr}">
      <span class="cal__event-time">${this.time(event.start)}</span>
      ${title}
    </div>`;
    }
    renderSpanBar(layout) {
        const { event, colStart, colEnd, lane, continuesBefore, continuesAfter } = layout;
        const colSpan = colEnd - colStart + 1;
        const cls = [
            'cal__span-bar',
            escapeAttr(event.className ?? ''),
            continuesBefore ? 'cal__span-bar--cont-before' : '',
            continuesAfter ? 'cal__span-bar--cont-after' : '',
        ]
            .filter(Boolean)
            .join(' ');
        return `<div class="${cls}"
        style="--span-col:${colStart};--span-len:${colSpan};--span-lane:${lane}"
        data-event-id="${escapeAttr(event.id)}"
        role="button" tabindex="0"
        aria-label="${this.ariaLabel(event)}"
        title="${this.ariaLabel(event)}">${escapeHtml(event.title)}${this.renderBadge(event)}</div>`;
    }
    renderMonthDay(date, currentMonth, currentYear, events, showOutsideDays) {
        const isOutside = !CalendarLogic.isCurrentMonth(date, currentYear, currentMonth);
        if (isOutside && !showOutsideDays) {
            return `<div class="cal__day cal__day--empty" role="gridcell" aria-hidden="true"></div>`;
        }
        const allForDay = CalendarLogic.getEventsForDay(events, date);
        const pillEvents = allForDay.filter((e) => !CalendarLogic.isMultiDay(e));
        const isToday = CalendarLogic.isToday(date);
        const classes = ['cal__day', isToday ? 'is-today' : '', isOutside ? 'cal__day--outside' : '', allForDay.length > 0 ? 'has-events' : '']
            .filter(Boolean)
            .join(' ');
        const eventsHtml = pillEvents
            .slice(0, 3)
            .map((e) => this.renderEvent(e, true))
            .join('');
        const moreCount = pillEvents.length - 3;
        const moreHtml = moreCount > 0 ? `<div class="cal__event-more">+${moreCount}</div>` : '';
        return `<div class="${classes}" role="gridcell"${isToday ? ' aria-current="date"' : ''} data-date="${date.toISOString()}" aria-label="${this.date(date)}">
      <span class="cal__day-num">${date.getDate()}</span>
      <div class="cal__day-events">${eventsHtml}${moreHtml}</div>
    </div>`;
    }
    renderWeekRow(weekDays, currentMonth, currentYear, events, showOutsideDays) {
        const multiDay = events.filter((e) => CalendarLogic.isMultiDay(e));
        const spans = CalendarLogic.computeSpanLayout(weekDays, multiDay);
        const maxLanes = spans.length > 0 ? Math.max(...spans.map((s) => s.lane)) + 1 : 0;
        const dayCells = weekDays.map((d) => this.renderMonthDay(d, currentMonth, currentYear, events, showOutsideDays)).join('');
        const spanBars = spans.map((s) => this.renderSpanBar(s)).join('');
        return `<div class="cal__week-row" role="row" style="--span-lanes:${maxLanes}">
      ${dayCells}${spanBars}
    </div>`;
    }
    renderMonthView(year, month, events, showOutsideDays, firstDayOfWeek) {
        const days = CalendarLogic.getMonthGrid(year, month, firstDayOfWeek);
        const weekRows = [];
        for (let i = 0; i < days.length; i += 7) {
            weekRows.push(this.renderWeekRow(days.slice(i, i + 7), month, year, events, showOutsideDays));
        }
        return `<div class="cal__month-grid" role="grid" aria-label="${escapeAttr(this.locale.monthNames[month])} ${year}">
      <div class="cal__month-head" role="row">${this.renderWeekdayHeaders()}</div>
      ${weekRows.join('')}
    </div>`;
    }
    renderWeekView(date, events, firstDayOfWeek, showNowLine = false) {
        const days = CalendarLogic.getWeekDays(date, firstDayOfWeek);
        const headCols = days
            .map((d) => {
            const isToday = CalendarLogic.isToday(d);
            const cls = ['cal__week-head-day', isToday ? 'is-today' : ''].filter(Boolean).join(' ');
            const dow = this.locale.dayNamesShort[(d.getDay() + 7) % 7];
            return `<div class="${cls}">${escapeHtml(dow)}<span>${d.getDate()}</span></div>`;
        })
            .join('');
        const allDayEvents = events.filter((e) => e.allDay);
        const allDayLayouts = CalendarLogic.computeSpanLayout(days, allDayEvents);
        const allDayLanes = allDayLayouts.length > 0 ? Math.max(...allDayLayouts.map((l) => l.lane)) + 1 : 0;
        const allDayCols = days.map(() => `<div class="cal__allday-col"></div>`).join('');
        const allDayBars = allDayLayouts.map((l) => this.renderSpanBar(l)).join('');
        const hourLabels = Array.from({ length: 24 }, (_, h) => {
            const label = h === 0 ? '' : `${String(h).padStart(2, '0')}:00`;
            return `<div class="cal__time-slot">${label}</div>`;
        }).join('');
        const dayCols = days
            .map((d) => {
            const timedEvents = CalendarLogic.getTimedEvents(events, d);
            const hourCells = Array.from({ length: 24 }, () => `<div class="cal__day-col-hour"></div>`).join('');
            const layouts = CalendarLogic.computeTimedLayout(timedEvents, d);
            const eventOverlays = layouts
                .map(({ event, top, height, col, cols }) => {
                const cls = escapeAttr(event.className ?? '');
                let posStyle = `top:${top.toFixed(2)}%;height:${height.toFixed(2)}%`;
                if (cols > 1) {
                    const l = ((col / cols) * 100).toFixed(2);
                    const w = (100 / cols).toFixed(2);
                    posStyle += `;left:calc(${l}% + 2px);right:auto;width:calc(${w}% - 4px)`;
                }
                return `<div class="cal__week-event ${cls}"
              style="${posStyle}"
              data-event-id="${escapeAttr(event.id)}" role="button" tabindex="0" aria-label="${this.ariaLabel(event)}">
              <span class="cal__event-time">${this.time(event.start)}</span>
              ${escapeHtml(event.title)}${this.renderBadge(event)}
            </div>`;
            })
                .join('');
            return `<div class="cal__day-col" data-date="${d.toISOString()}">${hourCells}${eventOverlays}</div>`;
        })
            .join('');
        const nowLine = showNowLine ? `<div class="cal__now-line" style="top:${CalendarLogic.nowLinePct().toFixed(3)}%"></div>` : '';
        return `<div class="cal__week" role="grid">
      <div class="cal__week-head">
        <div class="cal__week-head-time"></div>
        ${headCols}
      </div>
      <div class="cal__allday">
        <div class="cal__allday-label">${escapeHtml(this.locale.allDay)}</div>
        <div class="cal__allday-spans" style="--allday-lanes:${allDayLanes}">
          ${allDayCols}${allDayBars}
        </div>
      </div>
      <div class="cal__week-body">
        <div class="cal__week-grid">
          <div class="cal__time-col">${hourLabels}</div>
          ${dayCols}
          ${nowLine}
        </div>
      </div>
    </div>`;
    }
    renderAgendaView(year, month, events) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const shownMultiDay = new Set();
        let html = '';
        for (let d = 1; d <= daysInMonth; d++) {
            const day = new Date(year, month, d);
            const dayEvents = CalendarLogic.getEventsForDay(events, day);
            const filtered = dayEvents.filter((e) => {
                if (!CalendarLogic.isMultiDay(e))
                    return true;
                if (shownMultiDay.has(e.id))
                    return false;
                shownMultiDay.add(e.id);
                return true;
            });
            if (!filtered.length)
                continue;
            const isToday = CalendarLogic.isToday(day);
            const dow = this.locale.dayNamesFull[day.getDay()];
            html += `<div class="cal__agenda-day ${isToday ? 'is-today' : ''}">
        <div class="cal__agenda-date">
          <span class="cal__agenda-dow">${escapeHtml(dow)}</span>
          <span class="cal__agenda-num ${isToday ? 'is-today' : ''}">${d}</span>
        </div>
        <div class="cal__agenda-events">
          ${filtered
                .map((e) => {
                const isMulti = CalendarLogic.isMultiDay(e);
                let timeLabel;
                const end = CalendarLogic.endOf(e);
                if (isMulti && e.allDay) {
                    timeLabel = `${this.date(e.start)} – ${this.date(end)}`;
                }
                else if (isMulti) {
                    timeLabel = `${this.date(e.start)} ${this.time(e.start)} – ${this.date(end)} ${this.time(end)}`;
                }
                else if (e.allDay) {
                    timeLabel = escapeHtml(this.locale.allDay);
                }
                else {
                    timeLabel = `${this.time(e.start)} – ${this.time(end)}`;
                }
                const timeClass = isMulti && !e.allDay ? 'cal__agenda-event-time cal__agenda-event-time--range' : 'cal__agenda-event-time';
                return `<div class="cal__agenda-event ${escapeAttr(e.className ?? '')}"
              data-event-id="${escapeAttr(e.id)}" role="button" tabindex="0">
              <span class="${timeClass}">${timeLabel}</span>
              <span class="cal__agenda-event-title">${escapeHtml(e.title)}</span>${this.renderBadge(e).trim()}
            </div>`;
            })
                .join('')}
        </div>
      </div>`;
        }
        if (!html)
            html = `<div class="cal__agenda-empty">${escapeHtml(this.locale.noEvents)}</div>`;
        return `<div class="cal__agenda">${html}</div>`;
    }
}
class Calendar {
    container;
    options;
    locale;
    renderer;
    format;
    currentDate;
    currentView;
    events = [];
    focusDate = null;
    nowLineTimer = null;
    listeners = new ListenerGroup();
    constructor(options) {
        if (typeof options.container === 'string') {
            const el = document.querySelector(options.container);
            if (!el)
                throw new Error(`Calendar: container "${options.container}" not found.`);
            this.container = el;
        }
        else {
            this.container = options.container;
        }
        this.locale = { ...DEFAULT_LOCALE, ...(options.locale ?? {}) };
        this.format = { dateLocale: options.dateLocale || undefined, hour12: options.hour12 };
        this.renderer = new CalendarRenderer(this.locale, this.format);
        this.options = {
            container: this.container,
            events: options.events ?? [],
            view: options.view ?? 'month',
            locale: options.locale ?? {},
            showOutsideDays: options.showOutsideDays ?? true,
            onDayClick: options.onDayClick ?? (() => { }),
            onEventClick: options.onEventClick ?? (() => { }),
            onChange: options.onChange ?? (() => { }),
            className: options.className ?? '',
            iconBasePath: options.iconBasePath ?? 'svg-icons/',
        };
        this.events = [...this.options.events];
        this.currentView = this.options.view;
        this.currentDate = new Date();
        this.render();
        this.attachEvents();
    }
    getVisibleRange() {
        const y = this.currentDate.getFullYear();
        const m = this.currentDate.getMonth();
        let first;
        let last;
        if (this.currentView === 'week') {
            const week = CalendarLogic.getWeekDays(this.currentDate, this.locale.firstDayOfWeek);
            first = week[0];
            last = week[6];
        }
        else if (this.currentView === 'month' && this.options.showOutsideDays) {
            const grid = CalendarLogic.getMonthGrid(y, m, this.locale.firstDayOfWeek);
            first = grid[0];
            last = grid[grid.length - 1];
        }
        else {
            first = new Date(y, m, 1);
            last = new Date(y, m + 1, 0);
        }
        return {
            from: CalendarLogic.startOfDay(first),
            to: new Date(last.getFullYear(), last.getMonth(), last.getDate(), 23, 59, 59, 999),
        };
    }
    setView(view) {
        this.currentView = view;
        this.render();
        this.emitChange();
    }
    next() {
        if (this.currentView === 'month' || this.currentView === 'agenda') {
            this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
        }
        else {
            this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate() + 7);
        }
        this.render();
        this.emitChange();
    }
    prev() {
        if (this.currentView === 'month' || this.currentView === 'agenda') {
            this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
        }
        else {
            this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate() - 7);
        }
        this.render();
        this.emitChange();
    }
    today() {
        this.currentDate = new Date();
        this.render();
        this.emitChange();
    }
    addEvent(event) {
        this.events.push(event);
        this.render();
    }
    removeEvent(id) {
        this.events = this.events.filter((e) => e.id !== id);
        this.render();
    }
    setEvents(events) {
        this.events = [...events];
        this.render();
    }
    getEvents() {
        return [...this.events];
    }
    destroy() {
        this.clearNowLineTimer();
        this.listeners.destroy();
        this.container.innerHTML = '';
        this.container.removeAttribute('data-cal');
    }
    emitChange() {
        this.options.onChange(this.currentDate, this.currentView, this.getVisibleRange());
    }
    getTitle(weekDays) {
        const { monthNames } = this.locale;
        const y = this.currentDate.getFullYear();
        const m = this.currentDate.getMonth();
        if (this.currentView === 'week' && weekDays) {
            const first = weekDays[0];
            const last = weekDays[6];
            return first.getMonth() === last.getMonth()
                ? `${monthNames[first.getMonth()]} ${y}`
                : `${monthNames[first.getMonth()]} – ${monthNames[last.getMonth()]} ${y}`;
        }
        return `${monthNames[m]} ${y}`;
    }
    buildHeader(weekDays) {
        const v = this.currentView;
        return `<div class="cal__header">
      <div class="cal__nav">
        <button class="cal__btn cal__btn--today" data-action="today" aria-label="${escapeAttr(this.locale.today)}">${escapeHtml(this.locale.today)}</button>
        <button class="cal__btn" data-action="prev" aria-label="${escapeAttr(this.locale.previous ?? DEFAULT_LOCALE.previous)}">
          <svg class="icon-svg" aria-hidden="true"><use href="${escapeAttr(this.options.iconBasePath)}icons.svg#chevron_left"/></svg>
        </button>
        <button class="cal__btn" data-action="next" aria-label="${escapeAttr(this.locale.next ?? DEFAULT_LOCALE.next)}">
          <svg class="icon-svg" aria-hidden="true"><use href="${escapeAttr(this.options.iconBasePath)}icons.svg#chevron_right"/></svg>
        </button>
      </div>
      <h2 class="cal__title" aria-live="polite">${escapeHtml(this.getTitle(weekDays))}</h2>
      <div class="cal__view-toggle" role="group" aria-label="${escapeAttr(this.locale.viewSwitch ?? DEFAULT_LOCALE.viewSwitch)}">
        <button class="cal__btn ${v === 'month' ? 'cal__btn--active' : ''}" data-action="view-month"  aria-pressed="${v === 'month'}">${escapeHtml(this.locale.month)}</button>
        <button class="cal__btn ${v === 'week' ? 'cal__btn--active' : ''}" data-action="view-week"   aria-pressed="${v === 'week'}">${escapeHtml(this.locale.week)}</button>
        <button class="cal__btn ${v === 'agenda' ? 'cal__btn--active' : ''}" data-action="view-agenda" aria-pressed="${v === 'agenda'}">${escapeHtml(this.locale.agenda)}</button>
      </div>
    </div>`;
    }
    buildBody(weekDays) {
        const { firstDayOfWeek } = this.locale;
        const y = this.currentDate.getFullYear();
        const m = this.currentDate.getMonth();
        switch (this.currentView) {
            case 'month':
                return this.renderer.renderMonthView(y, m, this.events, this.options.showOutsideDays, firstDayOfWeek);
            case 'week': {
                const showNowLine = weekDays?.some((d) => CalendarLogic.isToday(d)) ?? false;
                return this.renderer.renderWeekView(this.currentDate, this.events, firstDayOfWeek, showNowLine);
            }
            case 'agenda':
                return this.renderer.renderAgendaView(y, m, this.events);
        }
    }
    render() {
        this.clearNowLineTimer();
        const weekDays = this.currentView === 'week' ? CalendarLogic.getWeekDays(this.currentDate, this.locale.firstDayOfWeek) : null;
        const rootClass = ['cal', this.options.className].filter(Boolean).join(' ');
        this.container.setAttribute('data-cal', this.currentView);
        this.container.innerHTML = `<div class="${escapeAttr(rootClass)}" role="application" aria-label="${escapeAttr(this.locale.calendar ?? DEFAULT_LOCALE.calendar)}">
      ${this.buildHeader(weekDays)}
      <div class="cal__body">${this.buildBody(weekDays)}</div>
    </div>`;
        if (weekDays?.some((d) => CalendarLogic.isToday(d))) {
            this.scrollToNow();
            this.startNowLineTimer();
        }
        this.applyRovingTabindex();
    }
    dayCells() {
        return Array.from(this.container.querySelectorAll('.cal__day[data-date]'));
    }
    findDayCell(date) {
        return this.dayCells().find((cell) => CalendarLogic.isSameDay(new Date(cell.dataset.date), date));
    }
    applyRovingTabindex() {
        if (this.currentView !== 'month')
            return;
        const cells = this.dayCells();
        if (!cells.length)
            return;
        const target = (this.focusDate && this.findDayCell(this.focusDate)) ||
            cells.find((c) => c.classList.contains('is-today')) ||
            cells.find((c) => !c.classList.contains('cal__day--outside')) ||
            cells[0];
        cells.forEach((cell) => cell.setAttribute('tabindex', cell === target ? '0' : '-1'));
    }
    moveDayFocus(date) {
        this.focusDate = date;
        if (date.getFullYear() !== this.currentDate.getFullYear() || date.getMonth() !== this.currentDate.getMonth()) {
            this.currentDate = new Date(date.getFullYear(), date.getMonth(), 1);
            this.render();
            this.emitChange();
        }
        else {
            this.applyRovingTabindex();
        }
        this.findDayCell(date)?.focus();
    }
    handleDayKeydown(e, cell) {
        const from = new Date(cell.dataset.date);
        const y = from.getFullYear();
        const m = from.getMonth();
        const dd = from.getDate();
        let next = null;
        switch (e.key) {
            case 'ArrowLeft':
                next = new Date(y, m, dd - 1);
                break;
            case 'ArrowRight':
                next = new Date(y, m, dd + 1);
                break;
            case 'ArrowUp':
                next = new Date(y, m, dd - 7);
                break;
            case 'ArrowDown':
                next = new Date(y, m, dd + 7);
                break;
            case 'Home':
            case 'End': {
                const col = (from.getDay() - this.locale.firstDayOfWeek + 7) % 7;
                next = new Date(y, m, dd - col + (e.key === 'End' ? 6 : 0));
                break;
            }
            case 'PageUp':
            case 'PageDown': {
                const target = m + (e.key === 'PageDown' ? 1 : -1);
                const lastDay = new Date(y, target + 1, 0).getDate();
                next = new Date(y, target, Math.min(dd, lastDay));
                break;
            }
            case 'Enter':
            case ' ':
                e.preventDefault();
                cell.click();
                return true;
            default:
                return false;
        }
        e.preventDefault();
        this.moveDayFocus(next);
        return true;
    }
    scrollToNow() {
        const body = this.container.querySelector('.cal__week-body');
        if (!body)
            return;
        const pct = CalendarLogic.nowLinePct() / 100;
        body.scrollTop = Math.max(0, pct * body.scrollHeight - body.clientHeight / 2);
    }
    startNowLineTimer() {
        this.nowLineTimer = setInterval(() => {
            const line = this.container.querySelector('.cal__now-line');
            if (line)
                line.style.top = `${CalendarLogic.nowLinePct().toFixed(3)}%`;
        }, 60_000);
    }
    clearNowLineTimer() {
        if (this.nowLineTimer !== null) {
            clearInterval(this.nowLineTimer);
            this.nowLineTimer = null;
        }
    }
    attachEvents() {
        const sig = { signal: this.listeners.signal };
        this.container.addEventListener('click', (e) => this.handleClick(e), sig);
        this.container.addEventListener('keydown', (e) => this.handleKeydown(e), sig);
    }
    handleClick(e) {
        const target = e.target;
        const btn = target.closest('[data-action]');
        if (btn) {
            const action = btn.dataset.action;
            if (action === 'prev')
                this.prev();
            else if (action === 'next')
                this.next();
            else if (action === 'today')
                this.today();
            else if (action === 'view-month')
                this.setView('month');
            else if (action === 'view-week')
                this.setView('week');
            else if (action === 'view-agenda')
                this.setView('agenda');
            return;
        }
        const eventEl = target.closest('[data-event-id]');
        if (eventEl) {
            const id = eventEl.dataset.eventId;
            const event = this.events.find((ev) => ev.id === id);
            if (event) {
                e.stopPropagation();
                this.options.onEventClick(event);
            }
            return;
        }
        const dayEl = target.closest('.cal__day[data-date]');
        if (dayEl) {
            this.options.onDayClick(new Date(dayEl.dataset.date));
        }
    }
    handleKeydown(e) {
        const target = e.target;
        if (this.currentView === 'month' && target.classList.contains('cal__day') && target.dataset.date) {
            if (this.handleDayKeydown(e, target))
                return;
        }
        if (e.key === 'Enter' || e.key === ' ') {
            if (target.closest('[data-event-id], [data-action]')) {
                e.preventDefault();
                target.click();
            }
        }
    }
}
export { CalendarLogic, CalendarRenderer, Calendar };
