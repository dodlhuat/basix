/** Configuration options for a SidebarNav instance. */
interface SidebarNavOptions {
    /** Selector for the toggle button. Default: '.sidebar-toggle' */
    toggleSelector?: string;
    /** Breakpoint (px) above which the sidebar is always visible. Default: 768 */
    breakpoint?: number;
    /** Minimum horizontal swipe distance (px) to trigger open/close. Default: 60 */
    swipeThreshold?: number;
    /** Width of the left-edge zone (px) that triggers open on swipe-right. Default: 20 */
    swipeEdge?: number;
}

/** Collapsible sidebar navigation with backdrop, swipe gestures, and responsive breakpoint support. */
class SidebarNav {
    private nav: HTMLElement | null;
    private backdrop: HTMLElement | null;
    private toggleBtn: HTMLElement | null;
    private closeBtn: HTMLElement | null = null;
    private opts: Required<SidebarNavOptions>;
    private touchStartX = 0;
    private touchStartY = 0;
    private abortController = new AbortController();

    public constructor(containerOrSelector: string | HTMLElement, options: SidebarNavOptions = {}) {
        const container = typeof containerOrSelector === 'string' ? document.querySelector<HTMLElement>(containerOrSelector) : containerOrSelector;

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

        window.addEventListener(
            'resize',
            () => {
                if (window.innerWidth > this.opts.breakpoint) this.close();
            },
            sig,
        );

        document.addEventListener(
            'touchstart',
            (e: TouchEvent) => {
                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;
            },
            { ...sig, passive: true },
        );

        document.addEventListener(
            'touchend',
            (e: TouchEvent) => {
                if (window.innerWidth > this.opts.breakpoint) return;
                const dx = e.changedTouches[0].clientX - this.touchStartX;
                const dy = e.changedTouches[0].clientY - this.touchStartY;
                if (Math.abs(dx) < Math.abs(dy)) return;
                if (!this.isOpen() && this.touchStartX <= this.opts.swipeEdge && dx >= this.opts.swipeThreshold) {
                    this.open();
                } else if (this.isOpen() && dx <= -this.opts.swipeThreshold) {
                    this.close();
                }
            },
            { ...sig, passive: true },
        );

        this.closeBtn = document.createElement('button');
        this.closeBtn.className = 'sidebar-close';
        this.closeBtn.setAttribute('aria-label', 'Close navigation');
        this.closeBtn.innerHTML = '<div class="icon icon-close"></div>';
        this.closeBtn.addEventListener('click', () => this.close(), sig);
        this.nav?.append(this.closeBtn);
    }

    public open(): void {
        this.nav?.classList.add('is-open');
        this.backdrop?.classList.add('is-visible');
    }

    public close(): void {
        this.nav?.classList.remove('is-open');
        this.backdrop?.classList.remove('is-visible');
    }

    public toggle(): void {
        if (this.nav?.classList.contains('is-open')) {
            this.close();
        } else {
            this.open();
        }
    }

    public isOpen(): boolean {
        return this.nav?.classList.contains('is-open') ?? false;
    }

    public destroy(): void {
        this.abortController.abort();
        this.closeBtn?.remove();
    }
}

export { SidebarNav, type SidebarNavOptions };
