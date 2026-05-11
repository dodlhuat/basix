interface StepperOptions {
    defaultStep?: number;
    clickable?: boolean;
    onChange?: (current: number, previous: number) => void;
}

class Stepper {
    private container: HTMLElement;
    private steps: HTMLElement[];
    private connectors: HTMLElement[];
    private current: number;
    private readonly onChange?: (current: number, previous: number) => void;
    private abortController = new AbortController();

    constructor(elementOrSelector: string | HTMLElement, options: StepperOptions = {}) {
        const element = typeof elementOrSelector === 'string'
            ? document.querySelector<HTMLElement>(elementOrSelector)
            : elementOrSelector;

        if (!element) throw new Error(`Stepper: element not found`);

        this.container = element;
        this.steps = Array.from(this.container.querySelectorAll<HTMLElement>('.stepper-step'));
        this.connectors = Array.from(this.container.querySelectorAll<HTMLElement>('.stepper-connector'));
        this.onChange = options.onChange;
        this.current = options.defaultStep ?? 0;

        if (this.steps.length === 0) {
            console.warn('Stepper: no .stepper-step elements found');
            return;
        }

        if (options.clickable) {
            this.container.classList.add('stepper-clickable');
            this.steps.forEach((step, i) => {
                step.addEventListener('click', () => this.goTo(i), { signal: this.abortController.signal });
            });
        }

        this.render();
    }

    private render(): void {
        this.steps.forEach((step, i) => {
            step.classList.remove('active', 'completed');

            if (i < this.current) step.classList.add('completed');
            else if (i === this.current) step.classList.add('active');
        });

        this.connectors.forEach((connector, i) => {
            connector.classList.toggle('completed', i < this.current);
        });
    }

    public next(): void {
        if (this.current < this.steps.length - 1) {
            this.goTo(this.current + 1);
        }
    }

    public prev(): void {
        if (this.current > 0) {
            this.goTo(this.current - 1);
        }
    }

    public goTo(index: number): void {
        if (index < 0 || index >= this.steps.length) return;
        const previous = this.current;
        this.current = index;
        this.render();
        if (this.onChange && previous !== index) {
            this.onChange(index, previous);
        }
    }

    public setError(index: number): void {
        if (index < 0 || index >= this.steps.length) return;
        this.steps[index].classList.add('error');
    }

    public clearError(index: number): void {
        if (index < 0 || index >= this.steps.length) return;
        this.steps[index].classList.remove('error');
    }

    public getStep(): number {
        return this.current;
    }

    public getStepCount(): number {
        return this.steps.length;
    }

    public isFirst(): boolean {
        return this.current === 0;
    }

    public isLast(): boolean {
        return this.current === this.steps.length - 1;
    }

    public destroy(): void {
        this.abortController.abort();
    }
}

export { Stepper, type StepperOptions };
