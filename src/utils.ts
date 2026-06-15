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
 * Sanitize an HTML string by removing dangerous elements and attributes
 * (script, iframe, on* handlers, javascript: hrefs) while preserving safe markup.
 * Use this when a component intentionally accepts rich HTML from callers.
 */
function sanitizeHtml(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    doc.querySelectorAll('script, style, iframe, object, embed').forEach((el) => el.remove());

    doc.querySelectorAll('*').forEach((el) => {
        for (const attr of Array.from(el.attributes)) {
            if (attr.name.startsWith('on') || attr.value.trim().toLowerCase().startsWith('javascript:')) {
                el.removeAttribute(attr.name);
            }
        }
    });

    return doc.body.innerHTML;
}

export { utils, escapeHtml, sanitizeHtml };
