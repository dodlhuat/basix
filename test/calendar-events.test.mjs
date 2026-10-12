import { test } from 'node:test';
import assert from 'node:assert/strict';
import { root } from './helpers.mjs';
import { Calendar, CalendarLogic } from '../js/calendar.js';

// Fixed anchor: March 2026. Mar 1 is a Sunday, Mar 9 a Monday, so the week
// Mon 9 – Sun 15 is a full week inside the month and the month grid runs
// Mon Feb 23 – Sun Apr 5.
const d = (day, h = 0, m = 0, month = 2) => new Date(2026, month, day, h, m);
const FEB = 1;
const APR = 3;

const ymd = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const key = (day, month = 2) => ymd(d(day, 0, 0, month));
const keys = (...pairs) => new Set(pairs.map(([day, month]) => key(day, month ?? 2)));
const days = (from, to, month = 2) => new Set(Array.from({ length: to - from + 1 }, (_, i) => key(from + i, month)));

const mount = (view, events) => {
    const el = root();
    const cal = new Calendar({ container: el, view, events });
    cal.currentDate = d(view === 'week' ? 11 : 15);
    cal.render();
    return { el, cal };
};

const styleVar = (node, name) => {
    const m = new RegExp(`${name}:\\s*(-?\\d+)`).exec(node.getAttribute('style') ?? '');
    return m ? Number(m[1]) : NaN;
};

const eq = (actual, expected, msg) => assert.deepEqual([...actual].sort(), [...expected].sort(), msg);

// ── Month ────────────────────────────────────────────────────────────────

/** Which day cells carry a pill / are covered by a span bar for event `id`. */
const monthCoverage = (el, id) => {
    const pills = new Set();
    const bars = new Set();
    const geometry = [];
    el.querySelectorAll('.cal__week-row').forEach((row) => {
        const cells = [...row.querySelectorAll(':scope > .cal__day')];
        cells.forEach((cell) => {
            if (cell.querySelector(`[data-event-id="${id}"]`)) pills.add(ymd(new Date(cell.dataset.date)));
        });
        row.querySelectorAll(`:scope > .cal__span-bar[data-event-id="${id}"]`).forEach((bar) => {
            const col = styleVar(bar, '--span-col');
            const len = styleVar(bar, '--span-len');
            geometry.push({ col, len, cls: bar.className });
            for (let c = col; c < col + len; c++) if (cells[c]?.dataset.date) bars.add(ymd(new Date(cells[c].dataset.date)));
        });
    });
    return { pills, bars, geometry };
};

const assertSaneGeometry = (geometry, label) => {
    for (const g of geometry) {
        assert.ok(Number.isInteger(g.col) && g.col >= 0 && g.col <= 6, `${label}: --span-col out of range (${g.col})`);
        assert.ok(Number.isInteger(g.len) && g.len >= 1 && g.col + g.len <= 7, `${label}: --span-len out of range (${g.len})`);
    }
};

test('month a) same-day event: one pill on that day, no bar', () => {
    const { el, cal } = mount('month', [{ id: 'e', title: 'T', start: d(10, 10), end: d(10, 11) }]);
    const c = monthCoverage(el, 'e');
    eq(c.pills, keys([10]));
    eq(c.bars, []);
    cal.destroy();
});

test('month b) multi-day event: bar covers every affected day', () => {
    const { el, cal } = mount('month', [{ id: 'e', title: 'T', start: d(10, 10), end: d(12, 15) }]);
    const c = monthCoverage(el, 'e');
    eq(c.bars, days(10, 12));
    eq(c.pills, []);
    assertSaneGeometry(c.geometry, 'b');
    cal.destroy();
});

test('month c1) single-day allDay event: shown on that day', () => {
    const { el, cal } = mount('month', [{ id: 'e', title: 'T', start: d(10), end: d(10), allDay: true }]);
    const c = monthCoverage(el, 'e');
    eq(new Set([...c.pills, ...c.bars]), keys([10]));
    cal.destroy();
});

test('month c2) multi-day allDay (end inclusive, date only): covers first through last day', () => {
    const { el, cal } = mount('month', [{ id: 'e', title: 'T', start: d(10), end: d(12), allDay: true }]);
    const c = monthCoverage(el, 'e');
    eq(c.bars, days(10, 12));
    assertSaneGeometry(c.geometry, 'c2');
    cal.destroy();
});

test('month c3) multi-day allDay ending 23:59:59 covers the same days', () => {
    const { el, cal } = mount('month', [{ id: 'e', title: 'T', start: d(10), end: new Date(2026, 2, 12, 23, 59, 59), allDay: true }]);
    eq(monthCoverage(el, 'e').bars, days(10, 12));
    cal.destroy();
});

