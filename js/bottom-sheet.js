import { sanitizeHtml } from './utils.js';
import { ListenerGroup } from './listeners.js';
class BottomSheet {
    content;
    header;
    footer;
    closeable;
    snapHeight;
    onClose;
    wrapper = null;
    sheet = null;
    listeners = null;
    dragStartY = 0;
    currentDragY = 0;
    isDragging = false;
    isDesktop = false;
    constructor(options) {
        this.content = options.content;
        this.header = options.header;
        this.footer = options.footer;
        this.closeable = options.closeable ?? true;
        this.snapHeight = options.snapHeight ?? 'auto';
        this.onClose = options.onClose;
    }
    show() {
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
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape')
                    this.hide();
            }, sig);
            wrapper.querySelector('.close')?.addEventListener('click', () => this.hide(), sig);
        }
        const handle = wrapper.querySelector('.bottom-sheet-handle');
        if (handle) {
            handle.addEventListener('touchstart', (e) => this.handleTouchStart(e), { ...sig, passive: true });
            handle.addEventListener('touchmove', (e) => this.handleTouchMove(e), { ...sig, passive: false });
            handle.addEventListener('touchend', () => this.handleTouchEnd(), sig);
        }
        const body = wrapper.querySelector('.bottom-sheet-body');
        if (body) {
            this.updateScrollMask(body);
            body.addEventListener('scroll', () => this.updateScrollMask(body), sig);
        }
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => {
            wrapper.classList.add('is-visible');
        });
    }
    hide() {
        if (!this.wrapper)
            return;
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
    snapTo(height) {
        if (!this.sheet)
            return;
        this.sheet.classList.remove(`snap-${this.snapHeight}`);
        this.snapHeight = height;
        if (height !== 'auto') {
            this.sheet.classList.add(`snap-${height}`);
        }
    }
    handleTouchStart(e) {
        this.dragStartY = e.touches[0].clientY;
        this.currentDragY = 0;
        this.isDragging = true;
        this.isDesktop = window.innerWidth >= 768;
        if (this.sheet) {
            this.sheet.style.transition = 'none';
        }
    }
    handleTouchMove(e) {
        if (!this.isDragging || !this.sheet)
            return;
        const deltaY = e.touches[0].clientY - this.dragStartY;
        if (deltaY < 0) {
            const resistance = Math.log(1 + Math.abs(deltaY)) * 4;
            this.currentDragY = -resistance;
        }
        else {
            this.currentDragY = deltaY;
        }
        const translateX = this.isDesktop ? '-50%' : '0';
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
            this.sheet.style.transition = '';
            this.sheet.style.transform = '';
        }
    }
    updateScrollMask(body) {
        const canScroll = body.scrollHeight > body.clientHeight;
        const atBottom = body.scrollTop + body.clientHeight >= body.scrollHeight - 4;
        body.classList.toggle('is-scrollable', canScroll && !atBottom);
    }
    buildTemplate() {
        const snapClass = this.snapHeight !== 'auto' ? ` snap-${this.snapHeight}` : '';
        const closeButton = this.closeable ? `<div class="icon icon-close close"></div>` : '';
        const headerHtml = this.header !== undefined
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
    isVisible() {
        return this.wrapper !== null;
    }
    destroy() {
        this.hide();
    }
}
export { BottomSheet };
