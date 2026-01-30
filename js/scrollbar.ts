interface ScrollbarElements {
    viewport: HTMLElement;
    content: HTMLElement;
    track: HTMLElement;
    thumb: HTMLElement;
}

class Scrollbar {
    private static readonly instances = new WeakMap<HTMLElement, Scrollbar>();
    private static activeInstance: Scrollbar | null = null;
    private static globalListenersInstalled = false;

    private readonly container!: HTMLElement;
    private readonly viewport!: HTMLElement;
    private readonly content!: HTMLElement;
    private readonly track!: HTMLElement;
    private readonly thumb!: HTMLElement;
    private readonly MIN_THUMB_HEIGHT!: number;
    private readonly ro!: ResizeObserver;

    private dragging = false;
    private activePointerId: number | null = null;
    private startPointerY = 0;
    private startThumbTop = 0;

    // Bound methods for event handling
    private readonly boundPointerMove!: (e: PointerEvent) => void;
    private readonly boundPointerUp!: (e: PointerEvent) => void;
    private readonly boundThumbPointerDown!: (e: PointerEvent) => void;
    private readonly boundTrackClick!: (e: MouseEvent) => void;
    private readonly boundViewportScroll!: () => void;
    private readonly boundUpdateThumb!: () => void;

    constructor(elementOrSelector: string | HTMLElement) {
        const container = typeof elementOrSelector === 'string'
            ? document.querySelector<HTMLElement>(elementOrSelector)
            : elementOrSelector;

        if (!container) {
            throw new Error(`Scrollbar: Element not found for selector "${elementOrSelector}"`);
        }

        // Return existing instance if already initialized
        const existingInstance = Scrollbar.instances.get(container);
        if (existingInstance) {
            return existingInstance as any;
        }

        this.container = container;

        // Query and validate required elements
        const elements = this.getRequiredElements(container);
        this.viewport = elements.viewport;
        this.content = elements.content;
        this.track = elements.track;
        this.thumb = elements.thumb;

        // Get minimum thumb height from CSS variable or use default
        this.MIN_THUMB_HEIGHT = this.getMinThumbHeight();

        // Bind all event handlers once
        this.boundPointerMove = this.handlePointerMove.bind(this);
        this.boundPointerUp = this.handlePointerUp.bind(this);
        this.boundThumbPointerDown = this.handleThumbPointerDown.bind(this);
        this.boundTrackClick = this.handleTrackClick.bind(this);
        this.boundViewportScroll = this.updateThumb.bind(this);
        this.boundUpdateThumb = this.updateThumb.bind(this);

        // Setup ResizeObserver
        this.ro = new ResizeObserver(this.boundUpdateThumb);

        // Initialize
        this.attachEventListeners();
        Scrollbar.instances.set(container, this);

        // Install global listeners once for all instances
        if (!Scrollbar.globalListenersInstalled) {
            Scrollbar.installGlobalListeners();
        }

        // Initial thumb update
        requestAnimationFrame(this.boundUpdateThumb);
    }

    private getRequiredElements(container: HTMLElement): ScrollbarElements {
        const viewport = container.querySelector<HTMLElement>('.viewport');
        const content = container.querySelector<HTMLElement>('.content');
        const track = container.querySelector<HTMLElement>('.track');
        const thumb = container.querySelector<HTMLElement>('.thumb');

        if (!viewport || !content || !track || !thumb) {
            throw new Error(
                'Required scrollbar elements not found. Expected: .viewport, .content, .track, .thumb'
            );
        }

        return { viewport, content, track, thumb };
    }

    private getMinThumbHeight(): number {
        const cssValue = getComputedStyle(document.documentElement)
            .getPropertyValue('--thumb-min')
            .trim();

        const parsed = parseInt(cssValue, 10);
        const defaultMin = 28;
        const absoluteMin = 16;

        return Math.max(absoluteMin, parsed || defaultMin);
    }

    private static installGlobalListeners(): void {
        // Route pointer events to the active scrollbar instance
        document.addEventListener('pointermove', (e: PointerEvent) => {
            Scrollbar.activeInstance?.boundPointerMove(e);
        }, { passive: false });

        document.addEventListener('pointerup', (e: PointerEvent) => {
            Scrollbar.activeInstance?.boundPointerUp(e);
        });

        document.addEventListener('pointercancel', (e: PointerEvent) => {
            Scrollbar.activeInstance?.boundPointerUp(e);
        });

        Scrollbar.globalListenersInstalled = true;
    }

    private attachEventListeners(): void {
        // Instance-specific events
        this.viewport.addEventListener('scroll', this.boundViewportScroll, { passive: true });
        this.thumb.addEventListener('pointerdown', this.boundThumbPointerDown);
        this.track.addEventListener('click', this.boundTrackClick);

        // Observe size changes
        this.ro.observe(this.viewport);
        this.ro.observe(this.content);
        window.addEventListener('resize', this.boundUpdateThumb);
    }

