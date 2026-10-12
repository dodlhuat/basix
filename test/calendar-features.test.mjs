import { test } from 'node:test';
import assert from 'node:assert/strict';
import { root } from './helpers.mjs';
import { Calendar, CalendarLogic } from '../js/calendar.js';

const d = (day, h = 0, m = 0, month = 2, year = 2026) => new Date(year, month, day, h, m);
const ymd = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const mount = (view, options = {}, anchor = d(view === 'week' ? 11 : 15)) => {
    const el = root();
    const cal = new Calendar({ container: el, view, ...options });
    cal.currentDate = anchor;
    cal.render();
    return { el, cal };
};

const key = (el, name, init = {}) => el.dispatchEvent(new window.KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init }));
const cellFor = (el, date) => [...el.querySelectorAll('.cal__day[data-date]')].find((c) => ymd(new Date(c.dataset.date)) === ymd(date));
const focusedDay = () => ymd(new Date(document.activeElement.dataset.date));

// ── getVisibleRange / onChange ───────────────────────────────────────────

test('getVisibleRange: month with outside days covers the whole grid', () => {
    const { cal } = mount('month');
    const r = cal.getVisibleRange();
    assert.equal(ymd(r.from), '2026-02-23');
    assert.equal(ymd(r.to), '2026-04-05');
    assert.equal(r.from.getHours(), 0);
    assert.equal(r.to.getHours(), 23);
    assert.equal(r.to.getMilliseconds(), 999);
    cal.destroy();
});

test('getVisibleRange: month without outside days covers only the month', () => {
    const { cal } = mount('month', { showOutsideDays: false });
    const r = cal.getVisibleRange();
    assert.equal(ymd(r.from), '2026-03-01');
    assert.equal(ymd(r.to), '2026-03-31');
    cal.destroy();
});

test('getVisibleRange: week and agenda', () => {
    const w = mount('week');
    assert.deepEqual([ymd(w.cal.getVisibleRange().from), ymd(w.cal.getVisibleRange().to)], ['2026-03-09', '2026-03-15']);
    w.cal.destroy();
    const a = mount('agenda');
    assert.deepEqual([ymd(a.cal.getVisibleRange().from), ymd(a.cal.getVisibleRange().to)], ['2026-03-01', '2026-03-31']);
    a.cal.destroy();
});

test('getVisibleRange: respects firstDayOfWeek', () => {
    const { cal } = mount('week', { locale: { firstDayOfWeek: 0 } });
    assert.equal(ymd(cal.getVisibleRange().from), '2026-03-08');
    cal.destroy();
});

test('onChange receives the visible range as third argument (existing two arguments unchanged)', () => {
    const calls = [];
    const { cal } = mount('month', { onChange: (...args) => calls.push(args) });
    cal.next();
    assert.equal(calls.length, 1);
    const [date, view, range] = calls[0];
    assert.equal(ymd(date), '2026-04-01');
    assert.equal(view, 'month');
    assert.equal(ymd(range.from), '2026-03-30');
    assert.equal(ymd(range.to), '2026-05-03');
    cal.destroy();
});

// ── Locale labels & formatting ───────────────────────────────────────────

test('default accessible names are unchanged', () => {
    const { el, cal } = mount('month');
    assert.equal(el.querySelector('[data-action="prev"]').getAttribute('aria-label'), 'Zurück');
    assert.equal(el.querySelector('[data-action="next"]').getAttribute('aria-label'), 'Vor');
    assert.equal(el.querySelector('.cal__view-toggle').getAttribute('aria-label'), 'Ansicht wählen');
    assert.equal(el.querySelector('[role="application"]').getAttribute('aria-label'), 'Kalender');
    cal.destroy();
});

test('accessible names can be localised and are escaped', () => {
    const { el, cal } = mount('month', { locale: { previous: 'Previous', next: 'Next', viewSwitch: 'Choose view', calendar: '"><img src=x onerror=1>' } });
    assert.equal(el.querySelector('[data-action="prev"]').getAttribute('aria-label'), 'Previous');
    assert.equal(el.querySelector('[data-action="next"]').getAttribute('aria-label'), 'Next');
    assert.equal(el.querySelector('.cal__view-toggle').getAttribute('aria-label'), 'Choose view');
    assert.equal(el.querySelector('img'), null);
    assert.equal(el.querySelector('[role="application"]').getAttribute('aria-label'), '"><img src=x onerror=1>');
    cal.destroy();
});

