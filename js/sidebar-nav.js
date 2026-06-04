class SidebarNav {
    nav;
    backdrop;
    toggleBtn;
    closeBtn = null;
    opts;
    touchStartX = 0;
    touchStartY = 0;
    abortController = new AbortController();
    constructor(containerOrSelector, options = {}) {
        const container = typeof containerOrSelector === 'string'
            ? document.querySelector(containerOrSelector)
            : containerOrSelector;
        this.opts = {
            toggleSelector: options.toggleSelector ?? '.sidebar-toggle',
            breakpoint: options.breakpoint ?? 768,
            swipeThreshold: options.swipeThreshold ?? 60,
            swipeEdge: options.swipeEdge ?? 20,
        };
        this.nav = container?.querySelector('.sidebar-nav') ?? null;
        this.backdrop = container?.querySelector('.sidebar-backdrop') ?? null;
        this.toggleBtn = document.querySelector(this.opts.toggleSelector);
        const sig = { signal: this.abortController.signal };
        this.toggleBtn?.addEventListener('click', () => this.toggle(), sig);
        this.backdrop?.addEventListener('click', () => this.close(), sig);
        window.addEventListener('resize', () => {
            if (window.innerWidth > this.opts.breakpoint)
                this.close();
        }, sig);
        document.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        }, { passive: true, signal: this.abortController.signal });
        document.addEventListener('touchend', (e) => {
            if (window.innerWidth > this.opts.breakpoint)
                return;
            const dx = e.changedTouches[0].clientX - this.touchStartX;
            const dy = e.changedTouches[0].clientY - this.touchStartY;
            if (Math.abs(dx) < Math.abs(dy))
                return;
            if (!this.isOpen() && this.touchStartX <= this.opts.swipeEdge && dx >= this.opts.swipeThreshold) {
                this.open();
            }
            else if (this.isOpen() && dx <= -this.opts.swipeThreshold) {
                this.close();
            }
        }, { passive: true, signal: this.abortController.signal });
        this.closeBtn = document.createElement('button');
        this.closeBtn.className = 'sidebar-close';
        this.closeBtn.setAttribute('aria-label', 'Close navigation');
        this.closeBtn.innerHTML = '<div class="icon icon-close"></div>';
        this.closeBtn.addEventListener('click', () => this.close(), sig);
        this.nav?.append(this.closeBtn);
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
        this.abortController.abort();
        this.closeBtn?.remove();
    }
}
export { SidebarNav };
