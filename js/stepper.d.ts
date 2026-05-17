/** Configuration options for a Stepper instance. */
interface StepperOptions {
    defaultStep?: number;
    clickable?: boolean;
    onChange?: (current: number, previous: number) => void;
}
/** Multi-step progress indicator with clickable steps and connector state. */
declare class Stepper {
    private container;
    private steps;
    private connectors;
    private current;
    private readonly onChange?;
    private abortController;
    constructor(elementOrSelector: string | HTMLElement, options?: StepperOptions);
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
