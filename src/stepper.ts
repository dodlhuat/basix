interface StepperOptions {
    defaultStep?: number;
    clickable?: boolean;
    onChange?: (current: number, previous: number) => void;
    iconBasePath?: string;
}

class Stepper {
    private container: HTMLElement;
    private steps: HTMLElement[];
    private connectors: HTMLElement[];
    private current: number;
    private readonly onChange?: (current: number, previous: number) => void;
    private readonly iconBasePath: string;
    private abortController = new AbortController();
    private injectedConnectors = false;

    constructor(elementOrSelector: string | HTMLElement, options: StepperOptions = {}) {
        const element = typeof elementOrSelector === 'string'
            ? document.querySelector<HTMLElement>(elementOrSelector)
            : elementOrSelector;

        if (!element) throw new Error('Stepper: element not found');

        this.container = element;
        this.steps = Array.from(this.container.querySelectorAll<HTMLElement>('.stepper-step'));
        this.onChange = options.onChange;
        this.iconBasePath = options.iconBasePath ?? 'svg-icons/';
        this.current = options.defaultStep ?? 0;

        if (this.steps.length === 0) {
            console.warn('Stepper: no .stepper-step elements found');
            this.connectors = [];
            return;
        }

        this.connectors = this.injectConnectors();

        if (options.clickable) {
            this.container.classList.add('stepper-clickable');
            this.steps.forEach((step, i) => {
                step.addEventListener('click', () => this.goTo(i), { signal: this.abortController.signal });
            });
        }

        this.render();
    }

    private injectConnectors(): HTMLElement[] {
        const injected: HTMLElement[] = [];
        // Insert a connector after each step except the last
        for (let i = 0; i < this.steps.length - 1; i++) {
            const connector = document.createElement('div');
            connector.className = 'stepper-connector';
            this.steps[i].insertAdjacentElement('afterend', connector);
            injected.push(connector);
        }
        this.injectedConnectors = true;
        return injected;
    }

    private checkSvg(): string {
        return `<svg class="icon-svg" aria-hidden="true"><use href="${this.iconBasePath}icons.svg#check"/></svg>`;
    }

    private render(): void {
        this.steps.forEach((step, i) => {
            step.classList.remove('active', 'completed', 'error');

            const indicator = step.querySelector<HTMLElement>('.stepper-indicator');

            if (i < this.current) {
                step.classList.add('completed');
                step.removeAttribute('aria-current');
                if (indicator) indicator.innerHTML = this.checkSvg();
            } else if (i === this.current) {
                step.classList.add('active');
                step.setAttribute('aria-current', 'step');
                if (indicator) indicator.textContent = String(i + 1);
            } else {
                step.removeAttribute('aria-current');
                if (indicator) indicator.textContent = String(i + 1);
            }
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
        if (this.injectedConnectors) {
            this.connectors.forEach(c => c.remove());
            this.connectors = [];
        }
        this.steps.forEach(step => step.removeAttribute('aria-current'));
    }
}

export { Stepper, type StepperOptions };
