/**
 * Utility functions for DOM manipulation and element handling
 */
const utils = {
    /**
     * Execute a function when the DOM is ready
     * @param fn - Callback function to execute
     */
    ready(fn) {
        if (document.readyState === "complete" || document.readyState === "interactive") {
            setTimeout(fn, 1);
        }
        else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    },
    /**
     * Get the value of an element from various sources
     * Priority: value attribute > data-value attribute > innerText
     * @param element - HTML element to get value from
     * @returns The element's value as a string
     */
    value(element) {
        if (element.hasAttribute('value')) {
            return element.getAttribute('value') || '';
        }
        if (element.hasAttribute('data-value')) {
            return element.getAttribute('data-value') || '';
        }
        return element.innerText;
    },
    /**
     * Get the text content of an element
     * @param element - HTML element to get text from
     * @returns The element's inner text
     */
    text(element) {
        return element.innerText;
    },
    /**
     * Get an attribute value from an element
     * @param element - HTML element to get attribute from
     * @param attribute - Name of the attribute to retrieve
     * @returns The attribute value or undefined if not present
     */
    attribute(element, attribute) {
        if (element.hasAttribute(attribute)) {
            return element.getAttribute(attribute) || undefined;
        }
        return undefined;
    },
    /**
     * Check if an element is a NodeList
     * @param element - Element or NodeList to check
     * @returns True if the element is a NodeList
     */
    isList(element) {
        return NodeList.prototype.isPrototypeOf(element);
    },
    /**
     * Check if an element is hidden
     * @param element - HTML element to check
     * @returns True if the element is hidden
     */
    isHidden(element) {
        return element.offsetParent === null;
    }
};
/**
 * Escape a plain-text string so it is safe to inject into innerHTML.
 * Use this whenever inserting user-controlled strings into HTML templates.
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
/**
 * Sanitize an HTML string by removing dangerous elements and attributes
 * (script, iframe, on* handlers, javascript: hrefs) while preserving safe markup.
 * Use this when a component intentionally accepts rich HTML from callers.
 */
function sanitizeHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    doc.querySelectorAll('script, style, iframe, object, embed').forEach(el => el.remove());
    doc.querySelectorAll('*').forEach(el => {
        for (const attr of Array.from(el.attributes)) {
            if (attr.name.startsWith('on') ||
                attr.value.trim().toLowerCase().startsWith('javascript:')) {
                el.removeAttribute(attr.name);
            }
        }
    });
    return doc.body.innerHTML;
}
export { utils, escapeHtml, sanitizeHtml };
