class RangeSlider {
    input;
    abortController = new AbortController();
    constructor(input) {
        this.input = input;
        this.update();
        this.input.addEventListener('input', () => this.update(), { signal: this.abortController.signal });
    }
    static initAll(selector = '.range-slider input[type="range"]') {
        document.querySelectorAll(selector).forEach((input) => {
            new RangeSlider(input);
        });
    }
    update() {
        const min = this.input.min !== '' ? +this.input.min : 0;
        const max = this.input.max !== '' ? +this.input.max : 100;
        const pct = ((+this.input.value - min) / (max - min)) * 100;
        this.input.style.setProperty('--range-fill', `${pct}%`);
    }
    destroy() {
        this.abortController.abort();
        this.input.style.removeProperty('--range-fill');
    }
}
class RangeSliderRange {
    container;
    startInput;
    endInput;
    fill;
    fillCreatedByUs;
    abortController = new AbortController();
    constructor(container) {
        const inputs = container.querySelectorAll('input[type="range"]');
        if (inputs.length !== 2) {
            throw new Error('RangeSliderRange: container must contain exactly two range inputs');
        }
        this.container = container;
        this.startInput = inputs[0];
        this.endInput = inputs[1];
        const existingFill = container.querySelector('.range-slider-fill');
        this.fillCreatedByUs = !existingFill;
        this.fill = existingFill ?? document.createElement('div');
        this.fill.classList.add('range-slider-fill');
        if (this.fillCreatedByUs) {
            container.insertBefore(this.fill, container.firstChild);
        }
        this.update();
        const signal = this.abortController.signal;
        this.startInput.addEventListener('input', () => this.handleInput(this.startInput), { signal });
        this.endInput.addEventListener('input', () => this.handleInput(this.endInput), { signal });
    }
    static initAll(selector = '.range-slider--range') {
        document.querySelectorAll(selector).forEach((container) => {
            new RangeSliderRange(container);
        });
    }
    values() {
        return [+this.startInput.value, +this.endInput.value];
    }
    handleInput(moved) {
        if (moved === this.startInput && +this.startInput.value > +this.endInput.value) {
            this.startInput.value = this.endInput.value;
        }
        else if (moved === this.endInput && +this.endInput.value < +this.startInput.value) {
            this.endInput.value = this.startInput.value;
        }
        this.update();
    }
    update() {
        const min = this.startInput.min !== '' ? +this.startInput.min : 0;
        const max = this.startInput.max !== '' ? +this.startInput.max : 100;
        const startPct = ((+this.startInput.value - min) / (max - min)) * 100;
        const endPct = ((+this.endInput.value - min) / (max - min)) * 100;
        this.container.style.setProperty('--range-start', `${startPct}%`);
        this.container.style.setProperty('--range-end', `${endPct}%`);
    }
    destroy() {
        this.abortController.abort();
        this.container.style.removeProperty('--range-start');
        this.container.style.removeProperty('--range-end');
        if (this.fillCreatedByUs) {
            this.fill.remove();
        }
    }
}
export { RangeSlider, RangeSliderRange };
