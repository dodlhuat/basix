import { computePosition } from './position.js';
import type { Placement } from './position.js';
import { sanitizeHtml } from './utils.js';

type PopoverPlacement = Placement | 'auto';
type PopoverAlign     = 'start' | 'center' | 'end';
type PopoverTrigger   = 'click' | 'hover';

interface PopoverOptions {
    content:              string;
    placement?:           PopoverPlacement;
    align?:               PopoverAlign;
    offset?:              number;
    arrow?:               boolean;
    triggerMode?:         PopoverTrigger;
    closeOnOutsideClick?: boolean;
    closeOnEscape?:       boolean;
    className?:           string;
    onOpen?:              () => void;
    onClose?:             () => void;
}

// Must match $arrow in popover.scss
const ARROW_SIZE = 6;

class Popover {
    private static openPopovers: Set<Popover> = new Set();
    private static idCounter = 0;

    private readonly trigger: HTMLElement;
    private readonly opts: Required<PopoverOptions>;
    private popoverEl: HTMLElement | null = null;
    private _isOpen = false;
    private hoverTimer: number | null = null;

    constructor(triggerEl: HTMLElement | string, options: PopoverOptions) {
        const el = typeof triggerEl === 'string'
            ? document.querySelector<HTMLElement>(triggerEl)
            : triggerEl;
        if (!el) throw new Error('Popover: trigger element not found');

        this.trigger = el;
        this.opts = {
            content:              options.content,
            placement:            options.placement            ?? 'bottom',
            align:                options.align                ?? 'center',
            offset:               options.offset               ?? 8,
            arrow:                options.arrow                ?? true,
            triggerMode:          options.triggerMode          ?? 'click',
            closeOnOutsideClick:  options.closeOnOutsideClick  ?? true,
            closeOnEscape:        options.closeOnEscape        ?? true,
            className:            options.className            ?? '',
            onOpen:               options.onOpen               ?? (() => {}),
            onClose:              options.onClose              ?? (() => {}),
        };

        this.attachTrigger();
    }

    // ── Public API ─────────────────────────────────────────────────────────────

    get isOpen(): boolean { return this._isOpen; }

    open(): void {
        if (this._isOpen) return;
        if (this.opts.triggerMode === 'click') Popover.closeAll();

        this.popoverEl = this.buildEl();
        document.body.appendChild(this.popoverEl);
        this.reposition();

        requestAnimationFrame(() => {
            this.popoverEl?.classList.add('is-open');
            this._isOpen = true;
            Popover.openPopovers.add(this);
            this.opts.onOpen();

            if (this.opts.closeOnOutsideClick)
                document.addEventListener('pointerdown', this.onOutsideClick, { capture: true });
            if (this.opts.closeOnEscape)
                document.addEventListener('keydown', this.onEscape);
        });
    }

    close(): void {
        if (!this._isOpen || !this.popoverEl) return;

        this.popoverEl.classList.remove('is-open');
        this._isOpen = false;
        Popover.openPopovers.delete(this);
        this.opts.onClose();

        document.removeEventListener('pointerdown', this.onOutsideClick, { capture: true });
        document.removeEventListener('keydown', this.onEscape);

        this.trigger.removeAttribute('aria-expanded');
        this.trigger.removeAttribute('aria-controls');

        const el = this.popoverEl;
        setTimeout(() => el.remove(), 200);
        this.popoverEl = null;
    }

    toggle(): void { this._isOpen ? this.close() : this.open(); }

    destroy(): void {
        this.close();
        this.detachTrigger();
    }

    static closeAll(): void {
        Popover.openPopovers.forEach(p => p.close());
    }

    /** Declarative init — reads [data-popover="#selector"] attributes */
    static initAll(): void {
        document.querySelectorAll<HTMLElement>('[data-popover]').forEach(trigger => {
            const sel = trigger.getAttribute('data-popover');
            if (!sel) return;
            const contentEl = document.querySelector(sel);
            if (!contentEl) return;

            new Popover(trigger, {
                content:    (contentEl as HTMLElement).innerHTML,
                placement:  (trigger.getAttribute('data-popover-placement') as PopoverPlacement) ?? 'bottom',
                align:      (trigger.getAttribute('data-popover-align')     as PopoverAlign)     ?? 'center',
                triggerMode:(trigger.getAttribute('data-popover-trigger')   as PopoverTrigger)   ?? 'click',
                arrow:       trigger.getAttribute('data-popover-arrow')     !== 'false',
            });
        });
    }

    // ── Build ──────────────────────────────────────────────────────────────────

    private buildEl(): HTMLElement {
        const id = `popover-${++Popover.idCounter}`;
        const el  = document.createElement('div');
        el.className   = ['popover', this.opts.className].filter(Boolean).join(' ');
        el.id          = id;
        el.setAttribute('role', 'dialog');
        el.setAttribute('data-arrow', String(this.opts.arrow));

        // Wrap plain content in .popover-body so it gets proper padding.
        // Skip wrapping when content already uses structured popover elements.
        const hasStructure = /class="popover-(header|body|footer|menu)/.test(this.opts.content);
        const safeContent = sanitizeHtml(this.opts.content);
        el.innerHTML = hasStructure
            ? safeContent
            : `<div class="popover-body">${safeContent}</div>`;

        this.trigger.setAttribute('aria-expanded', 'true');
        this.trigger.setAttribute('aria-controls', id);

        return el;
    }

    // ── Positioning ────────────────────────────────────────────────────────────

    private reposition(): void {
        if (!this.popoverEl) return;

        const { left, top, placement, arrowOffset } = computePosition(
            this.trigger.getBoundingClientRect(),
            this.popoverEl.getBoundingClientRect(),
            {
                placement: this.opts.placement,
                align:     this.opts.align,
                offset:    this.opts.offset,
                arrowSize: this.opts.arrow ? ARROW_SIZE : undefined,
            }
        );

        if (arrowOffset !== undefined)
            this.popoverEl.style.setProperty('--popover-arrow-offset', `${arrowOffset}px`);

        this.popoverEl.setAttribute('data-placement', placement);
        this.popoverEl.setAttribute('data-align', this.opts.align);
        this.popoverEl.style.left = `${left}px`;
        this.popoverEl.style.top  = `${top}px`;
    }

    // ── Event handlers ─────────────────────────────────────────────────────────

    private onClick = (): void => { this.toggle(); };

    private onMouseEnter = (): void => {
        if (this.hoverTimer !== null) clearTimeout(this.hoverTimer);
        this.open();
    };

    private onMouseLeave = (): void => {
        this.hoverTimer = window.setTimeout(() => this.close(), 120);
    };

    private onOutsideClick = (e: Event): void => {
        const t = e.target as Node;
        if (!this.popoverEl?.contains(t) && !this.trigger.contains(t)) this.close();
    };

    private onEscape = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') this.close();
    };

    private attachTrigger(): void {
        if (this.opts.triggerMode === 'click') {
            this.trigger.addEventListener('click', this.onClick);
        } else {
            this.trigger.addEventListener('mouseenter', this.onMouseEnter);
            this.trigger.addEventListener('mouseleave', this.onMouseLeave);
        }
    }

    private detachTrigger(): void {
        this.trigger.removeEventListener('click', this.onClick);
        this.trigger.removeEventListener('mouseenter', this.onMouseEnter);
        this.trigger.removeEventListener('mouseleave', this.onMouseLeave);
    }
}

export { Popover };
export type { PopoverOptions, PopoverPlacement, PopoverAlign, PopoverTrigger };
