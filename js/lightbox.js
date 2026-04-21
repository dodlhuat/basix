class Lightbox {
    constructor(options) {
        this.wrapper = null;
        this.imgEl = null;
        this.captionEl = null;
        this.counterEl = null;
        this.isZoomed = false;
        this.abortController = new AbortController();
        if (options.images && options.images.length > 0) {
            this.images = options.images;
        }
        else {
            this.images = [{ src: options.src ?? '', alt: options.alt, caption: options.caption }];
        }
        this.currentIndex = options.startIndex ?? 0;
        this.closeable = options.closeable ?? true;
        this.onOpen = options.onOpen;
        this.onClose = options.onClose;
        this.hide = this.hide.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
        this.handleBackgroundClick = this.handleBackgroundClick.bind(this);
    }
    show() {
        this.hide();
        const wrapper = document.createElement('div');
        wrapper.className = 'lightbox-wrapper';
        wrapper.setAttribute('role', 'dialog');
        wrapper.setAttribute('aria-modal', 'true');
        wrapper.setAttribute('aria-label', 'Image lightbox');
        wrapper.setAttribute('tabindex', '-1');
        wrapper.innerHTML = this.buildTemplate();
        document.body.append(wrapper);
        this.wrapper = wrapper;
        this.imgEl = wrapper.querySelector('.lightbox-img');
        this.captionEl = wrapper.querySelector('.lightbox-caption');
        this.counterEl = wrapper.querySelector('.lightbox-counter');
        const sig = { signal: this.abortController.signal };
        if (this.closeable) {
            wrapper.querySelector('.lightbox-close')?.addEventListener('click', this.hide, sig);
            wrapper.querySelector('.lightbox-background')?.addEventListener('click', this.handleBackgroundClick, sig);
        }
        document.addEventListener('keydown', this.handleKeydown, sig);
        if (this.images.length > 1) {
            wrapper.querySelector('.lightbox-prev')?.addEventListener('click', () => this.prev(), sig);
            wrapper.querySelector('.lightbox-next')?.addEventListener('click', () => this.next(), sig);
        }
        wrapper.querySelector('.lightbox-img-wrap')?.addEventListener('click', () => this.toggleZoom(), sig);
        this.addTouchSupport();
        document.body.style.overflow = 'hidden';
        this.loadImage(this.currentIndex);
        this.updateNav();
        requestAnimationFrame(() => {
            wrapper.classList.add('is-visible');
            wrapper.focus();
        });
        this.onOpen?.();
    }
    hide() {
        const wrapper = this.wrapper;
        if (!wrapper)
            return;
        this.abortController.abort();
        this.abortController = new AbortController();
        document.body.style.overflow = '';
        wrapper.classList.remove('is-visible');
        setTimeout(() => {
            wrapper.remove();
            this.wrapper = null;
            this.imgEl = null;
            this.captionEl = null;
            this.counterEl = null;
            this.isZoomed = false;
            this.onClose?.();
        }, 300);
    }
    next() {
        if (this.images.length <= 1)
            return;
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        this.loadImage(this.currentIndex);
        this.updateNav();
    }
    prev() {
        if (this.images.length <= 1)
            return;
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.loadImage(this.currentIndex);
        this.updateNav();
    }
    isVisible() {
        return this.wrapper !== null && document.body.contains(this.wrapper);
    }
    destroy() {
        this.hide();
    }
    loadImage(index) {
        const wrap = this.wrapper?.querySelector('.lightbox-img-wrap');
        if (!wrap || !this.imgEl)
            return;
        this.isZoomed = false;
        this.imgEl.classList.remove('is-zoomed');
        wrap.classList.remove('is-zoomed', 'is-error');
        wrap.classList.add('is-loading');
        this.imgEl.classList.remove('is-loaded');
        const { src, alt, caption } = this.images[index];
        const tempImg = new Image();
        tempImg.onload = () => {
            if (!this.imgEl)
                return;
            this.imgEl.src = src;
            this.imgEl.alt = alt ?? '';
            wrap.classList.remove('is-loading');
            this.imgEl.classList.add('is-loaded');
        };
        tempImg.onerror = () => {
            wrap.classList.remove('is-loading');
            wrap.classList.add('is-error');
        };
        tempImg.src = src;
        if (this.captionEl) {
            if (caption) {
                this.captionEl.textContent = caption;
                this.captionEl.hidden = false;
            }
            else {
                this.captionEl.hidden = true;
            }
        }
        this.preloadAdjacent(index);
    }
    preloadAdjacent(index) {
        if (this.images.length <= 1)
            return;
        const prevIdx = (index - 1 + this.images.length) % this.images.length;
        const nextIdx = (index + 1) % this.images.length;
        [prevIdx, nextIdx].forEach(i => {
            const img = new Image();
            img.src = this.images[i].src;
        });
    }
    updateNav() {
        if (!this.wrapper)
            return;
        const isGallery = this.images.length > 1;
        if (this.counterEl) {
            this.counterEl.textContent = isGallery ? `${this.currentIndex + 1} / ${this.images.length}` : '';
            this.counterEl.hidden = !isGallery;
        }
        const prevBtn = this.wrapper.querySelector('.lightbox-prev');
        const nextBtn = this.wrapper.querySelector('.lightbox-next');
        if (prevBtn)
            prevBtn.hidden = !isGallery;
        if (nextBtn)
            nextBtn.hidden = !isGallery;
    }
    toggleZoom() {
        if (!this.imgEl)
            return;
        this.isZoomed = !this.isZoomed;
        this.imgEl.classList.toggle('is-zoomed', this.isZoomed);
        this.wrapper?.querySelector('.lightbox-img-wrap')?.classList.toggle('is-zoomed', this.isZoomed);
    }
    handleKeydown(e) {
        switch (e.key) {
            case 'Escape':
                if (this.closeable)
                    this.hide();
                break;
            case 'ArrowRight':
                this.next();
                break;
            case 'ArrowLeft':
                this.prev();
                break;
            case 'Tab':
                this.trapFocus(e);
                break;
        }
    }
    trapFocus(e) {
        if (!this.wrapper)
            return;
        const focusable = Array.from(this.wrapper.querySelectorAll('button:not([hidden]), [tabindex]:not([tabindex="-1"]):not([hidden])')).filter(el => el.offsetParent !== null);
        if (focusable.length === 0)
            return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
            if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        }
        else {
            if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }
    handleBackgroundClick(e) {
        if (e.target?.classList.contains('lightbox-background')) {
            this.hide();
        }
    }
    addTouchSupport() {
        const wrap = this.wrapper?.querySelector('.lightbox-img-wrap');
        if (!wrap)
            return;
        let startX = 0;
        let isDragging = false;
        wrap.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
        }, { passive: true, signal: this.abortController.signal });
        wrap.addEventListener('touchend', (e) => {
            if (!isDragging)
                return;
            const deltaX = e.changedTouches[0].clientX - startX;
            if (Math.abs(deltaX) > 50) {
                deltaX < 0 ? this.next() : this.prev();
            }
            isDragging = false;
        }, { signal: this.abortController.signal });
    }
    buildTemplate() {
        return `
            ${this.closeable ? '<button class="lightbox-close" aria-label="Close lightbox"><span class="icon icon-close"></span></button>' : ''}
            <div class="lightbox" role="document">
                <div class="lightbox-img-wrap">
                    <div class="lightbox-spinner"><div class="spinner"></div></div>
                    <img class="lightbox-img" src="" alt="" draggable="false" />
                </div>
                <p class="lightbox-caption" hidden></p>
                <div class="lightbox-counter" hidden></div>
            </div>
            <button class="lightbox-prev" aria-label="Previous image" hidden>
                <span class="icon icon-navigate_before"></span>
            </button>
            <button class="lightbox-next" aria-label="Next image" hidden>
                <span class="icon icon-navigate_next"></span>
            </button>
            <div class="lightbox-background"></div>
        `;
    }
    static bind(selector = '[data-lightbox]') {
        const elements = document.querySelectorAll(selector);
        const groups = new Map();
        elements.forEach(el => {
            const groupKey = el.dataset.lightbox || `__solo__${el.dataset.lightboxId ?? Math.random()}`;
            const src = el instanceof HTMLAnchorElement
                ? el.href
                : el instanceof HTMLImageElement
                    ? el.src
                    : (el.dataset.src ?? '');
            const imgChild = el.querySelector('img');
            const alt = el instanceof HTMLImageElement ? el.alt : (imgChild?.alt ?? '');
            const caption = el.dataset.lightboxCaption;
            if (!groups.has(groupKey))
                groups.set(groupKey, []);
            groups.get(groupKey).push({ el, image: { src, alt, caption } });
        });
        groups.forEach(items => {
            items.forEach(({ el }, idx) => {
                el.style.cursor = 'zoom-in';
                el.addEventListener('click', e => {
                    e.preventDefault();
                    new Lightbox({
                        images: items.map(i => i.image),
                        startIndex: idx,
                    }).show();
                });
            });
        });
    }
}
export { Lightbox };
