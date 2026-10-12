import { test } from 'node:test';
import assert from 'node:assert/strict';
import { root } from './helpers.mjs';
import { sanitizeHtml, isSafeUrl, escapeAttr } from '../js/utils.js';
import { VirtualDropdown } from '../js/virtual-dropdown.js';
import { CodeViewer } from '../js/code-viewer.js';
import { FlyoutMenu } from '../js/flyout-menu.js';
import { GroupPicker } from '../js/group-picker.js';
import { TimeSpanPicker } from '../js/timepicker.js';
import { Tooltip } from '../js/tooltip.js';
import { FileUploader } from '../js/file-uploader.js';
import { MasonryGallery } from '../js/gallery.js';

for (const m of ['showPopover', 'hidePopover']) window.HTMLElement.prototype[m] ??= function () {};

const hasInjection = (el) => {
    if (el.querySelector('script, img[onerror], iframe')) return true;
    for (const n of el.querySelectorAll('*')) for (const a of n.attributes) if (/^on/i.test(a.name)) return true;
    return false;
};
const render = (html) => {
    const d = document.createElement('div');
    d.innerHTML = html;
    return d;
};

test('VirtualDropdown: option value cannot break out of data-value', () => {
    const c = root();
    const vd = new VirtualDropdown({ container: c, options: [{ value: 'x" onmouseover="window.p=1', label: 'a' }] });
    vd.open();
    assert.equal(c.querySelector('[onmouseover]'), null);
    assert.equal(c.querySelector('.dropdown-item').dataset.value, 'x" onmouseover="window.p=1');
});

test('FileUploader: file name cannot break out of title', () => {
    const c = root();
    c.innerHTML = '<div class="drop-zone"></div><input class="file-input" type="file"><div class="file-list"></div><button class="upload-btn"></button>';
    const u = new FileUploader(c);
    const item = u.addFileToUI(new window.File(['x'], 'a" onmouseover="window.p=1'));
    assert.equal(item.querySelector('[onmouseover]'), null);
    assert.equal(item.querySelector('.file-name').title, 'a" onmouseover="window.p=1');
});

test('MasonryGallery: src/alt cannot break out of attributes', () => {
    const card = MasonryGallery.prototype.createCard.call({}, { src: 'a" onerror="window.p=1', title: 'b" onload="window.p=1', desc: '<i>d</i>' });
    assert.equal(hasInjection(card), false);
    assert.equal(card.querySelector('img').alt, 'b" onload="window.p=1');
});

test('CodeViewer: CSS strings and comments are escaped', () => {
    for (const src of ['a{content:"<img src=x onerror=alert(1)>"}', '/* <img src=x onerror=alert(1)> */ a{}']) {
        const c = root();
        new CodeViewer(c, src, 'css');
        assert.equal(hasInjection(c), false, src);
    }
    assert.match(
        (() => {
            const c = root();
            new CodeViewer(c, 'a{content:"<b>"}', 'css');
            return c.textContent;
        })(),
        /<b>/,
    );
});

test('CodeViewer: language label is escaped', () => {
    const c = root();
    new CodeViewer(c, 'x', '<img src=x onerror=alert(1)>');
    assert.equal(hasInjection(c), false);
});

const flyoutDom = (li) => {
    document.body.innerHTML = `<button class="menu-trigger"></button><div id="flyoutOverlay"></div><nav id="flyoutMenu"><ul class="flyout-links">${li}</ul></nav>`;
};

test('FlyoutMenu: entity-encoded submenu text stays text', () => {
    flyoutDom('<li>&lt;img src=x onerror=alert(1)&gt;<ul><li><a href="#">x</a></li></ul></li>');
    const fm = new FlyoutMenu({});
    const toggle = document.querySelector('.submenu-toggle');
    assert.ok(toggle);
    assert.equal(hasInjection(document.body), false);
    assert.match(toggle.textContent, /<img src=x onerror=alert\(1\)>/);
    fm.destroy?.();
});

test('FlyoutMenu: title is text, footerText is sanitized but keeps entities', () => {
    flyoutDom('<li><a href="#">a</a></li>');
    const fm = new FlyoutMenu({
        title: '<img src=x onerror=alert(1)>',
        footerText: '&copy; Acme <img src=x onerror=alert(1)> <a href="javascript:alert(1)">x</a>',
    });
    assert.equal(hasInjection(document.body), false);
    assert.equal(document.querySelector('.flyout-title').textContent, '<img src=x onerror=alert(1)>');
    assert.match(document.querySelector('.flyout-footer').textContent, /©/);
    assert.equal(document.querySelector('.flyout-footer a').hasAttribute('href'), false);
    fm.destroy?.();
});

