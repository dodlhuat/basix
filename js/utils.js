const utils = {}

utils.ready = function (fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

utils.getElement = function (selector) {
    const elements = document.querySelectorAll(selector);
    if (elements.length === 1) {
        return elements[0];
    }
    return elements;
}

utils.value = function (element) {
    if (element.hasAttribute('value')) {
        return element.getAttribute('value');
    }
    if (element.hasAttribute('data-value')) {
        return element.data('value');
    }
    return element.innerText;
}

utils.text = function (element) {
    return element.innerText;
}

utils.attribute = function (element, attribute) {
    if (element.hasAttribute(attribute)) {
        return element.getAttribute(attribute);
    }
    return undefined;
}

utils.isList = function (element) {
    return NodeList.prototype.isPrototypeOf(element);
}

export {utils};


