class Scroll {
    static to(target, options = {}) {
        const fixed_header = document.querySelector('.main-header');
        const offset = fixed_header ? fixed_header.offsetHeight : 0;
        const settings = Object.assign(
            {
                behavior: "smooth",
                offset: offset,        // supports fixed header offset
                block: "start"
            },
            options
        );

        let el = target;

        // if a selector string is passed, convert it to an element
        if (typeof target === "string") {
            el = document.querySelector(target);
        }

        if (!el) return;

        const rect = el.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const offsetTop = rect.top + scrollTop - settings.offset;

        window.scrollTo({
            top: offsetTop,
            behavior: settings.behavior
        });
    }
}

window.Scroll = Scroll;