test('GroupPicker: emptyLabel is text; group ids with quotes toggle without throwing', () => {
    const c = root();
    const gp = new GroupPicker(c, [{ id: 'a"]x', label: 'A', subgroups: [{ id: 's', label: 'S' }] }], { emptyLabel: '<img src=x onerror=alert(1)>' });
    gp.searchQuery = 'zzzz';
    gp.renderGroups();
    assert.equal(hasInjection(c), false);
    assert.match(c.querySelector('.group-picker__empty').textContent, /<img src=x/);
    assert.doesNotThrow(() => gp.toggleExpand('a"]x'));
});

test('TimeSpanPicker: labels are text', () => {
    const c = root();
    new TimeSpanPicker(c, { fromString: '<img src=x onerror=alert(1)>', toLabel: '<b onclick=1>' });
    assert.equal(hasInjection(c), false);
});

test('Tooltip: isHtml content is sanitized', () => {
    const t = new Tooltip(root(), '<b>ok</b><img src=x onerror=alert(1)><a href="java&#9;script:alert(1)">l</a>', { isHtml: true });
    t.createTooltip();
    const el = t.tooltipElement;
    assert.equal(hasInjection(el), false);
    assert.equal(el.querySelector('a').hasAttribute('href'), false);
    assert.ok(el.querySelector('b'));
});

test('iconBasePath cannot break out of the href attribute', () => {
    const payload = '"><img src=x onerror=alert(1)>';
    const c = root();
    new GroupPicker(c, [{ id: 'a', label: 'A', subgroups: [{ id: 's', label: 'S' }] }], { iconBasePath: payload });
    assert.equal(hasInjection(c), false);
    assert.equal(escapeAttr(payload), '&#34;&#62;&#60;img src=x onerror=alert(1)&#62;');
});

const SANITIZE_BLOCKED = [
    '<a href="java&#9;script:alert(1)">x</a>',
    '<a href="java&#10;script:alert(1)">x</a>',
    '<a href="&#1;javascript:alert(1)">x</a>',
    '<a href="  JaVaScRiPt:alert(1)">x</a>',
    '<a href="data:text/html,<script>alert(1)</script>">x</a>',
    '<a href="vbscript:x">x</a>',
    '<svg><a xlink:href="java&#10;script:alert(1)"><text>x</text></a></svg>',
    '<form action="java&#9;script:alert(1)"><button>x</button></form>',
    '<form><button formaction="javascript:alert(1)">x</button></form>',
    '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
    '<img src="data:image/svg+xml,<svg onload=alert(1)>">',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
    '<details open ontoggle=alert(1)>',
    '<base href="//evil.example/">',
    '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
    '<link rel="stylesheet" href="//evil.example/x.css">',
    '<svg><animate attributeName="href" values="javascript:alert(1)"/></svg>',
];

for (const payload of SANITIZE_BLOCKED) {
    test(`sanitizeHtml blocks ${payload.slice(0, 60)}`, () => {
        const out = sanitizeHtml(payload);
        const el = render(out);
        assert.equal(hasInjection(el), false, out);
        assert.doesNotMatch(out.replace(/[\u0000- ]/g, '').toLowerCase(), /javascript:|vbscript:|data:text|srcdoc|<base|<meta|<link|<animate/, out);
        assert.doesNotMatch(out, /data:image\/svg/, out);
    });
}

test('sanitizeHtml keeps ordinary content', () => {
    const html =
        '<p class="a" style="color:red" id="x" data-k="v">Hi <a href="https://example.com/a?b=1" target="_blank">l</a> <a href="mailto:a@b.c">m</a> <a href="tel:+43123">t</a> <a href="/rel/path:1">r</a> <a href="#frag">f</a> <a href="page.html">p</a><img src="data:image/png;base64,AAAA" alt="i"><img src="img/a.png"></p><form action="/submit"><input name="q"></form>';
    const out = sanitizeHtml(html);
    for (const needle of [
        'class="a"',
        'style="color:red"',
        'id="x"',
        'data-k="v"',
        'href="https://example.com/a?b=1"',
        'target="_blank"',
        'href="mailto:a@b.c"',
        'href="tel:+43123"',
        'href="/rel/path:1"',
        'href="#frag"',
        'href="page.html"',
        'src="data:image/png;base64,AAAA"',
        'src="img/a.png"',
        'action="/submit"',
    ]) {
        assert.ok(out.includes(needle), `missing ${needle} in ${out}`);
    }
});

test('isSafeUrl', () => {
    for (const ok of ['https://a.b', 'HTTP://a.b', 'mailto:a@b.c', 'tel:123', '/x', 'x/y', '#a', '?q=1', '//host/x', 'x/a:b'])
        assert.equal(isSafeUrl(ok), true, ok);
    for (const bad of [
        'javascript:alert(1)',
        ' java\tscript:1',
        '\u0001javascript:1',
        'JAVASCRIPT:1',
        'data:text/html,x',
        'vbscript:x',
        'file:///etc/passwd',
        'data:image/png;base64,AA',
    ])
        assert.equal(isSafeUrl(bad), false, bad);
    assert.equal(isSafeUrl('data:image/png;base64,AA', true), true);
    assert.equal(isSafeUrl('data:image/svg+xml,<svg/>', true), false);
});