test('month d) event over midnight (22:00–02:00) is shown on both days', () => {
    const { el, cal } = mount('month', [{ id: 'e', title: 'T', start: d(10, 22), end: d(11, 2) }]);
    const c = monthCoverage(el, 'e');
    eq(new Set([...c.pills, ...c.bars]), days(10, 11));
    cal.destroy();
});

test('month e1) end == start: rendered once on that day', () => {
    const { el, cal } = mount('month', [{ id: 'e', title: 'T', start: d(10, 10), end: d(10, 10) }]);
    const c = monthCoverage(el, 'e');
    eq(c.pills, keys([10]));
    eq(c.bars, []);
    cal.destroy();
});

test('month e2) end before start on the same day: rendered once on that day', () => {
    const { el, cal } = mount('month', [{ id: 'e', title: 'T', start: d(10, 11), end: d(10, 10) }]);
    const c = monthCoverage(el, 'e');
    eq(c.pills, keys([10]));
    eq(c.bars, []);
    cal.destroy();
});

test('month e3) end on an earlier day than start: still visible on the start day, sane geometry', () => {
    const { el, cal } = mount('month', [{ id: 'e', title: 'T', start: d(10, 10), end: d(9, 10) }]);
    const c = monthCoverage(el, 'e');
    assertSaneGeometry(c.geometry, 'e3');
    eq(new Set([...c.pills, ...c.bars]), keys([10]));
    cal.destroy();
});

test('month f1) event crossing a week boundary: bars in both rows with continuation classes', () => {
    const { el, cal } = mount('month', [{ id: 'e', title: 'T', start: d(14, 10), end: d(16, 12) }]);
    const c = monthCoverage(el, 'e');
    eq(c.bars, days(14, 16));
    assert.equal(c.geometry.length, 2, 'one bar per week row');
    assert.match(c.geometry[0].cls, /cont-after/);
    assert.match(c.geometry[1].cls, /cont-before/);
    assertSaneGeometry(c.geometry, 'f1');
    cal.destroy();
});

test('month f2) event starting in the previous month: bar covers visible leading days', () => {
    const { el, cal } = mount('month', [{ id: 'e', title: 'T', start: d(26, 10, 0, FEB), end: d(2, 12) }]);
    const c = monthCoverage(el, 'e');
    eq(c.bars, new Set([...days(26, 28, FEB), ...days(1, 2)]));
    assertSaneGeometry(c.geometry, 'f2');
    cal.destroy();
});

test('month f3) event running into the next month: bar covers visible trailing days', () => {
    const { el, cal } = mount('month', [{ id: 'e', title: 'T', start: d(28, 10), end: d(3, 12, 0, APR) }]);
    const c = monthCoverage(el, 'e');
    eq(c.bars, new Set([...days(28, 31), ...days(1, 3, APR)]));
    assertSaneGeometry(c.geometry, 'f3');
    cal.destroy();
});

// ── Week ─────────────────────────────────────────────────────────────────

const weekCols = (el) => [...el.querySelectorAll('.cal__day-col')];
const colKey = (col) => ymd(new Date(col.dataset.date));

/** Timed overlays for event `id`, keyed by the day column that contains them. */
const weekTimed = (el, id) => {
    const out = new Map();
    for (const col of weekCols(el)) {
        const node = col.querySelector(`.cal__week-event[data-event-id="${id}"]`);
        if (node) {
            const top = parseFloat(/top:\s*([\d.]+)%/.exec(node.getAttribute('style'))[1]);
            const height = parseFloat(/height:\s*([\d.]+)%/.exec(node.getAttribute('style'))[1]);
            out.set(colKey(col), { top, height });
        }
    }
    return out;
};

/** Which week columns the all-day bar for `id` spans. */
const weekAllDay = (el, id) => {
    const cols = weekCols(el);
    const covered = new Set();
    const geometry = [];
    el.querySelectorAll(`.cal__allday-spans .cal__span-bar[data-event-id="${id}"]`).forEach((bar) => {
        const col = styleVar(bar, '--span-col');
        const len = styleVar(bar, '--span-len');
        geometry.push({ col, len, cls: bar.className });
        for (let c = col; c < col + len; c++) if (cols[c]) covered.add(colKey(cols[c]));
    });
    return { covered, geometry };
};

test('week a) same-day event: one block on that day with positive height', () => {
    const { el, cal } = mount('week', [{ id: 'e', title: 'T', start: d(10, 10), end: d(10, 11) }]);
    const t = weekTimed(el, 'e');
    eq(t.keys(), keys([10]));
    assert.ok(t.get(key(10)).height > 0);
    cal.destroy();
});

