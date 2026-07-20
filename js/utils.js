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
function sanitizeHtml(html) {
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