    private updateThumb(): void {
        const viewportHeight = this.viewport.clientHeight;
        const contentHeight = this.content.scrollHeight;
        const trackHeight = this.track.clientHeight;

        // Hide thumb if content fits in viewport
        if (contentHeight <= viewportHeight + 1) {
            this.thumb.style.display = 'none';
            return;
        }

        this.thumb.style.display = '';

        // Calculate thumb size
        const ratio = viewportHeight / contentHeight;
        const thumbHeight = Math.max(
            Math.floor(ratio * trackHeight),
            this.MIN_THUMB_HEIGHT
        );
        this.thumb.style.height = `${thumbHeight}px`;

        // Calculate thumb position
        const maxScroll = contentHeight - viewportHeight;
        const maxThumbTop = trackHeight - thumbHeight;
        const scrollRatio = this.viewport.scrollTop / (maxScroll || 1);
        const thumbTop = scrollRatio * (maxThumbTop || 0);

        this.thumb.style.top = `${thumbTop}px`;
    }

    private handleThumbPointerDown(e: PointerEvent): void {
        e.preventDefault();

        this.dragging = true;
        this.activePointerId = e.pointerId;
        Scrollbar.activeInstance = this;

        // Capture pointer for reliable tracking
        try {
            this.thumb.setPointerCapture(e.pointerId);
        } catch (err) {
            console.warn('Failed to capture pointer:', err);
        }

        this.startPointerY = e.clientY;

        const thumbRect = this.thumb.getBoundingClientRect();
        const trackRect = this.track.getBoundingClientRect();
        this.startThumbTop = thumbRect.top - trackRect.top;

        // Prevent text selection during drag
        document.body.style.userSelect = 'none';
    }

    private handlePointerMove(e: PointerEvent): void {
        // Only handle events for the active pointer
        if (!this.dragging || this.activePointerId !== e.pointerId) {
            return;
        }

        e.preventDefault();

        const pointerDelta = e.clientY - this.startPointerY;
        const trackHeight = this.track.clientHeight;
        const thumbHeight = this.thumb.clientHeight;
        const maxThumbTop = trackHeight - thumbHeight;

        // Calculate new thumb position
        const newThumbTop = Math.max(
            0,
            Math.min(maxThumbTop, this.startThumbTop + pointerDelta)
        );
        this.thumb.style.top = `${newThumbTop}px`;

        // Update viewport scroll position
        const contentHeight = this.content.scrollHeight;
        const viewportHeight = this.viewport.clientHeight;
        const maxScroll = contentHeight - viewportHeight;
        const scrollRatio = newThumbTop / (maxThumbTop || 1);

        this.viewport.scrollTop = scrollRatio * (maxScroll || 0);
    }

    private handlePointerUp(e: PointerEvent): void {
        if (!this.dragging || this.activePointerId !== e.pointerId) {
            return;
        }

        this.dragging = false;

        // Release pointer capture
        try {
            this.thumb.releasePointerCapture(e.pointerId);
        } catch (err) {
            console.warn('Failed to release pointer:', err);
        }

        this.activePointerId = null;
        Scrollbar.activeInstance = null;
        document.body.style.userSelect = '';
    }

    private handleTrackClick(e: MouseEvent): void {
        // Ignore clicks directly on the thumb
        if (e.target === this.thumb) {
            return;
        }

        const trackRect = this.track.getBoundingClientRect();
        const clickY = e.clientY - trackRect.top;
        const thumbHeight = this.thumb.clientHeight;
        const trackHeight = this.track.clientHeight;

        // Center thumb on click position
        const targetThumbTop = clickY - thumbHeight / 2;
        const maxThumbTop = trackHeight - thumbHeight;
        const clampedThumbTop = Math.max(0, Math.min(maxThumbTop, targetThumbTop));

        // Calculate corresponding scroll position
        const contentHeight = this.content.scrollHeight;
        const viewportHeight = this.viewport.clientHeight;
        const maxScroll = contentHeight - viewportHeight;
        const scrollRatio = clampedThumbTop / (maxThumbTop || 1);
        const scrollTop = scrollRatio * (maxScroll || 0);

        this.viewport.scrollTo({ top: scrollTop, behavior: 'smooth' });
    }

    public destroy(): void {
        // Remove event listeners
        this.viewport.removeEventListener('scroll', this.boundViewportScroll);
        this.thumb.removeEventListener('pointerdown', this.boundThumbPointerDown);
        this.track.removeEventListener('click', this.boundTrackClick);
        window.removeEventListener('resize', this.boundUpdateThumb);

        // Disconnect observer
        this.ro.disconnect();

        // Clear from instances map
        Scrollbar.instances.delete(this.container);

        // Clear active instance if this was it
        if (Scrollbar.activeInstance === this) {
            Scrollbar.activeInstance = null;
        }
    }

    // Static factory methods
    public static initAll(selector: string): Scrollbar[] {
        const containers = document.querySelectorAll<HTMLElement>(selector);
        return Array.from(containers).map(container => new Scrollbar(container));
    }

    public static initOne(elementOrSelector: string | HTMLElement): Scrollbar {
        return new Scrollbar(elementOrSelector);
    }

    public static getInstance(container: HTMLElement): Scrollbar | undefined {
        return Scrollbar.instances.get(container);
    }

    public static destroyAll(): void {
        // Note: WeakMap doesn't support iteration, so this is a no-op
        // Individual instances should be destroyed by calling destroy()
    }
}

export { Scrollbar, ScrollbarElements };