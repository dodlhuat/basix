interface ScrollOptions {
    behavior?: ScrollBehavior;
    offset?: number;
    block?: ScrollLogicalPosition;
}

class Scroll {
    static to(target: string | Element, options: ScrollOptions = {}): void {
        const fixed_header = document.querySelector('.main-header') as HTMLElement | null;
        const offset = fixed_header ? fixed_header.offsetHeight : 0;

        const settings: Required<ScrollOptions> = {
            behavior: "smooth",
            offset: offset,
            block: "start",
            ...options
        };

        let el: Element | null = target instanceof Element ? target : null;

        if (typeof target === "string") {
            el = document.querySelector(target);
        }

        if (!el) return;

        const rect = el.getBoundingClientRect();
        const scrollTop = window.scrollY;
        const offsetTop = rect.top + scrollTop - settings.offset;

        window.scrollTo({
            top: offsetTop,
            behavior: settings.behavior
        });
    }
}

declare global {
    interface Window {
        Scroll: typeof Scroll;
    }
}

window.Scroll = Scroll;

export default Scroll;