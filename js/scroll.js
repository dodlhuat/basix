class Scroll {
    static to(target, options = {}) {
        const fixedHeader = document.querySelector('.main-header');
        const offset = fixedHeader ? fixedHeader.offsetHeight : 0;
        const settings = {
            behavior: 'smooth',
            offset,
            block: 'start',
            ...options,
        };
        const el = typeof target === 'string' ? document.querySelector(target) : target;
        if (!el)
            return;
        const rect = el.getBoundingClientRect();
        const scrollTop = window.scrollY;
        const offsetTop = rect.top + scrollTop - settings.offset;
        window.scrollTo({
            top: offsetTop,
            behavior: settings.behavior,
        });
    }
}
window.Scroll = Scroll;
export { Scroll };
