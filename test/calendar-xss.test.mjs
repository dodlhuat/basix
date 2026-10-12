import { test } from 'node:test';
import assert from 'node:assert/strict';
import { root } from './helpers.mjs';
import { Calendar } from '../js/calendar.js';

const PAYLOADS = [
    '<img src=x onerror="window.__xss=1">',
    '"><script>window.__xss=1</script>',
    `' onmouseover='window.__xss=1`,
    '" autofocus onfocus="window.__xss=1',
];

const today = new Date();
const at = (h) => new Date(today.getFullYear(), today.getMonth(), today.getDate(), h);

const assertInert = (el, label) => {
    assert.equal(el.querySelector('script'), null, `${label}: <script> injected`);
    assert.equal(el.querySelector('img'), null, `${label}: <img> injected`);
    for (const node of el.querySelectorAll('*')) {
        for (const attr of node.attributes) {
            assert.ok(!/^on/i.test(attr.name), `${label}: attribute ${attr.name} injected`);
        }
        assert.ok(!node.hasAttribute('autofocus'), `${label}: autofocus injected`);
    }
};

const events = (payload) => [
    { id: 'timed', title: payload, start: at(10), end: at(11), className: payload },
    { id: 'allday', title: payload, start: at(0), end: at(0), allDay: true, className: payload },
    {
        id: 'multi',
        title: payload,
        start: at(0),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 12),
        className: payload,
    },
    { id: payload, title: 'x', start: at(12), end: at(13) },
];

for (const view of ['month', 'week', 'agenda']) {
    for (const payload of PAYLOADS) {
        test(`${view} view escapes ${JSON.stringify(payload)}`, () => {
            const el = root();
            const cal = new Calendar({ container: el, view, events: events(payload) });
            try {
                assertInert(el, view);
            } finally {
                cal.destroy();
            }
        });
    }
}

test('titles stay readable as text', () => {
    const el = root();
    const cal = new Calendar({ container: el, view: 'agenda', events: [{ id: '1', title: 'A <b>&</b> "B"', start: at(10), end: at(11) }] });
    assert.equal(el.querySelector('.cal__agenda-event-title').textContent, 'A <b>&</b> "B"');
    cal.destroy();
});

test('event click still resolves ids containing special characters', () => {
    const el = root();
    let clicked = null;
    const cal = new Calendar({ container: el, view: 'agenda', events: events(PAYLOADS[1]), onEventClick: (e) => (clicked = e.id) });
    const nodes = [...el.querySelectorAll('[data-event-id]')];
    const target = nodes.find((n) => n.dataset.eventId === PAYLOADS[1]);
    assert.ok(target, 'element with special-char id found');
    target.click();
    assert.equal(clicked, PAYLOADS[1]);
    cal.destroy();
});

test('badge is escaped, styled and part of the aria-label', () => {
    for (const view of ['month', 'week', 'agenda']) {
        const el = root();
        const payload = '"><img src=x onerror=1>';
        const cal = new Calendar({
            container: el,
            view,
            events: [
                { id: 'b', title: 'Kurs', start: at(10), end: at(11), badge: payload, badgeClassName: payload },
                { id: 'm', title: 'Camp', start: at(0), end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1), badge: payload },
            ],
        });
        try {
            assertInert(el, `badge ${view}`);
            const badge = el.querySelector('.cal__event-badge');
            assert.ok(badge, `${view}: badge rendered`);
            assert.equal(badge.textContent.trim(), payload);
        } finally {
            cal.destroy();
        }
    }
});

test('no badge element without badge', () => {
    const el = root();
    const cal = new Calendar({ container: el, view: 'agenda', events: [{ id: 'x', title: 'T', start: at(10), end: at(11) }] });
    assert.equal(el.querySelector('.cal__event-badge'), null);
    cal.destroy();
});
