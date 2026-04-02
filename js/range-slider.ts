class RangeSlider {
    private readonly input: HTMLInputElement;

    constructor(input: HTMLInputElement) {
        this.input = input;
        this.update();
        this.input.addEventListener('input', this.handleInput);
    }

    public static initAll(selector: string = '.range-slider input[type="range"]'): void {
        document.querySelectorAll<HTMLInputElement>(selector).forEach(input => {
            new RangeSlider(input);
        });
    }

    private update(): void {
        const min = +this.input.min || 0;
        const max = +this.input.max || 100;
        const pct = ((+this.input.value - min) / (max - min)) * 100;
        this.input.style.setProperty('--range-fill', `${pct}%`);
    }

    private handleInput = (): void => {
        this.update();
    };

    public destroy(): void {
        this.input.removeEventListener('input', this.handleInput);
        this.input.style.removeProperty('--range-fill');
    }
}

export { RangeSlider };
