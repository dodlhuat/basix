class TimeSpanPicker {
    constructor(containerId, options) {
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
    queryInput(selector) {
        const input = this.container.querySelector(selector);
        if (!input) {
            throw new Error(`Input with selector "${selector}" not found`);
        }
        return input;
    }
    render() {
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
    attachEventListeners() {
        this.startTimeInput.addEventListener('change', () => this.handleChange());
        this.endTimeInput.addEventListener('change', () => this.handleChange());
    }
    handleChange() {
        const start = this.startTimeInput.value;
        const end = this.endTimeInput.value;
        // Validate that end time is after start time
        if (start && end && start >= end) {
            this.endTimeInput.setCustomValidity('Endzeit muss nach Startzeit liegen');
        }
        else {
            this.endTimeInput.setCustomValidity('');
        }
        // Trigger onChange callback if both values are present
        if (this.onChange && start && end) {
            this.onChange(start, end);
        }
    }
    getValue() {
        return {
            start: this.startTimeInput.value,
            end: this.endTimeInput.value
        };
    }
    setValue(start, end) {
        this.startTimeInput.value = start;
        this.endTimeInput.value = end;
        this.handleChange();
    }
    reset() {
        this.startTimeInput.value = '';
        this.endTimeInput.value = '';
        this.endTimeInput.setCustomValidity('');
    }
    isValid() {
        const { start, end } = this.getValue();
        return !!(start && end && start < end);
    }
    destroy() {
        this.startTimeInput.removeEventListener('change', () => this.handleChange());
        this.endTimeInput.removeEventListener('change', () => this.handleChange());
    }
}
export { TimeSpanPicker };
