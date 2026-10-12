const utils = {
    ready(fn) {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(fn, 1);
        }
        else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    },
    value(element) {
        if (element.hasAttribute('value')) {
            return element.getAttribute('value');
        }
        if (element.hasAttribute('data-value')) {
            return element.getAttribute('data-value');
        }
        return element.innerText;
    },
    text(element) {
        return element.innerText;
    },
    attribute(element, attribute) {
        if (element.hasAttribute(attribute)) {
            return element.getAttribute(attribute) || undefined;
        }
        return undefined;
    },
    isList(element) {
        return element instanceof NodeList;
    },
    isHidden(element) {
        return element.offsetParent === null;
    },
};
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
function escapeAttr(text) {
    return String(text).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
const URL_ATTRIBUTES = ['href', 'src', 'action', 'formaction', 'xlink:href', 'poster', 'background', 'cite', 'data', 'ping'];
const SAFE_SCHEMES = ['http', 'https', 'mailto', 'tel'];
const SAFE_DATA_IMAGE = /^data:image\/(png|gif|jpe?g|webp|avif)[;,]/;
function isSafeUrl(url, allowDataImage = false) {
    const normalized = url.replace(/[\u0000-\u0020\u007f-\u009f\u00ad\u200b-\u200d\u2028\u2029\ufeff]/g, '').toLowerCase();
    const scheme = /^([a-z][a-z0-9+.-]*):/.exec(normalized);
    if (!scheme)
        return true;
    if (SAFE_SCHEMES.includes(scheme[1]))
        return true;
    return allowDataImage && SAFE_DATA_IMAGE.test(normalized);
}
const STRICT_TAGS = new Set([
    'a',
    'abbr',
    'b',
    'blockquote',
    'br',
    'caption',
    'code',
    'dd',
    'del',
    'div',
    'dl',
    'dt',
    'em',
    'figcaption',
    'figure',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hr',
    'i',
    'img',
    'ins',
    'li',
    'mark',
    'ol',
    'p',
    'pre',
    's',
    'small',
    'span',
    'strong',
    'sub',
    'sup',
    'table',
    'tbody',
    'td',
    'tfoot',
    'th',
    'thead',
    'time',
    'tr',
    'u',
    'ul',
]);
const STRICT_GLOBAL_ATTRS = new Set(['class', 'title', 'lang', 'dir']);
const STRICT_TAG_ATTRS = {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan', 'scope'],
    time: ['datetime'],
};
function applyStrict(body) {
    for (const el of Array.from(body.querySelectorAll('*'))) {
        const tag = el.tagName.toLowerCase();
        if (!STRICT_TAGS.has(tag)) {
            el.replaceWith(...Array.from(el.childNodes));
            continue;
        }
        const allowed = STRICT_TAG_ATTRS[tag] ?? [];
        for (const attr of Array.from(el.attributes)) {
            const name = attr.name.toLowerCase();
            if (!STRICT_GLOBAL_ATTRS.has(name) && !allowed.includes(name))
                el.removeAttribute(attr.name);
        }
        if (tag === 'a' && el.getAttribute('target') === '_blank')
            el.setAttribute('rel', 'noopener noreferrer');
    }
}
function sanitizeHtml(html, options = {}) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    doc.querySelectorAll('script, style, iframe, frame, frameset, object, embed, applet, base, meta, link, animate, set').forEach((el) => el.remove());
    doc.querySelectorAll('*').forEach((el) => {
        for (const attr of Array.from(el.attributes)) {
            const name = attr.name.toLowerCase();
            if (name.startsWith('on') || name === 'srcdoc' || name === 'srcset') {
                el.removeAttribute(attr.name);
            }
            else if (URL_ATTRIBUTES.includes(name)) {
                const allowData = name === 'src' && el.tagName.toLowerCase() === 'img';
                if (!isSafeUrl(attr.value, allowData))
                    el.removeAttribute(attr.name);
            }
            else if (/^[\s\u0000-\u001f]*javascript:/i.test(attr.value)) {
                el.removeAttribute(attr.name);
            }
        }
    });
    if (options.strict)
        applyStrict(doc.body);
    return doc.body.innerHTML;
}
export { utils, escapeHtml, escapeAttr, isSafeUrl, sanitizeHtml };
