class Scrollbar {
    static instances = new WeakMap(); // container -> instance
    static activeInstance = null;
    static globalListenersInstalled = false;

    constructor(container){
        if (!(container instanceof HTMLElement)) throw new Error('container HTMLElement expected');
        if (Scrollbar.instances.has(container)) return Scrollbar.instances.get(container);

        this.container = container;
        this.viewport = container.querySelector('.viewport');
        this.content = container.querySelector('.content');
        this.track = container.querySelector('.track');
        this.thumb = container.querySelector('.thumb');

        if (!this.viewport || !this.content || !this.track || !this.thumb) {
            return;
        }

        this.dragging = false;
        this.activePointerId = null;
        this.startPointerY = 0;
        this.startThumbTop = 0;
        this.MIN_THUMB = Math.max(16, parseInt(getComputedStyle(document.documentElement).getPropertyValue('--thumb-min')) || 28);

        // bind methods for global routing
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);
        this._onThumbPointerDown = this._onThumbPointerDown.bind(this);
        this._onTrackClick = this._onTrackClick.bind(this);
        this._onViewportScroll = this._onViewportScroll.bind(this);
        this._updateThumb = this._updateThumb.bind(this);

        this._attach();
        Scrollbar.instances.set(container, this);

        // Install global listeners once
        if (!Scrollbar.globalListenersInstalled) Scrollbar._installGlobalListeners();
    }

    static _installGlobalListeners(){
        // route pointermove/up to active instance (if any)
        document.addEventListener('pointermove', (e)=> {
            const inst = Scrollbar.activeInstance;
            if (inst) inst._onPointerMove(e);
        }, { passive: false });

        document.addEventListener('pointerup', (e)=> {
            const inst = Scrollbar.activeInstance;
            if (inst) inst._onPointerUp(e);
        });

        document.addEventListener('pointercancel', (e)=> {
            const inst = Scrollbar.activeInstance;
            if (inst) inst && inst._onPointerUp(e);
        });

        Scrollbar.globalListenersInstalled = true;
    }

    _attach(){
        // events scoped to this instance
        this.viewport.addEventListener('scroll', this._onViewportScroll, { passive: true });
        this.thumb.addEventListener('pointerdown', this._onThumbPointerDown);
        this.track.addEventListener('click', this._onTrackClick);

        // observe sizes
        this.ro = new ResizeObserver(this._updateThumb);
        this.ro.observe(this.viewport);
        this.ro.observe(this.content);
        window.addEventListener('resize', this._updateThumb);

        requestAnimationFrame(this._updateThumb);
    }

    _onViewportScroll(){
        this._updateThumb();
    }

    _updateThumb(){
        const vpH = this.viewport.clientHeight;
        const contentH = this.content.scrollHeight;
        const trackH = this.track.clientHeight;

        if (contentH <= vpH + 1) {
            this.thumb.style.display = 'none';
            return;
        } else {
            this.thumb.style.display = '';
        }

        const ratio = vpH / contentH;
        const thumbH = Math.max(Math.floor(ratio * trackH), this.MIN_THUMB);
        this.thumb.style.height = thumbH + 'px';

        const maxScroll = contentH - vpH;
        const maxThumbTop = trackH - thumbH;
        const thumbTop = (this.viewport.scrollTop / (maxScroll || 1)) * (maxThumbTop || 0);

        this.thumb.style.top = thumbTop + 'px';
    }

    _onThumbPointerDown(e){
        e.preventDefault();
        this.dragging = true;
        this.activePointerId = e.pointerId;
        Scrollbar.activeInstance = this; // set routing target
        try { this.thumb.setPointerCapture(e.pointerId); } catch(_) {}
        this.startPointerY = e.clientY;
        const thumbRect = this.thumb.getBoundingClientRect();
        const trackRect = this.track.getBoundingClientRect();
        this.startThumbTop = thumbRect.top - trackRect.top;
        document.body.style.userSelect = 'none';
    }

    _onPointerMove(e){
        // only handle if this instance is active and dragging
        if (!this.dragging || this.activePointerId !== e.pointerId) return;
        e.preventDefault();

        const dy = e.clientY - this.startPointerY;
        const trackH = this.track.clientHeight;
        const thumbH = this.thumb.clientHeight;
        const maxThumbTop = trackH - thumbH;

        let newThumbTop = this.startThumbTop + dy;
        newThumbTop = Math.max(0, Math.min(maxThumbTop, newThumbTop));
        this.thumb.style.top = newThumbTop + 'px';

        const contentH = this.content.scrollHeight;
        const vpH = this.viewport.clientHeight;
        const maxScroll = contentH - vpH;
        const scrollTop = (newThumbTop / (maxThumbTop || 1)) * (maxScroll || 0);
        this.viewport.scrollTop = scrollTop;
    }

    _onPointerUp(e){
        if (!this.dragging || this.activePointerId !== e.pointerId) return;
        this.dragging = false;
        try { this.thumb.releasePointerCapture(e.pointerId); } catch(_) {}
        this.activePointerId = null;
        Scrollbar.activeInstance = null;
        document.body.style.userSelect = '';
    }

    _onTrackClick(e){
        if (e.target === this.thumb) return;
        const rect = this.track.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const thumbH = this.thumb.clientHeight;
        const trackH = this.track.clientHeight;
        const thumbTopTarget = clickY - thumbH / 2;
        const maxThumbTop = trackH - thumbH;
        const clamped = Math.max(0, Math.min(maxThumbTop, thumbTopTarget));
        const contentH = this.content.scrollHeight;
        const vpH = this.viewport.clientHeight;
        const maxScroll = contentH - vpH;
        const scrollTop = (clamped / (maxThumbTop || 1)) * (maxScroll || 0);
        this.viewport.scrollTo({ top: scrollTop, behavior: 'smooth' });
    }

    destroy(){
        // cleanup
        this.viewport.removeEventListener('scroll', this._onViewportScroll);
        this.thumb.removeEventListener('pointerdown', this._onThumbPointerDown);
        this.track.removeEventListener('click', this._onTrackClick);
        window.removeEventListener('resize', this._updateThumb);
        this.ro.disconnect();
        Scrollbar.instances.delete(this.container);
    }

    // convenience static helpers
    static initAll(selector){
        document.querySelectorAll(selector).forEach(c => new Scrollbar(c));
    }

    static initOne(container){
        if (container instanceof HTMLElement) new Scrollbar(container);
    }
}

export {Scrollbar}