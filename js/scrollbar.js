class Scrollbar {
    static instances = new WeakMap();
    static activeInstance = null;
    static globalListenersInstalled = false;
    static instanceCount = 0;
    static globalListenerAbortController = null;
    container;
    viewport;
    content;
    track;
    thumb;
    MIN_THUMB_HEIGHT;
    ro;
    dragging = false;
    activePointerId = null;
    startPointerY = 0;
    startThumbTop = 0;
    boundPointerMove;
    boundPointerUp;
    boundThumbPointerDown;
    boundTrackClick;
    boundViewportScroll;
    boundUpdateThumb;
    boundContainerWheel;
    constructor(container) {
        this.container = container;
        const elements = this.getRequiredElements(container);
        this.viewport = elements.viewport;
        this.content = elements.content;
        this.track = elements.track;
        this.thumb = elements.thumb;
        this.MIN_THUMB_HEIGHT = this.getMinThumbHeight();
        this.boundPointerMove = this.handlePointerMove.bind(this);
        this.boundPointerUp = this.handlePointerUp.bind(this);
        this.boundThumbPointerDown = this.handleThumbPointerDown.bind(this);
        this.boundTrackClick = this.handleTrackClick.bind(this);
        this.boundViewportScroll = this.updateThumb.bind(this);
        this.boundUpdateThumb = this.updateThumb.bind(this);
        this.boundContainerWheel = this.handleContainerWheel.bind(this);
        this.ro = new ResizeObserver(this.boundUpdateThumb);
        this.attachEventListeners();
        Scrollbar.instances.set(container, this);
        Scrollbar.instanceCount++;
        if (!Scrollbar.globalListenersInstalled) {
            Scrollbar.installGlobalListeners();
        }
        requestAnimationFrame(this.boundUpdateThumb);
    }
    getRequiredElements(container) {
        const viewport = container.querySelector('.viewport');
        const content = container.querySelector('.content');
        const track = container.querySelector('.track');
        const thumb = container.querySelector('.thumb');
        if (!viewport || !content || !track || !thumb) {
            throw new Error('Required scrollbar elements not found. Expected: .viewport, .content, .track, .thumb');
        }
        return { viewport, content, track, thumb };
    }
    getMinThumbHeight() {
        const cssValue = getComputedStyle(document.documentElement)
            .getPropertyValue('--thumb-min')
            .trim();
        const parsed = parseInt(cssValue, 10);
        const defaultMin = 28;
        const absoluteMin = 16;
        return Math.max(absoluteMin, parsed || defaultMin);
    }
    static installGlobalListeners() {
        const ac = new AbortController();
        Scrollbar.globalListenerAbortController = ac;
        document.addEventListener('pointermove', (e) => {
            Scrollbar.activeInstance?.boundPointerMove(e);
        }, { passive: false, signal: ac.signal });
        document.addEventListener('pointerup', (e) => {
            Scrollbar.activeInstance?.boundPointerUp(e);
        }, { signal: ac.signal });
        document.addEventListener('pointercancel', (e) => {
            Scrollbar.activeInstance?.boundPointerUp(e);
        }, { signal: ac.signal });
        Scrollbar.globalListenersInstalled = true;
    }
    attachEventListeners() {
        this.viewport.addEventListener('scroll', this.boundViewportScroll, { passive: true });
        this.thumb.addEventListener('pointerdown', this.boundThumbPointerDown);
        this.track.addEventListener('click', this.boundTrackClick);
        this.container.addEventListener('wheel', this.boundContainerWheel, { passive: false });
        this.ro.observe(this.viewport);
        this.ro.observe(this.content);
        window.addEventListener('resize', this.boundUpdateThumb);
    }
    updateThumb() {
        const viewportHeight = this.viewport.clientHeight;
        const contentHeight = this.content.scrollHeight;
        const trackHeight = this.track.clientHeight;
        if (contentHeight <= viewportHeight + 1) {
            this.thumb.style.display = 'none';
            return;
        }
        this.thumb.style.display = '';
        const ratio = viewportHeight / contentHeight;
        const thumbHeight = Math.max(Math.floor(ratio * trackHeight), this.MIN_THUMB_HEIGHT);
        this.thumb.style.height = `${thumbHeight}px`;
        const maxScroll = contentHeight - viewportHeight;
        const maxThumbTop = trackHeight - thumbHeight;
        const scrollRatio = this.viewport.scrollTop / (maxScroll || 1);
        const thumbTop = scrollRatio * (maxThumbTop || 0);
        this.thumb.style.top = `${thumbTop}px`;
    }
    handleThumbPointerDown(e) {
        e.preventDefault();
        this.dragging = true;
        this.activePointerId = e.pointerId;
        Scrollbar.activeInstance = this;
        try {
            this.thumb.setPointerCapture(e.pointerId);
        }
        catch (err) {
            console.warn('Failed to capture pointer:', err);
        }
        this.startPointerY = e.clientY;
        const thumbRect = this.thumb.getBoundingClientRect();
        const trackRect = this.track.getBoundingClientRect();
        this.startThumbTop = thumbRect.top - trackRect.top;
        document.body.style.userSelect = 'none';
    }
    handlePointerMove(e) {
        if (!this.dragging || this.activePointerId !== e.pointerId) {
            return;
        }
        e.preventDefault();
        const pointerDelta = e.clientY - this.startPointerY;
        const trackHeight = this.track.clientHeight;
        const thumbHeight = this.thumb.clientHeight;
        const maxThumbTop = trackHeight - thumbHeight;
        const newThumbTop = Math.max(0, Math.min(maxThumbTop, this.startThumbTop + pointerDelta));
        this.thumb.style.top = `${newThumbTop}px`;
        const contentHeight = this.content.scrollHeight;
        const viewportHeight = this.viewport.clientHeight;
        const maxScroll = contentHeight - viewportHeight;
        const scrollRatio = newThumbTop / (maxThumbTop || 1);
        this.viewport.scrollTop = scrollRatio * (maxScroll || 0);
    }
    handlePointerUp(e) {
        if (!this.dragging || this.activePointerId !== e.pointerId) {
            return;
        }
        this.dragging = false;
        try {
            this.thumb.releasePointerCapture(e.pointerId);
        }
        catch (err) {
            console.warn('Failed to release pointer:', err);
        }
        this.activePointerId = null;
        Scrollbar.activeInstance = null;
        document.body.style.userSelect = '';
    }
    handleTrackClick(e) {
        if (e.target === this.thumb) {
            return;
        }
        const trackRect = this.track.getBoundingClientRect();
        const clickY = e.clientY - trackRect.top;
        const thumbHeight = this.thumb.clientHeight;
        const trackHeight = this.track.clientHeight;
        const targetThumbTop = clickY - thumbHeight / 2;
        const maxThumbTop = trackHeight - thumbHeight;
        const clampedThumbTop = Math.max(0, Math.min(maxThumbTop, targetThumbTop));
        const contentHeight = this.content.scrollHeight;
        const viewportHeight = this.viewport.clientHeight;
        const maxScroll = contentHeight - viewportHeight;
        const scrollRatio = clampedThumbTop / (maxThumbTop || 1);
        const scrollTop = scrollRatio * (maxScroll || 0);
        this.viewport.scrollTo({ top: scrollTop, behavior: 'smooth' });
    }
    handleContainerWheel(e) {
        const { scrollTop, scrollHeight, clientHeight } = this.viewport;
        const scrollable = scrollHeight > clientHeight;
        const atTop = scrollTop === 0 && e.deltaY < 0;
        const atBottom = scrollTop + clientHeight >= scrollHeight - 1 && e.deltaY > 0;
        if (scrollable && !atTop && !atBottom) {
            e.preventDefault();
        }
        this.viewport.scrollTop += e.deltaY;
    }
    destroy() {
        this.viewport.removeEventListener('scroll', this.boundViewportScroll);
        this.thumb.removeEventListener('pointerdown', this.boundThumbPointerDown);
        this.track.removeEventListener('click', this.boundTrackClick);
        this.container.removeEventListener('wheel', this.boundContainerWheel);
        window.removeEventListener('resize', this.boundUpdateThumb);
        this.ro.disconnect();
        Scrollbar.instances.delete(this.container);
        if (Scrollbar.activeInstance === this) {
            Scrollbar.activeInstance = null;
        }
        Scrollbar.instanceCount--;
        if (Scrollbar.instanceCount === 0) {
            Scrollbar.globalListenerAbortController?.abort();
            Scrollbar.globalListenerAbortController = null;
            Scrollbar.globalListenersInstalled = false;
        }
    }
    static create(elementOrSelector) {
        const container = typeof elementOrSelector === 'string'
            ? document.querySelector(elementOrSelector)
            : elementOrSelector;
        if (!container) {
            throw new Error(`Scrollbar: Element not found for selector "${elementOrSelector}"`);
        }
        const existing = Scrollbar.instances.get(container);
        if (existing)
            return existing;
        return new Scrollbar(container);
    }
    static initAll(selector) {
        const containers = document.querySelectorAll(selector);
        return Array.from(containers).map(container => Scrollbar.create(container));
    }
    static initOne(elementOrSelector) {
        return Scrollbar.create(elementOrSelector);
    }
    static getInstance(container) {
        return Scrollbar.instances.get(container);
    }
}
export { Scrollbar };
