interface SidebarNavOptions {
    /** Selector for the toggle button. Default: '.sidebar-toggle' */
    toggleSelector?: string;
    /** Breakpoint (px) above which the sidebar is always visible. Default: 768 */
    breakpoint?: number;
}

class SidebarNav {
    private nav: HTMLElement | null;
    private backdrop: HTMLElement | null;
    private toggleBtn: HTMLElement | null;
    private opts: Required<SidebarNavOptions>;
    private _onToggle: () => void;
    private _onBackdrop: () => void;
    private _onResize: () => void;

    constructor(containerOrSelector: string | HTMLElement, options: SidebarNavOptions = {}) {
        const container: HTMLElement | null =
            typeof containerOrSelector === 'string'
                ? (document.querySelector(containerOrSelector) as HTMLElement | null)
                : containerOrSelector;

        this.opts = {
            toggleSelector: options.toggleSelector ?? '.sidebar-toggle',
            breakpoint: options.breakpoint ?? 768,
        };

        this.nav      = container?.querySelector('.sidebar-nav')      ?? null;
        this.backdrop = container?.querySelector('.sidebar-backdrop')  ?? null;
        this.toggleBtn = document.querySelector(this.opts.toggleSelector);

        this._onToggle  = () => this.toggle();
        this._onBackdrop = () => this.close();
        this._onResize  = () => { if (window.innerWidth > this.opts.breakpoint) this.close(); };

        this.toggleBtn?.addEventListener('click', this._onToggle);
        this.backdrop?.addEventListener('click', this._onBackdrop);
        window.addEventListener('resize', this._onResize);
    }

    open(): void {
        this.nav?.classList.add('is-open');
        this.backdrop?.classList.add('is-visible');
    }

    close(): void {
        this.nav?.classList.remove('is-open');
        this.backdrop?.classList.remove('is-visible');
    }

    toggle(): void {
        this.nav?.classList.contains('is-open') ? this.close() : this.open();
    }

    isOpen(): boolean {
        return this.nav?.classList.contains('is-open') ?? false;
    }

    destroy(): void {
        this.toggleBtn?.removeEventListener('click', this._onToggle);
        this.backdrop?.removeEventListener('click', this._onBackdrop);
        window.removeEventListener('resize', this._onResize);
    }
}

export { SidebarNav, SidebarNavOptions };
