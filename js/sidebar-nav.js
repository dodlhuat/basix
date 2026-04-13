class SidebarNav {
    constructor(containerOrSelector, options = {}) {
        const container = typeof containerOrSelector === 'string'
            ? document.querySelector(containerOrSelector)
            : containerOrSelector;
        this.opts = {
            toggleSelector: options.toggleSelector ?? '.sidebar-toggle',
            breakpoint: options.breakpoint ?? 768,
        };
        this.nav = container?.querySelector('.sidebar-nav') ?? null;
        this.backdrop = container?.querySelector('.sidebar-backdrop') ?? null;
        this.toggleBtn = document.querySelector(this.opts.toggleSelector);
        this._onToggle = () => this.toggle();
        this._onBackdrop = () => this.close();
        this._onResize = () => { if (window.innerWidth > this.opts.breakpoint)
            this.close(); };
        this.toggleBtn?.addEventListener('click', this._onToggle);
        this.backdrop?.addEventListener('click', this._onBackdrop);
        window.addEventListener('resize', this._onResize);
    }
    open() {
        this.nav?.classList.add('is-open');
        this.backdrop?.classList.add('is-visible');
    }
    close() {
        this.nav?.classList.remove('is-open');
        this.backdrop?.classList.remove('is-visible');
    }
    toggle() {
        this.nav?.classList.contains('is-open') ? this.close() : this.open();
    }
    isOpen() {
        return this.nav?.classList.contains('is-open') ?? false;
    }
    destroy() {
        this.toggleBtn?.removeEventListener('click', this._onToggle);
        this.backdrop?.removeEventListener('click', this._onBackdrop);
        window.removeEventListener('resize', this._onResize);
    }
}
export { SidebarNav };
