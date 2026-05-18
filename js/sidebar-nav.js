/** Collapsible sidebar navigation with backdrop, swipe gestures, and responsive breakpoint support. */
class SidebarNav {
    nav;
    backdrop;
    toggleBtn;
    closeBtn = null;
    opts;
    _touchStartX = 0;
    _touchStartY = 0;
    _onToggle;
    _onBackdrop;
    _onResize;
    _onClose;
    _onTouchStart;
    _onTouchEnd;
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
        this._onToggle = () => this.toggle();
        this._onBackdrop = () => this.close();
        this._onResize = () => { if (window.innerWidth > this.opts.breakpoint)
            this.close(); };
        this._onClose = () => this.close();
        this._onTouchStart = (e) => {
            this._touchStartX = e.touches[0].clientX;
            this._touchStartY = e.touches[0].clientY;
        };
        this._onTouchEnd = (e) => {
            if (window.innerWidth > this.opts.breakpoint)
                return;
            const dx = e.changedTouches[0].clientX - this._touchStartX;
            const dy = e.changedTouches[0].clientY - this._touchStartY;
            if (Math.abs(dx) < Math.abs(dy))
                return;
            if (!this.isOpen() && this._touchStartX <= this.opts.swipeEdge && dx >= this.opts.swipeThreshold) {
                this.open();
            }
            else if (this.isOpen() && dx <= -this.opts.swipeThreshold) {
                this.close();
            }
        };
        this.toggleBtn?.addEventListener('click', this._onToggle);
        this.backdrop?.addEventListener('click', this._onBackdrop);
        window.addEventListener('resize', this._onResize);
        document.addEventListener('touchstart', this._onTouchStart, { passive: true });
        document.addEventListener('touchend', this._onTouchEnd, { passive: true });
        this.closeBtn = document.createElement('button');
        this.closeBtn.className = 'sidebar-close';
        this.closeBtn.setAttribute('aria-label', 'Close navigation');
        this.closeBtn.innerHTML = '<div class="icon icon-close"></div>';
        this.closeBtn.addEventListener('click', this._onClose);
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
        this.toggleBtn?.removeEventListener('click', this._onToggle);
        this.backdrop?.removeEventListener('click', this._onBackdrop);
        window.removeEventListener('resize', this._onResize);
        this.closeBtn?.removeEventListener('click', this._onClose);
        this.closeBtn?.remove();
        document.removeEventListener('touchstart', this._onTouchStart);
        document.removeEventListener('touchend', this._onTouchEnd);
    }
}
export { SidebarNav };
