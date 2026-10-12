import { test } from 'node:test';
import assert from 'node:assert/strict';
import { root } from './helpers.mjs';
import { Toast } from '../js/toast.js';
import { Modal } from '../js/modal.js';
import { BottomSheet } from '../js/bottom-sheet.js';
import { Lightbox } from '../js/lightbox.js';
import { Chart } from '../js/chart.js';
import { Table } from '../js/table.js';
import { TreeComponent, TreeNode } from '../js/tree.js';
import { ContextMenu } from '../js/context-menu.js';
import { sanitizeHtml } from '../js/utils.js';

// Every component that renders caller-supplied strings is fed hostile values here.
// A regression in any of them (a new innerHTML, a switch from escapeAttr back to
// escapeHtml in an attribute) shows up as an injected element or on* attribute.

const PAYLOADS = [
    '<img src=x onerror="window.__xss=1">',
    '"><script>window.__xss=1</script>',
    `' onmouseover='window.__xss=1`,
    '" autofocus onfocus="window.__xss=1',
];

const injected = (scope) => {
    if (scope.querySelector('script, img[onerror], iframe')) return 'injected element';
    for (const n of scope.querySelectorAll('*')) {
        for (const a of n.attributes) {
            if (/^on/i.test(a.name)) return `attribute ${a.name} on <${n.tagName.toLowerCase()}>`;
            if (a.name === 'autofocus') return 'autofocus attribute';
        }
    }
    return null;
};

const clean = () => {
    document.body.innerHTML = '';
};

for (const payload of PAYLOADS) {
    const label = JSON.stringify(payload);

    test(`Toast escapes content and header ${label}`, () => {
        clean();
        const t = new Toast({ content: payload, header: payload });
        t.show();
        assert.equal(injected(document.body), null);
        t.hide?.();
    });

    test(`Modal / BottomSheet sanitize HTML sections ${label}`, () => {
        for (const make of [
            () => new Modal({ content: payload, header: payload, footer: payload }),
            () => new BottomSheet({ content: payload, header: payload, footer: payload }),
        ]) {
            clean();
            const c = make();
            c.show();
            assert.equal(injected(document.body), null);
            c.hide?.();
        }
    });

    test(`Lightbox treats caption and alt as text ${label}`, () => {
        clean();
        const lb = new Lightbox({ images: [{ src: payload, alt: payload, caption: payload }] });
        lb.show();
        assert.equal(injected(document.body), null);
        lb.hide?.();
    });

    test(`Chart escapes title, labels, series names, empty message ${label}`, () => {
        clean();
        const el = root();
        const data = [{ label: payload, value: 3 }];
        const chart = new Chart(el, { type: 'column', title: payload, subtitle: payload, series: [{ name: payload, data }] });
        assert.equal(injected(el), null);
        chart.destroy?.();
        const empty = root();
        const c2 = new Chart(empty, { type: 'column', series: [], emptyMessage: payload });
        assert.equal(injected(empty), null);
        c2.destroy?.();
    });

    test(`Table escapes cells and column labels ${label}`, () => {
        clean();
        const el = root();
        const table = new Table(el, { columns: [{ key: 'a', label: payload, sortable: true }], data: [{ a: payload }], pageSize: 5 });
        assert.equal(injected(el), null);
        table.destroy?.();
    });

    test(`Tree escapes node labels ${label}`, () => {
        clean();
        const el = root();
        const tree = new TreeComponent(el, [new TreeNode(payload, 'folder', [new TreeNode(payload, 'file')])]);
        assert.equal(injected(el), null);
        tree.destroy?.();
    });

    test(`ContextMenu escapes item labels and shortcuts ${label}`, () => {
        clean();
        const target = root();
        const menu = new ContextMenu(target, [{ label: payload, shortcut: payload, submenu: [{ label: payload }] }, { group: payload }]);
        target.dispatchEvent(new window.MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 5, clientY: 5 }));
        assert.equal(injected(document.body), null);
        menu.destroy?.();
    });
}

// ── sanitizeHtml({ strict: true }) ───────────────────────────────────────

const strict = (html) => sanitizeHtml(html, { strict: true });

test('strict: keeps text-level markup', () => {
    const out = strict(
        '<p class="a" title="t">Hi <strong>there</strong> <a href="https://example.com" target="_blank">link</a><br><ul><li>x</li></ul><img src="a.png" alt="i" width="10"></p><table><tbody><tr><td colspan="2">c</td></tr></tbody></table>',
    );
    for (const needle of [
        '<p class="a" title="t">',
        '<strong>there</strong>',
        'href="https://example.com"',
        'rel="noopener noreferrer"',
        '<li>x</li>',
        'src="a.png"',
        'alt="i"',
        'width="10"',
        'colspan="2"',
    ]) {
        assert.ok(out.includes(needle), `missing ${needle} in ${out}`);
    }
});

test('strict: drops style, id, data-*, forms, svg, media and unwraps unknown tags', () => {
    const out = strict(
        '<div id="x" style="color:red" data-k="v"><form action="/x"><input name="q"><button>go</button></form><svg><circle r="1"/></svg><video src="a.mp4"></video><custom-el>kept text</custom-el><font color="red">font text</font></div>',
    );
    assert.doesNotMatch(out, /id=|style=|data-k|<form|<input|<button|<svg|<circle|<video|<custom-el|<font/);
    assert.match(out, /kept text/);
    assert.match(out, /font text/);
});

test('strict: still applies the URL and handler rules', () => {
    const out = strict('<a href="java&#9;script:alert(1)" onclick="x()">a</a><img src="data:image/svg+xml,<svg onload=1>"><img src=x onerror=alert(1)>');
    assert.doesNotMatch(out, /javascript|onclick|onerror|svg\+xml/i);
});

test('strict: only adds rel for target="_blank" and overrides an unsafe rel', () => {
    assert.match(strict('<a href="/x" target="_blank" rel="opener">a</a>'), /rel="noopener noreferrer"/);
    assert.doesNotMatch(strict('<a href="/x">a</a>'), /rel=/);
});

test('default mode is unchanged by the strict option', () => {
    const html = '<div id="x" style="color:red"><form action="/x"><input name="q"></form></div>';
    assert.equal(sanitizeHtml(html), sanitizeHtml(html, {}));
    assert.ok(sanitizeHtml(html).includes('<form'));
});
