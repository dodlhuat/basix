interface TimeSpan {
    start: string;
    end: string;
}

interface TimeSpanPickerOptions {
    onChange?: (start: string, end: string) => void;
    defaultStart?: string;
    defaultEnd?: string;
}

class TimeSpanPicker {
    private container: HTMLElement;
    private startTimeInput: HTMLInputElement;
    private endTimeInput: HTMLInputElement;
    private onChange?: (start: string, end: string) => void;

    constructor(containerId: string, options?: TimeSpanPickerOptions) {
        const element = document.getElementById(containerId);
        if (!element) {
            throw new Error(`Container with id "${containerId}" not found`);
        }

        this.container = element;
        this.onChange = options?.onChange;

        this.render();

        // Query the inputs after rendering
        this.startTimeInput = this.queryInput('.timespan-start');
        this.endTimeInput = this.queryInput('.timespan-end');

        // Set default values if provided
        if (options?.defaultStart) {
            this.startTimeInput.value = options.defaultStart;
        }
        if (options?.defaultEnd) {
            this.endTimeInput.value = options.defaultEnd;
        }

        this.attachEventListeners();
    }

    private queryInput(selector: string): HTMLInputElement {
        const input = this.container.querySelector<HTMLInputElement>(selector);
        if (!input) {
            throw new Error(`Input with selector "${selector}" not found`);
        }
        return input;
    }

    private render(): void {
        this.container.innerHTML = `
      <div class="timespan-picker">
        <div class="timespan-field">
          <label for="timespan-start">from</label>
          <input
            type="time"
            class="timespan-start"
            id="timespan-start"
          />
        </div>

        <div class="timespan-separator">-</div>

        <div class="timespan-field">
          <label for="timespan-end">to</label>
          <input
            type="time"
            class="timespan-end"
            id="timespan-end"
          />
        </div>
      </div>
    `;
    }

    private attachEventListeners(): void {
        this.startTimeInput.addEventListener('change', () => this.handleChange());
        this.endTimeInput.addEventListener('change', () => this.handleChange());
    }

    private handleChange(): void {
        const start = this.startTimeInput.value;
        const end = this.endTimeInput.value;

        // Validate that end time is after start time
        if (start && end && start >= end) {
            this.endTimeInput.setCustomValidity('Endzeit muss nach Startzeit liegen');
        } else {
            this.endTimeInput.setCustomValidity('');
        }

        // Trigger onChange callback if both values are present
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
    }

    public isValid(): boolean {
        const {start, end} = this.getValue();
        return !!(start && end && start < end);
    }

    public destroy(): void {
        this.startTimeInput.removeEventListener('change', () => this.handleChange());
        this.endTimeInput.removeEventListener('change', () => this.handleChange());
    }
}

export {TimeSpanPicker};
export type {TimeSpan, TimeSpanPickerOptions};