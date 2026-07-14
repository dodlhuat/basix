/** Enhances a native range input with a CSS fill-percentage custom property. */
class RangeSlider {
    private readonly input: HTMLInputElement;
    private abortController = new AbortController();

    public constructor(input: HTMLInputElement) {
        this.input = input;
        this.update();
        this.input.addEventListener('input', () => this.update(), { signal: this.abortController.signal });
    }

    public static initAll(selector: string = '.range-slider input[type="range"]'): void {
        document.querySelectorAll<HTMLInputElement>(selector).forEach((input) => {
            new RangeSlider(input);
        });
    }

    private update(): void {
        const min = this.input.min !== '' ? +this.input.min : 0;
        const max = this.input.max !== '' ? +this.input.max : 100;
        const pct = ((+this.input.value - min) / (max - min)) * 100;
        this.input.style.setProperty('--range-fill', `${pct}%`);
    }

    public destroy(): void {
        this.abortController.abort();
        this.input.style.removeProperty('--range-fill');
    }
}

/** Enhances a pair of native range inputs into a two-thumb start/end range slider. */
class RangeSliderRange {
    private readonly container: HTMLElement;
    private readonly startInput: HTMLInputElement;
    private readonly endInput: HTMLInputElement;
    private readonly fill: HTMLElement;
    private readonly fillCreatedByUs: boolean;
    private abortController = new AbortController();

    public constructor(container: HTMLElement) {
        const inputs = container.querySelectorAll<HTMLInputElement>('input[type="range"]');

        if (inputs.length !== 2) {
            throw new Error('RangeSliderRange: container must contain exactly two range inputs');
        }

        this.container = container;
        this.startInput = inputs[0];
        this.endInput = inputs[1];

        const existingFill = container.querySelector<HTMLElement>('.range-slider-fill');
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

    public static initAll(selector: string = '.range-slider--range'): void {
        document.querySelectorAll<HTMLElement>(selector).forEach((container) => {
            new RangeSliderRange(container);
        });
    }

    public values(): [number, number] {
        return [+this.startInput.value, +this.endInput.value];
    }

    private handleInput(moved: HTMLInputElement): void {
        if (moved === this.startInput && +this.startInput.value > +this.endInput.value) {
            this.startInput.value = this.endInput.value;
        } else if (moved === this.endInput && +this.endInput.value < +this.startInput.value) {
            this.endInput.value = this.startInput.value;
        }

        this.update();
    }

    private update(): void {
        const min = this.startInput.min !== '' ? +this.startInput.min : 0;
        const max = this.startInput.max !== '' ? +this.startInput.max : 100;
        const startPct = ((+this.startInput.value - min) / (max - min)) * 100;
        const endPct = ((+this.endInput.value - min) / (max - min)) * 100;
        this.container.style.setProperty('--range-start', `${startPct}%`);
        this.container.style.setProperty('--range-end', `${endPct}%`);
    }

    public destroy(): void {
        this.abortController.abort();
        this.container.style.removeProperty('--range-start');
        this.container.style.removeProperty('--range-end');
        if (this.fillCreatedByUs) {
            this.fill.remove();
        }
    }
}

export { RangeSlider, RangeSliderRange };
