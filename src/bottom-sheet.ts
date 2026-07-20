import { sanitizeHtml } from './utils.js';
import { ListenerGroup } from './listeners.js';

/** Options for configuring a BottomSheet instance. */
interface BottomSheetOptions {
    content: string;
    header?: string;
    footer?: string;
    closeable?: boolean;
    snapHeight?: 'auto' | 'half' | 'full';
    onClose?: () => void;
}

/** Slide-up sheet that attaches to the bottom of the viewport. */
class BottomSheet {
    private readonly content: string;
    private readonly header?: string;
    private readonly footer?: string;
    private readonly closeable: boolean;
    private snapHeight: 'auto' | 'half' | 'full';
    private readonly onClose?: () => void;

    private wrapper: HTMLElement | null = null;
    private sheet: HTMLElement | null = null;
    private listeners: ListenerGroup | null = null;

    private dragStartY = 0;
    private currentDragY = 0;
    private isDragging = false;
    private isDesktop = false;

    public constructor(options: BottomSheetOptions) {
        this.content = options.content;
        this.header = options.header;
        this.footer = options.footer;
        this.closeable = options.closeable ?? true;
        this.snapHeight = options.snapHeight ?? 'auto';
        this.onClose = options.onClose;
    }

    public show(): void {
        this.hide();

        const wrapper = document.createElement('div');
        wrapper.className = 'bottom-sheet-wrapper';
        wrapper.innerHTML = this.buildTemplate();
        document.body.append(wrapper);

        this.wrapper = wrapper;
        this.sheet = wrapper.querySelector('.bottom-sheet');
        this.listeners = new ListenerGroup();
        const sig = { signal: this.listeners.signal };

        if (this.closeable) {
            wrapper.querySelector('.bottom-sheet-backdrop')?.addEventListener('click', () => this.hide(), sig);
            document.addEventListener(
                'keydown',
                (e: KeyboardEvent) => {
                    if (e.key === 'Escape') this.hide();
                },
                sig,
            );
            wrapper.querySelector('.close')?.addEventListener('click', () => this.hide(), sig);
        }

        const handle = wrapper.querySelector<HTMLElement>('.bottom-sheet-handle');
        if (handle) {
            handle.addEventListener('touchstart', (e: TouchEvent) => this.handleTouchStart(e), { ...sig, passive: true });
            handle.addEventListener('touchmove', (e: TouchEvent) => this.handleTouchMove(e), { ...sig, passive: false });
            handle.addEventListener('touchend', () => this.handleTouchEnd(), sig);
        }

        const body = wrapper.querySelector<HTMLElement>('.bottom-sheet-body');
        if (body) {
            this.updateScrollMask(body);
            body.addEventListener('scroll', () => this.updateScrollMask(body!), sig);
        }

        document.body.style.overflow = 'hidden';

        requestAnimationFrame(() => {
            wrapper.classList.add('is-visible');
        });
    }

    public hide(): void {
        if (!this.wrapper) return;

        this.listeners?.destroy();
        this.listeners = null;

        document.body.style.overflow = '';
        this.wrapper.classList.remove('is-visible');

        const wrapper = this.wrapper;
        this.wrapper = null;
        this.sheet = null;

        setTimeout(() => {
            wrapper.remove();
            this.onClose?.();
        }, 420);
    }

    public snapTo(height: 'auto' | 'half' | 'full'): void {
        if (!this.sheet) return;

        this.sheet.classList.remove(`snap-${this.snapHeight}`);
        this.snapHeight = height;

        if (height !== 'auto') {
            this.sheet.classList.add(`snap-${height}`);
        }
    }

    private handleTouchStart(e: TouchEvent): void {
        this.dragStartY = e.touches[0].clientY;
        this.currentDragY = 0;
        this.isDragging = true;
        this.isDesktop = window.innerWidth >= 768;

        if (this.sheet) {
            this.sheet.style.transition = 'none';
        }
    }

    private handleTouchMove(e: TouchEvent): void {
        if (!this.isDragging || !this.sheet) return;

        const deltaY = e.touches[0].clientY - this.dragStartY;

        // Rubber-band resistance going upward
        if (deltaY < 0) {
            const resistance = Math.log(1 + Math.abs(deltaY)) * 4;
            this.currentDragY = -resistance;
        } else {
            this.currentDragY = deltaY;
        }

        const translateX = this.isDesktop ? '-50%' : '0';
        this.sheet.style.transform = `translateX(${translateX}) translateY(${this.currentDragY}px)`;
        e.preventDefault();
    }

    private handleTouchEnd(): void {
        if (!this.isDragging || !this.sheet) return;
        this.isDragging = false;

        const threshold = this.sheet.offsetHeight * 0.3;

        if (this.currentDragY > threshold) {
            this.hide();
        } else {
            this.sheet.style.transition = '';
            this.sheet.style.transform = '';
        }
    }

    private updateScrollMask(body: HTMLElement): void {
        const canScroll = body.scrollHeight > body.clientHeight;
        const atBottom = body.scrollTop + body.clientHeight >= body.scrollHeight - 4;
        body.classList.toggle('is-scrollable', canScroll && !atBottom);
    }

    private buildTemplate(): string {
        const snapClass = this.snapHeight !== 'auto' ? ` snap-${this.snapHeight}` : '';

        const closeButton = this.closeable ? `<div class="icon icon-close close"></div>` : '';

        const headerHtml =
            this.header !== undefined
                ? `<div class="bottom-sheet-header has-divider">
                <span class="title">${sanitizeHtml(this.header)}</span>
                ${closeButton}
               </div>`
                : '';

        const footerHtml = this.footer !== undefined ? `<div class="bottom-sheet-footer">${sanitizeHtml(this.footer)}</div>` : '';

        return `
            <div class="bottom-sheet${snapClass}">
                <div class="bottom-sheet-handle" role="button" aria-label="Drag to dismiss"></div>
                ${headerHtml}
                <div class="bottom-sheet-body">${sanitizeHtml(this.content)}</div>
                ${footerHtml}
            </div>
            <div class="bottom-sheet-backdrop"></div>
        `;
    }

    public isVisible(): boolean {
        return this.wrapper !== null;
    }

    public destroy(): void {
        this.hide();
    }
}

export { BottomSheet, type BottomSheetOptions };
