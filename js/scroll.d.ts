/** Options for the Scroll.to() utility. */
interface ScrollOptions {
    behavior?: ScrollBehavior;
    offset?: number;
    block?: ScrollLogicalPosition;
}
/** Static utility for smooth-scrolling to a target element with header offset support. */
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
