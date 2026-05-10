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
declare const utils: Utils;
/**
 * Escape a plain-text string so it is safe to inject into innerHTML.
 * Use this whenever inserting user-controlled strings into HTML templates.
 */
declare function escapeHtml(text: string): string;
/**
 * Sanitize an HTML string by removing dangerous elements and attributes
 * (script, iframe, on* handlers, javascript: hrefs) while preserving safe markup.
 * Use this when a component intentionally accepts rich HTML from callers.
 */
declare function sanitizeHtml(html: string): string;
export { utils, escapeHtml, sanitizeHtml };
