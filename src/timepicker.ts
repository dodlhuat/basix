interface TimeSpan {
    start: string;
    end: string;
}

interface TimeSpanPickerOptions {
    onChange?: (start: string, end: string) => void;
    defaultStart?: string;
    defaultEnd?: string;
    fromString?: string;
    toString?: string;
}

class TimeSpanPicker {
    private container: HTMLElement;
    private startTimeInput: HTMLInputElement;
    private endTimeInput: HTMLInputElement;
    private onChange?: (start: string, end: string) => void;
    private readonly uid: string;
    private fromString: string;
    private toString: string;

    constructor(elementOrSelector: string | HTMLElement, options?: TimeSpanPickerOptions) {
        const element = typeof elementOrSelector === 'string'
            ? (elementOrSelector.startsWith('#') || elementOrSelector.startsWith('.')
                ? document.querySelector<HTMLElement>(elementOrSelector)
                : document.getElementById(elementOrSelector))
            : elementOrSelector;

        if (!element) {
            throw new Error(`TimeSpanPicker: Element not found for "${elementOrSelector}"`);
        }

        this.container = element;
        this.onChange = options?.onChange;
        this.uid = `tsp-${Math.random().toString(36).slice(2, 9)}`;
        this.fromString = options?.fromString ?? 'From';
        this.toString = options?.toString ?? 'To';

        this.render();

        this.startTimeInput = this.queryInput('.timespan-start');
        this.endTimeInput = this.queryInput('.timespan-end');

        if (options?.defaultStart) {
            this.startTimeInput.value = options.defaultStart;
        }
        if (options?.defaultEnd) {
            this.endTimeInput.value = options.defaultEnd;
        }

        this.attachEventListeners();

        // Render initial state if defaults provided
        if (options?.defaultStart || options?.defaultEnd) {
            this.updateUI();
        }
    }

    private queryInput(selector: string): HTMLInputElement {
        const input = this.container.querySelector<HTMLInputElement>(selector);
        if (!input) {
            throw new Error(`Input with selector "${selector}" not found`);
        }
        return input;
    }

    private render(): void {
        const startId = `${this.uid}-start`;
        const endId = `${this.uid}-end`;
        this.container.innerHTML = `
      <div class="timespan-picker">
        <div class="timespan-field timespan-field-start">
          <label for="${startId}">${this.fromString}</label>
          <input type="time" class="timespan-start" id="${startId}"/>
        </div>

        <div class="timespan-center">
          <span class="timespan-arrow">→</span>
          <span class="timespan-duration"></span>
        </div>

        <div class="timespan-field timespan-field-end">
          <label for="${endId}">${this.toString}</label>
          <input type="time" class="timespan-end" id="${endId}"/>
        </div>
      </div>
      <div class="timespan-bar" aria-hidden="true">
        <div class="timespan-bar-fill"></div>
      </div>
    `;
    }

    private readonly handleStartChange = (): void => { this.handleChange(); };
    private readonly handleEndChange = (): void => { this.handleChange(); };

    private attachEventListeners(): void {
        this.startTimeInput.addEventListener('change', this.handleStartChange);
        this.endTimeInput.addEventListener('change', this.handleEndChange);
    }

    private toMinutes(time: string): number {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    }

    private formatDuration(minutes: number): string {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h && m) return `${h}h ${m}m`;
        if (h) return `${h}h`;
        return `${m}m`;
    }

    private updateUI(): void {
        const picker = this.container.querySelector<HTMLElement>('.timespan-picker');
        const durationEl = this.container.querySelector<HTMLElement>('.timespan-duration');
        const barFill = this.container.querySelector<HTMLElement>('.timespan-bar-fill');

        const start = this.startTimeInput.value;
        const end = this.endTimeInput.value;
        const isError = !!(start && end && start >= end);

        picker?.classList.toggle('is-error', isError);

        if (isError) {
            this.endTimeInput.setCustomValidity('End time must be after start time');
            if (durationEl) durationEl.textContent = '!';
            return;
        }

        this.endTimeInput.setCustomValidity('');

        if (start && end && durationEl && barFill) {
            const startMins = this.toMinutes(start);
            const endMins = this.toMinutes(end);
            const duration = endMins - startMins;

            durationEl.textContent = this.formatDuration(duration);

            const startPct = ((startMins / 1440) * 100).toFixed(2);
            const widthPct = ((duration / 1440) * 100).toFixed(2);
            barFill.style.left = `${startPct}%`;
            barFill.style.width = `${widthPct}%`;
        } else {
            if (durationEl) durationEl.textContent = '';
            if (barFill) {
                barFill.style.left = '0';
                barFill.style.width = '0';
            }
        }
    }

    private handleChange(): void {
        this.updateUI();

        const { start, end } = this.getValue();
        if (this.onChange && start && end) {
            this.onChange(start, end);
        }
    }

    public getValue(): TimeSpan {
        return {
            start: this.startTimeInput.value,
            end: this.endTimeInput.value
        };
    }

    public setValue(start: string, end: string): void {
        this.startTimeInput.value = start;
        this.endTimeInput.value = end;
        this.handleChange();
    }

    public reset(): void {
        this.startTimeInput.value = '';
        this.endTimeInput.value = '';
        this.endTimeInput.setCustomValidity('');

        const picker = this.container.querySelector('.timespan-picker');
        const durationEl = this.container.querySelector<HTMLElement>('.timespan-duration');
        const barFill = this.container.querySelector<HTMLElement>('.timespan-bar-fill');

        picker?.classList.remove('is-error');
        if (durationEl) durationEl.textContent = '';
        if (barFill) { barFill.style.left = '0'; barFill.style.width = '0'; }
    }

    public isValid(): boolean {
        const { start, end } = this.getValue();
        return !!(start && end && start < end);
    }

    public destroy(): void {
        this.startTimeInput.removeEventListener('change', this.handleStartChange);
        this.endTimeInput.removeEventListener('change', this.handleEndChange);
    }
}

export { TimeSpanPicker };
export type { TimeSpan, TimeSpanPickerOptions };
