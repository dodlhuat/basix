interface ScrollOptions {
    behavior?: ScrollBehavior;
    offset?: number;
    block?: ScrollLogicalPosition;
}
declare class Scroll {
    static to(target: string | Element, options?: ScrollOptions): void;
}
declare global {
    interface Window {
        Scroll: typeof Scroll;
    }
}
export { Scroll };
export type { ScrollOptions };
