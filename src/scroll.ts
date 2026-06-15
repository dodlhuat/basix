/** Options for the Scroll.to() utility. */
interface ScrollOptions {
    behavior?: ScrollBehavior;
    offset?: number;
    block?: ScrollLogicalPosition;
}

/** Static utility for smooth-scrolling to a target element with header offset support. */
class Scroll {
    public static to(target: string | Element, options: ScrollOptions = {}): void {
        const fixedHeader = document.querySelector<HTMLElement>('.main-header');
        const offset = fixedHeader ? fixedHeader.offsetHeight : 0;

        const settings: Required<ScrollOptions> = {
            behavior: 'smooth',
            offset,
            block: 'start',
            ...options,
        };

        const el: Element | null = typeof target === 'string' ? document.querySelector(target) : target;

        if (!el) return;

        const rect = el.getBoundingClientRect();
        const scrollTop = window.scrollY;
        const offsetTop = rect.top + scrollTop - settings.offset;

        window.scrollTo({
            top: offsetTop,
            behavior: settings.behavior,
        });
    }
}

declare global {
    interface Window {
        Scroll: typeof Scroll;
    }
}

window.Scroll = Scroll;

export { Scroll };
export type { ScrollOptions };
