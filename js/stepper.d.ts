interface StepperOptions {
    defaultStep?: number;
    clickable?: boolean;
    onChange?: (current: number, previous: number) => void;
    iconBasePath?: string;
}
declare class Stepper {
    private container;
    private steps;
    private connectors;
    private current;
    private readonly onChange?;
    private readonly iconBasePath;
    private abortController;
    private injectedConnectors;
    constructor(elementOrSelector: string | HTMLElement, options?: StepperOptions);
    private injectConnectors;
    private checkSvg;
    private render;
    next(): void;
    prev(): void;
    goTo(index: number): void;
    setError(index: number): void;
    clearError(index: number): void;
    getStep(): number;
    getStepCount(): number;
    isFirst(): boolean;
    isLast(): boolean;
    destroy(): void;
}
export { Stepper, type StepperOptions };
