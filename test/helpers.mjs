import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><body><div id="root"></div></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.DOMParser = dom.window.DOMParser;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.AbortController = dom.window.AbortController;
for (const name of ['Image', 'Event', 'CustomEvent', 'MouseEvent', 'KeyboardEvent', 'SVGElement', 'MutationObserver']) {
    globalThis[name] = dom.window[name];
}
for (const name of ['requestAnimationFrame', 'cancelAnimationFrame', 'getComputedStyle']) {
    globalThis[name] = dom.window[name].bind(dom.window);
}
// jsdom has no layout engine; components only need these to exist.
class NoopObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}
globalThis.ResizeObserver ??= NoopObserver;
globalThis.IntersectionObserver ??= NoopObserver;

export const root = () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    return el;
};
