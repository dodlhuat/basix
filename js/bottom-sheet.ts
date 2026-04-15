import { sanitizeHtml } from './utils.js';

interface BottomSheetOptions {
    content: string;
    header?: string;
    footer?: string;
    closeable?: boolean;
    snapHeight?: 'auto' | 'half' | 'full';
    onClose?: () => void;
}

class BottomSheet {
    private readonly content: string;
    private readonly header?: string;
    private readonly footer?: string;
    private readonly closeable: boolean;
    private snapHeight: 'auto' | 'half' | 'full';
    private readonly onClose?: () => void;

    private wrapper: HTMLElement | null = null;
    private sheet: HTMLElement | null = null;
    private handle: HTMLElement | null = null;
    private body: HTMLElement | null = null;

    // Touch drag state
    private dragStartY = 0;
    private currentDragY = 0;
    private isDragging = false;

    constructor(options: BottomSheetOptions) {
        this.content = options.content;
        this.header = options.header;
        this.footer = options.footer;
        this.closeable = options.closeable ?? true;
        this.snapHeight = options.snapHeight ?? 'auto';
        this.onClose = options.onClose;

        this.hide = this.hide.bind(this);
        this.handleEscape = this.handleEscape.bind(this);
        this.handleBackdropClick = this.handleBackdropClick.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
    }

    public show(): void {
        this.hide();

        const wrapper = document.createElement('div');
        wrapper.className = 'bottom-sheet-wrapper';
        wrapper.innerHTML = this.buildTemplate();
        document.body.append(wrapper);

        this.wrapper = wrapper;
        this.sheet = wrapper.querySelector('.bottom-sheet');
        this.handle = wrapper.querySelector('.bottom-sheet-handle');
        this.body = wrapper.querySelector('.bottom-sheet-body');

        if (this.closeable) {
            const backdrop = wrapper.querySelector('.bottom-sheet-backdrop');
            backdrop?.addEventListener('click', this.handleBackdropClick);
            document.addEventListener('keydown', this.handleEscape);

            const closeBtn = wrapper.querySelector('.close');
            closeBtn?.addEventListener('click', this.hide);
        }

        if (this.handle) {
            this.handle.addEventListener('touchstart', this.handleTouchStart, { passive: true });
            this.handle.addEventListener('touchmove', this.handleTouchMove, { passive: false });
            this.handle.addEventListener('touchend', this.handleTouchEnd);
        }

        if (this.body) {
            this.updateScrollMask();
            this.body.addEventListener('scroll', () => this.updateScrollMask());
        }

        document.body.style.overflow = 'hidden';

        requestAnimationFrame(() => {
            wrapper.classList.add('is-visible');
        });
    }

    public hide(): void {
        if (!this.wrapper) return;

        const backdrop = this.wrapper.querySelector('.bottom-sheet-backdrop');
        backdrop?.removeEventListener('click', this.handleBackdropClick);
        document.removeEventListener('keydown', this.handleEscape);

        if (this.handle) {
            this.handle.removeEventListener('touchstart', this.handleTouchStart);
            this.handle.removeEventListener('touchmove', this.handleTouchMove);
            this.handle.removeEventListener('touchend', this.handleTouchEnd);
        }

        document.body.style.overflow = '';
        this.wrapper.classList.remove('is-visible');

        const wrapper = this.wrapper;
        this.wrapper = null;
        this.sheet = null;
        this.handle = null;
        this.body = null;

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

    private handleEscape(e: KeyboardEvent): void {
        if (e.key === 'Escape') this.hide();
    }

    private handleBackdropClick(e: Event): void {
        if ((e.target as HTMLElement)?.classList.contains('bottom-sheet-backdrop')) {
            this.hide();
        }
    }

    private handleTouchStart(e: TouchEvent): void {
        this.dragStartY = e.touches[0].clientY;
        this.currentDragY = 0;
        this.isDragging = true;

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

        const isDesktop = window.innerWidth >= 768;
        const translateX = isDesktop ? '-50%' : '0';
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
            // Spring back
            this.sheet.style.transition = '';
            this.sheet.style.transform = '';
        }
    }

    private updateScrollMask(): void {
        if (!this.body) return;
        const canScroll = this.body.scrollHeight > this.body.clientHeight;
        const atBottom = this.body.scrollTop + this.body.clientHeight >= this.body.scrollHeight - 4;
        this.body.classList.toggle('is-scrollable', canScroll && !atBottom);
    }

    private buildTemplate(): string {
        const snapClass = this.snapHeight !== 'auto' ? ` snap-${this.snapHeight}` : '';

        const closeButton = this.closeable
            ? `<div class="icon icon-close close"></div>`
            : '';

        const headerHtml = this.header !== undefined
            ? `<div class="bottom-sheet-header has-divider">
                <span class="title">${sanitizeHtml(this.header)}</span>
                ${closeButton}
               </div>`
            : '';

        const footerHtml = this.footer !== undefined
            ? `<div class="bottom-sheet-footer">${sanitizeHtml(this.footer)}</div>`
            : '';

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
        return this.wrapper !== null && document.body.contains(this.wrapper);
    }

    public destroy(): void {
        this.hide();
    }
}

export { BottomSheet, type BottomSheetOptions };
