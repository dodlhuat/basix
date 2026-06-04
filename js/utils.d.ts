interface Utils {
    ready(fn: () => void): void;
    value(element: HTMLElement): string;
    text(element: HTMLElement): string;
    attribute(element: HTMLElement, attribute: string): string | undefined;
    isList(element: HTMLElement | NodeList): boolean;
    isHidden(element: HTMLElement): boolean;
}
declare const utils: Utils;
declare function escapeHtml(text: string): string;
declare function sanitizeHtml(html: string): string;
export { utils, escapeHtml, sanitizeHtml };
