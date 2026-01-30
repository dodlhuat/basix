class Scroll {
    static to(target, options = {}) {
        const fixed_header = document.querySelector('.main-header');
        const offset = fixed_header ? fixed_header.offsetHeight : 0;
        const settings = {
            behavior: "smooth",
            offset: offset,
            block: "start",
            ...options
        };
        let el = target instanceof Element ? target : null;
        if (typeof target === "string") {
            el = document.querySelector(target);
        }
        if (!el)
            return;
        const rect = el.getBoundingClientRect();
        const scrollTop = window.scrollY;
        const offsetTop = rect.top + scrollTop - settings.offset;
        window.scrollTo({
            top: offsetTop,
            behavior: settings.behavior
        });
    }
}
window.Scroll = Scroll;
export { Scroll };