test('hour12 switches between 12-hour and 24-hour times', () => {
    const ev = [{ id: 'e', title: 'T', start: d(10, 14, 5), end: d(10, 15, 30) }];
    const h24 = mount('agenda', { events: ev, hour12: false, dateLocale: 'en-US' });
    const label24 = h24.el.querySelector('.cal__agenda-event-time').textContent;
    assert.match(label24, /14:05/);
    assert.doesNotMatch(label24, /PM|AM/);
    h24.cal.destroy();
    const h12 = mount('agenda', { events: ev, hour12: true, dateLocale: 'en-US' });
    assert.match(h12.el.querySelector('.cal__agenda-event-time').textContent, /02:05\s?PM/);
    h12.cal.destroy();
});

test('dateLocale controls the date part of multi-day labels', () => {
    const ev = [{ id: 'e', title: 'T', start: d(10, 22), end: d(11, 2) }];
    const de = mount('agenda', { events: ev, dateLocale: 'de-AT', hour12: false });
    assert.match(de.el.querySelector('.cal__agenda-event-time').textContent, /10\.3\.2026 22:00 – 11\.3\.2026 02:00/);
    de.cal.destroy();
});

test('CalendarLogic.formatTime stays callable with a single argument', () => {
    assert.equal(typeof CalendarLogic.formatTime(d(10, 9, 5)), 'string');
});

// ── Keyboard navigation & roles ──────────────────────────────────────────

test('month grid exposes row / columnheader / gridcell roles and marks today', () => {
    const today = new Date();
    const { el, cal } = mount('month', {}, new Date(today.getFullYear(), today.getMonth(), 15));
    assert.equal(el.querySelector('.cal__month-grid').getAttribute('role'), 'grid');
    assert.ok(el.querySelector('.cal__month-head[role="row"]'));
    assert.equal(el.querySelectorAll('.cal__weekday[role="columnheader"]').length, 7);
    assert.ok(el.querySelectorAll('.cal__week-row[role="row"]').length >= 4);
    assert.equal(el.querySelectorAll('.cal__day[role="gridcell"]').length, el.querySelectorAll('.cal__day').length);
    assert.equal(el.querySelectorAll('[aria-current="date"]').length, 1);
    cal.destroy();
});

test('month grid is a single tab stop', () => {
    const { el, cal } = mount('month');
    const stops = [...el.querySelectorAll('.cal__day[data-date]')].filter((c) => c.getAttribute('tabindex') === '0');
    assert.equal(stops.length, 1);
    assert.equal(ymd(new Date(stops[0].dataset.date)), '2026-03-01');
    cal.destroy();
});

test('arrow keys move focus between days', () => {
    const { el, cal } = mount('month');
    const start = cellFor(el, d(10));
    start.focus();
    key(start, 'ArrowRight');
    assert.equal(focusedDay(), '2026-03-11');
    key(document.activeElement, 'ArrowDown');
    assert.equal(focusedDay(), '2026-03-18');
    key(document.activeElement, 'ArrowLeft');
    assert.equal(focusedDay(), '2026-03-17');
    key(document.activeElement, 'ArrowUp');
    assert.equal(focusedDay(), '2026-03-10');
    assert.equal(el.querySelectorAll('.cal__day[tabindex="0"]').length, 1);
    cal.destroy();
});

test('Home / End jump to the start / end of the week', () => {
    const { el, cal } = mount('month');
    const cell = cellFor(el, d(11));
    cell.focus();
    key(cell, 'End');
    assert.equal(focusedDay(), '2026-03-15');
    key(document.activeElement, 'Home');
    assert.equal(focusedDay(), '2026-03-09');
    cal.destroy();
});

test('arrow keys across the month edge switch the month and keep focus', () => {
    const changes = [];
    const { el, cal } = mount('month', { onChange: (date, view) => changes.push([ymd(date), view]) });
    const last = cellFor(el, d(31));
    last.focus();
    key(last, 'ArrowRight');
    assert.deepEqual(changes, [['2026-04-01', 'month']]);
    assert.equal(focusedDay(), '2026-04-01');
    assert.equal(el.querySelectorAll('.cal__day[tabindex="0"]').length, 1);
    cal.destroy();
});

