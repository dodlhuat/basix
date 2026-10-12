import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><body><div id="root"></div></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.DOMParser = dom.window.DOMParser;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.AbortController = dom.window.AbortController;

export const root = () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    return el;
};
