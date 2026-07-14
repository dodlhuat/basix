declare class RangeSlider {
    private readonly input;
    private abortController;
    constructor(input: HTMLInputElement);
    static initAll(selector?: string): void;
    private update;
    destroy(): void;
}
declare class RangeSliderRange {
    private readonly container;
    private readonly startInput;
    private readonly endInput;
    private readonly fill;
    private readonly fillCreatedByUs;
    private abortController;
    constructor(container: HTMLElement);
    static initAll(selector?: string): void;
    values(): [number, number];
    private handleInput;
    private update;
    destroy(): void;
}
export { RangeSlider, RangeSliderRange };
