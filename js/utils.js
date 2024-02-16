const utils = {
    ready(fn) {
        if (document.readyState === "complete" || document.readyState === "interactive") {
            setTimeout(fn, 1);
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    },

    value(element) {
        if (element.hasAttribute('value')) {
            return element.getAttribute('value');
        }
        if (element.hasAttribute('data-value')) {
            return element.data('value');
        }
        return element.innerText;
    },

    text(element) {
        return element.innerText;
    },

    attribute(element, attribute) {
        if (element.hasAttribute(attribute)) {
            return element.getAttribute(attribute);
        }
        return undefined;
    },

    isList(element) {
        return NodeList.prototype.isPrototypeOf(element);
    },

    isHidden(element) {
        return (element.offsetParent === null)
    }
}

export {utils};


