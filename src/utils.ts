/** Shape of the `utils` helper object. */
interface Utils {
    ready(fn: () => void): void;
    value(element: HTMLElement): string;
    text(element: HTMLElement): string;
    attribute(element: HTMLElement, attribute: string): string | undefined;
    isList(element: HTMLElement | NodeList): boolean;
    isHidden(element: HTMLElement): boolean;
}

const utils: Utils = {
    ready(fn: () => void): void {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(fn, 1);
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    },

    // Priority: value attribute > data-value attribute > innerText
    value(element: HTMLElement): string {
        if (element.hasAttribute('value')) {
            return element.getAttribute('value')!;
        }
        if (element.hasAttribute('data-value')) {
            return element.getAttribute('data-value')!;
        }
        return element.innerText;
    },

    text(element: HTMLElement): string {
        return element.innerText;
    },

    attribute(element: HTMLElement, attribute: string): string | undefined {
        if (element.hasAttribute(attribute)) {
            return element.getAttribute(attribute) || undefined;
        }
        return undefined;
    },

    isList(element: HTMLElement | NodeList): element is NodeList {
        return element instanceof NodeList;
    },

    isHidden(element: HTMLElement): boolean {
        return element.offsetParent === null;
    },
};

/**
 * Escape a plain-text string so it is safe to inject into innerHTML.
 * Use this whenever inserting user-controlled strings into HTML templates.
 */
function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Escape a string for safe use inside a quoted HTML attribute value.
 * Unlike escapeHtml, this also escapes both quote characters, so the value
 * cannot break out of `attr="..."` or `attr='...'`.
 */
function escapeAttr(text: string): string {
    return String(text).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

const URL_ATTRIBUTES = ['href', 'src', 'action', 'formaction', 'xlink:href', 'poster', 'background', 'cite', 'data', 'ping'];
const SAFE_SCHEMES = ['http', 'https', 'mailto', 'tel'];
const SAFE_DATA_IMAGE = /^data:image\/(png|gif|jpe?g|webp|avif)[;,]/;

/**
 * Check whether a URL is safe to place in `href`/`src`-like attributes.
 * Allows http(s), mailto, tel, relative URLs and fragments. `data:image/*` (raster only)
 * is allowed when `allowDataImage` is set. Browsers ignore whitespace and control
 * characters inside a scheme (`java\tscript:`), so those are stripped before checking.
 */
function isSafeUrl(url: string, allowDataImage = false): boolean {
    const normalized = url.replace(/[\u0000-\u0020\u007f-\u009f\u00ad\u200b-\u200d\u2028\u2029\ufeff]/g, '').toLowerCase();
    const scheme = /^([a-z][a-z0-9+.-]*):/.exec(normalized);
    if (!scheme) return true;
    if (SAFE_SCHEMES.includes(scheme[1])) return true;
    return allowDataImage && SAFE_DATA_IMAGE.test(normalized);
}

/**
 * Sanitize an HTML string by removing dangerous elements and attributes
 * (script, iframe, base, meta, link, on* handlers, srcdoc, and URLs whose scheme is not
 * http/https/mailto/tel) while preserving safe markup. Remote images and CSS `url()`
 * are not blocked. Use this when a component intentionally accepts rich HTML from callers.
 */
function sanitizeHtml(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    doc.querySelectorAll('script, style, iframe, frame, frameset, object, embed, applet, base, meta, link, animate, set').forEach((el) => el.remove());

    doc.querySelectorAll('*').forEach((el) => {
        for (const attr of Array.from(el.attributes)) {
            const name = attr.name.toLowerCase();
            if (name.startsWith('on') || name === 'srcdoc' || name === 'srcset') {
                el.removeAttribute(attr.name);
            } else if (URL_ATTRIBUTES.includes(name)) {
                const allowData = name === 'src' && el.tagName.toLowerCase() === 'img';
                if (!isSafeUrl(attr.value, allowData)) el.removeAttribute(attr.name);
            } else if (/^[\s\u0000-\u001f]*javascript:/i.test(attr.value)) {
                el.removeAttribute(attr.name);
            }
        }
    });

    return doc.body.innerHTML;
}

export { utils, escapeHtml, escapeAttr, isSafeUrl, sanitizeHtml };
