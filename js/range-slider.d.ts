/** Enhances a native range input with a CSS fill-percentage custom property. */
declare class RangeSlider {
    private readonly input;
    constructor(input: HTMLInputElement);
    static initAll(selector?: string): void;
    private update;
    private handleInput;
    destroy(): void;
}
export { RangeSlider };