test('week b) multi-day event: a block in every affected day column', () => {
    const { el, cal } = mount('week', [{ id: 'e', title: 'T', start: d(10, 10), end: d(12, 15) }]);
    eq(weekTimed(el, 'e').keys(), days(10, 12));
    cal.destroy();
});

test('week c1) single-day allDay: all-day bar on that day, no timed block', () => {
    const { el, cal } = mount('week', [{ id: 'e', title: 'T', start: d(10), end: d(10), allDay: true }]);
    eq(weekAllDay(el, 'e').covered, keys([10]));
    eq(weekTimed(el, 'e').keys(), []);
    cal.destroy();
});

test('week c2) multi-day allDay: bar spans first through last day (inclusive)', () => {
    const { el, cal } = mount('week', [{ id: 'e', title: 'T', start: d(10), end: d(12), allDay: true }]);
    const a = weekAllDay(el, 'e');
    eq(a.covered, days(10, 12));
    assertSaneGeometry(a.geometry, 'week c2');
    cal.destroy();
});

test('week d) event over midnight: runs to the end of day 1 and starts at 00:00 on day 2', () => {
    const { el, cal } = mount('week', [{ id: 'e', title: 'T', start: d(10, 22), end: d(11, 2) }]);
    const t = weekTimed(el, 'e');
    eq(t.keys(), days(10, 11));
    const first = t.get(key(10));
    const second = t.get(key(11));
    assert.ok(Math.abs(first.top - (22 / 24) * 100) < 0.1, `day 1 top ${first.top}`);
    assert.ok(Math.abs(first.top + first.height - 100) < 0.1, `day 1 should reach the bottom, got ${first.top + first.height}`);
    assert.ok(second.top < 0.1, `day 2 top ${second.top}`);
    assert.ok(Math.abs(second.height - (2 / 24) * 100) < 0.1, `day 2 height ${second.height}`);
    cal.destroy();
});

test('week e1) end == start: visible block with positive height', () => {
    const { el, cal } = mount('week', [{ id: 'e', title: 'T', start: d(10, 10), end: d(10, 10) }]);
    const t = weekTimed(el, 'e');
    eq(t.keys(), keys([10]));
    assert.ok(t.get(key(10)).height > 0);
    cal.destroy();
});

test('week e2) end before start on the same day: visible block with positive height', () => {
    const { el, cal } = mount('week', [{ id: 'e', title: 'T', start: d(10, 11), end: d(10, 10) }]);
    const t = weekTimed(el, 'e');
    eq(t.keys(), keys([10]));
    assert.ok(t.get(key(10)).height > 0);
    cal.destroy();
});

test('week e3) end on an earlier day than start: still visible on the start day', () => {
    const { el, cal } = mount('week', [{ id: 'e', title: 'T', start: d(10, 10), end: d(9, 10) }]);
    const t = weekTimed(el, 'e');
    eq(t.keys(), keys([10]));
    assert.ok(t.get(key(10)).height > 0);
    cal.destroy();
});

test('week f1) event starting in the previous week: only the days inside this week', () => {
    const { el, cal } = mount('week', [{ id: 'e', title: 'T', start: d(6, 10), end: d(10, 12) }]);
    eq(weekTimed(el, 'e').keys(), days(9, 10));
    cal.destroy();
});

test('week f2) event running into the next week: only the days inside this week', () => {
    const { el, cal } = mount('week', [{ id: 'e', title: 'T', start: d(14, 10), end: d(17, 12) }]);
    eq(weekTimed(el, 'e').keys(), days(14, 15));
    cal.destroy();
});

test('week f3) allDay crossing the week boundary: bar is clipped and marked as continuing', () => {
    const { el, cal } = mount('week', [
        { id: 'next', title: 'T', start: d(13), end: d(18), allDay: true },
        { id: 'prev', title: 'T', start: d(2), end: d(10), allDay: true },
    ]);
    const next = weekAllDay(el, 'next');
    eq(next.covered, days(13, 15));
    assert.match(next.geometry[0].cls, /cont-after/);
    const prev = weekAllDay(el, 'prev');
    eq(prev.covered, days(9, 10));
    assert.match(prev.geometry[0].cls, /cont-before/);
    cal.destroy();
});

test('week f4) event entirely outside the visible week is not rendered', () => {
    const { el, cal } = mount('week', [{ id: 'e', title: 'T', start: d(20, 10), end: d(21, 12) }]);
    assert.equal(el.querySelector('[data-event-id="e"]'), null);
    cal.destroy();
});

// ── Agenda ───────────────────────────────────────────────────────────────