test('PageUp / PageDown change the month and clamp the day', () => {
    const { el, cal } = mount('month');
    const cell = cellFor(el, d(31));
    cell.focus();
    key(cell, 'PageDown');
    assert.equal(focusedDay(), '2026-04-30');
    key(document.activeElement, 'PageUp');
    assert.equal(focusedDay(), '2026-03-30');
    cal.destroy();
});

test('Enter and Space on a day trigger onDayClick', () => {
    const clicked = [];
    const { el, cal } = mount('month', { onDayClick: (date) => clicked.push(ymd(date)) });
    const cell = cellFor(el, d(10));
    cell.focus();
    key(cell, 'Enter');
    key(cell, ' ');
    assert.deepEqual(clicked, ['2026-03-10', '2026-03-10']);
    cal.destroy();
});

test('keys on an event pill still activate the event, not the day', () => {
    const clicks = [];
    const { el, cal } = mount('month', {
        events: [{ id: 'e', title: 'T', start: d(10, 10), end: d(10, 11) }],
        onEventClick: (e) => clicks.push(e.id),
        onDayClick: () => clicks.push('day'),
    });
    const pill = el.querySelector('[data-event-id="e"]');
    key(pill, 'Enter');
    assert.deepEqual(clicks, ['e']);
    cal.destroy();
});

// ── Robustness ───────────────────────────────────────────────────────────

test('events with invalid dates do not throw and are not rendered', () => {
    const bad = [
        { id: 'a', title: 'A', start: new Date('nope'), end: new Date('nope') },
        { id: 'b', title: 'B', start: d(10, 10), end: new Date('nope') },
        { id: 'c', title: 'C', start: new Date('nope'), end: d(10, 11) },
    ];
    for (const view of ['month', 'week', 'agenda']) {
        const { el, cal } = mount(view, { events: bad });
        assert.equal(el.querySelectorAll('[data-event-id]').length, 0, `${view}: invalid events must not render`);
        assert.doesNotMatch(el.textContent, /Invalid Date|NaN/, view);
        cal.destroy();
    }
});

// ── Daylight saving (only meaningful when run with TZ=Europe/Vienna) ─────

const vienna = Intl.DateTimeFormat().resolvedOptions().timeZone === 'Europe/Vienna';
const timedBlocks = (el, id) =>
    new Map(
        [...el.querySelectorAll('.cal__day-col')]
            .map((col) => [col, col.querySelector(`.cal__week-event[data-event-id="${id}"]`)])
            .filter(([, n]) => n)
            .map(([col, n]) => {
                const st = n.getAttribute('style');
                return [
                    ymd(new Date(col.dataset.date)),
                    { top: parseFloat(/top:\s*([\d.]+)%/.exec(st)[1]), height: parseFloat(/height:\s*([\d.]+)%/.exec(st)[1]) },
                ];
            }),
    );

test('DST spring-forward day: blocks line up with the hour rows', { skip: !vienna && 'needs TZ=Europe/Vienna' }, () => {
    // 2026-03-29: clocks jump 02:00 -> 03:00, the day has 23 hours.
    const { el, cal } = mount('week', { events: [{ id: 'e', title: 'T', start: d(29, 4), end: d(29, 6) }] }, d(29));
    const b = timedBlocks(el, 'e').get('2026-03-29');
    assert.ok(Math.abs(b.top - (4 / 24) * 100) < 0.01, `top ${b.top}`);
    assert.ok(Math.abs(b.height - (2 / 24) * 100) < 0.01, `height ${b.height}`);
    cal.destroy();
});

test('DST fall-back night: an event across midnight ends on the right row', { skip: !vienna && 'needs TZ=Europe/Vienna' }, () => {
    // 2026-10-25: clocks go back 03:00 -> 02:00, the day has 25 hours.
    const { el, cal } = mount('week', { events: [{ id: 'e', title: 'T', start: d(24, 22, 0, 9), end: d(25, 4, 0, 9) }] }, d(25, 0, 0, 9));
    const blocks = timedBlocks(el, 'e');
    const second = blocks.get('2026-10-25');
    assert.ok(second.top < 0.01);
    assert.ok(Math.abs(second.height - (4 / 24) * 100) < 0.01, `height ${second.height}`);
    cal.destroy();
});
