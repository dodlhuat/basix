/**
 * Utility functions for DOM manipulation and element handling
 */

interface Utils {
    ready(fn: () => void): void;
    value(element: HTMLElement): string;
    text(element: HTMLElement): string;
    attribute(element: HTMLElement, attribute: string): string | undefined;
    isList(element: HTMLElement | NodeList): boolean;
    isHidden(element: HTMLElement): boolean;
}

const utils: Utils = {
    /**
     * Execute a function when the DOM is ready
     * @param fn - Callback function to execute
     */
    ready(fn: () => void): void {
        if (document.readyState === "complete" || document.readyState === "interactive") {
            setTimeout(fn, 1);
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    },

    /**
     * Get the value of an element from various sources
     * Priority: value attribute > data-value attribute > innerText
     * @param element - HTML element to get value from
     * @returns The element's value as a string
     */
    value(element: HTMLElement): string {
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
    text(element: HTMLElement): string {
        return element.innerText;
    },

    /**
     * Get an attribute value from an element
     * @param element - HTML element to get attribute from
     * @param attribute - Name of the attribute to retrieve
     * @returns The attribute value or undefined if not present
     */
    attribute(element: HTMLElement, attribute: string): string | undefined {
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
    isList(element: HTMLElement | NodeList): element is NodeList {
        return NodeList.prototype.isPrototypeOf(element);
    },

    /**
     * Check if an element is hidden
     * @param element - HTML element to check
     * @returns True if the element is hidden
     */
    isHidden(element: HTMLElement): boolean {
        return element.offsetParent === null;
    }
};

export { utils };