const agendaEntries = (el, id) => [...el.querySelectorAll(`.cal__agenda-event[data-event-id="${id}"]`)];
const agendaDay = (entry) => entry.closest('.cal__agenda-day').querySelector('.cal__agenda-num').textContent.trim();
const agendaLabel = (entry) => entry.querySelector('.cal__agenda-event-time').textContent.trim();

test('agenda a) same-day event: listed once on its day with a time range', () => {
    const { el, cal } = mount('agenda', [{ id: 'e', title: 'T', start: d(10, 10), end: d(10, 11) }]);
    const entries = agendaEntries(el, 'e');
    assert.equal(entries.length, 1);
    assert.equal(agendaDay(entries[0]), '10');
    const label = agendaLabel(entries[0]);
    assert.ok(label.includes(CalendarLogic.formatTime(d(10, 10))) && label.includes(CalendarLogic.formatTime(d(10, 11))), `label "${label}"`);
    cal.destroy();
});

test('agenda b) multi-day event: listed once (on its first day) with a date range', () => {
    const { el, cal } = mount('agenda', [{ id: 'e', title: 'T', start: d(10, 10), end: d(12, 15) }]);
    const entries = agendaEntries(el, 'e');
    assert.equal(entries.length, 1);
    assert.equal(agendaDay(entries[0]), '10');
    assert.match(
        agendaLabel(entries[0]),
        new RegExp(
            d(10)
                .toLocaleDateString()
                .replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
    );
    assert.match(
        agendaLabel(entries[0]),
        new RegExp(
            d(12)
                .toLocaleDateString()
                .replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
    );
    cal.destroy();
});

test('agenda c1) single-day allDay: labelled with the all-day text', () => {
    const { el, cal } = mount('agenda', [{ id: 'e', title: 'T', start: d(10), end: d(10), allDay: true }]);
    const entries = agendaEntries(el, 'e');
    assert.equal(entries.length, 1);
    assert.equal(agendaLabel(entries[0]), 'Ganztägig');
    cal.destroy();
});

test('agenda c2) multi-day allDay: listed once with a date range', () => {
    const { el, cal } = mount('agenda', [{ id: 'e', title: 'T', start: d(10), end: d(12), allDay: true }]);
    const entries = agendaEntries(el, 'e');
    assert.equal(entries.length, 1);
    assert.equal(agendaDay(entries[0]), '10');
    cal.destroy();
});

test('agenda d) event over midnight: listed once and the label keeps the clock times', () => {
    const { el, cal } = mount('agenda', [{ id: 'e', title: 'T', start: d(10, 22), end: d(11, 2) }]);
    const entries = agendaEntries(el, 'e');
    assert.equal(entries.length, 1);
    assert.equal(agendaDay(entries[0]), '10');
    assert.ok(agendaLabel(entries[0]).includes(CalendarLogic.formatTime(d(10, 22))), `label "${agendaLabel(entries[0])}" lost the start time`);
    assert.ok(agendaLabel(entries[0]).includes(CalendarLogic.formatTime(d(11, 2))), `label "${agendaLabel(entries[0])}" lost the end time`);
    cal.destroy();
});

test('agenda e1) end == start: listed once', () => {
    const { el, cal } = mount('agenda', [{ id: 'e', title: 'T', start: d(10, 10), end: d(10, 10) }]);
    assert.equal(agendaEntries(el, 'e').length, 1);
    cal.destroy();
});

test('agenda e2) end before start on the same day: listed once', () => {
    const { el, cal } = mount('agenda', [{ id: 'e', title: 'T', start: d(10, 11), end: d(10, 10) }]);
    assert.equal(agendaEntries(el, 'e').length, 1);
    cal.destroy();
});

test('agenda e3) end on an earlier day than start: still listed on the start day', () => {
    const { el, cal } = mount('agenda', [{ id: 'e', title: 'T', start: d(10, 10), end: d(9, 10) }]);
    const entries = agendaEntries(el, 'e');
    assert.equal(entries.length, 1);
    assert.equal(agendaDay(entries[0]), '10');
    cal.destroy();
});

test('agenda f1) event starting in the previous month: listed once, on the first day of the month', () => {
    const { el, cal } = mount('agenda', [{ id: 'e', title: 'T', start: d(26, 10, 0, FEB), end: d(2, 12) }]);
    const entries = agendaEntries(el, 'e');
    assert.equal(entries.length, 1);
    assert.equal(agendaDay(entries[0]), '1');
    cal.destroy();
});

test('agenda f2) event running into the next month: listed once, on its start day', () => {
    const { el, cal } = mount('agenda', [{ id: 'e', title: 'T', start: d(28, 10), end: d(3, 12, 0, APR) }]);
    const entries = agendaEntries(el, 'e');
    assert.equal(entries.length, 1);
    assert.equal(agendaDay(entries[0]), '28');
    cal.destroy();
});
