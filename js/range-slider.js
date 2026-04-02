class RangeSlider {
    constructor(input) {
        this.handleInput = () => {
            this.update();
        };
        this.input = input;
        this.update();
        this.input.addEventListener('input', this.handleInput);
    }
    static initAll(selector = '.range-slider input[type="range"]') {
        document.querySelectorAll(selector).forEach(input => {
            new RangeSlider(input);
        });
    }
    update() {
        const min = +this.input.min || 0;
        const max = +this.input.max || 100;
        const pct = ((+this.input.value - min) / (max - min)) * 100;
        this.input.style.setProperty('--range-fill', `${pct}%`);
    }
    destroy() {
        this.input.removeEventListener('input', this.handleInput);
        this.input.style.removeProperty('--range-fill');
    }
}
export { RangeSlider };
