import { sanitizeHtml } from './utils.js';
class BottomSheet {
    constructor(options) {
        this.wrapper = null;
        this.sheet = null;
        this.handle = null;
        this.body = null;
        // Touch drag state
        this.dragStartY = 0;
        this.currentDragY = 0;
        this.isDragging = false;
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
    show() {
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
    hide() {
        if (!this.wrapper)
            return;
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
    snapTo(height) {
        if (!this.sheet)
            return;
        this.sheet.classList.remove(`snap-${this.snapHeight}`);
        this.snapHeight = height;
        if (height !== 'auto') {
            this.sheet.classList.add(`snap-${height}`);
        }
    }
    handleEscape(e) {
        if (e.key === 'Escape')
            this.hide();
    }
    handleBackdropClick(e) {
        if (e.target?.classList.contains('bottom-sheet-backdrop')) {
            this.hide();
        }
    }
    handleTouchStart(e) {
        this.dragStartY = e.touches[0].clientY;
        this.currentDragY = 0;
        this.isDragging = true;
        if (this.sheet) {
            this.sheet.style.transition = 'none';
        }
    }
    handleTouchMove(e) {
        if (!this.isDragging || !this.sheet)
            return;
        const deltaY = e.touches[0].clientY - this.dragStartY;
        // Rubber-band resistance going upward
        if (deltaY < 0) {
            const resistance = Math.log(1 + Math.abs(deltaY)) * 4;
            this.currentDragY = -resistance;
        }
        else {
            this.currentDragY = deltaY;
        }
        const isDesktop = window.innerWidth >= 768;
        const translateX = isDesktop ? '-50%' : '0';
        this.sheet.style.transform = `translateX(${translateX}) translateY(${this.currentDragY}px)`;
        e.preventDefault();
    }
    handleTouchEnd() {
        if (!this.isDragging || !this.sheet)
            return;
        this.isDragging = false;
        const threshold = this.sheet.offsetHeight * 0.3;
        if (this.currentDragY > threshold) {
            this.hide();
        }
        else {
            // Spring back
            this.sheet.style.transition = '';
            this.sheet.style.transform = '';
        }
    }
    updateScrollMask() {
        if (!this.body)
            return;
        const canScroll = this.body.scrollHeight > this.body.clientHeight;
        const atBottom = this.body.scrollTop + this.body.clientHeight >= this.body.scrollHeight - 4;
        this.body.classList.toggle('is-scrollable', canScroll && !atBottom);
    }
    buildTemplate() {
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
    isVisible() {
        return this.wrapper !== null && document.body.contains(this.wrapper);
    }
    destroy() {
        this.hide();
    }
}
export { BottomSheet };
