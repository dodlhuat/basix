class Stepper {
    constructor(elementOrSelector, options = {}) {
        this.abortController = new AbortController();
        const element = typeof elementOrSelector === 'string'
            ? document.querySelector(elementOrSelector)
            : elementOrSelector;
        if (!element)
            throw new Error(`Stepper: element not found`);
        this.container = element;
        this.steps = Array.from(this.container.querySelectorAll('.stepper-step'));
        this.connectors = Array.from(this.container.querySelectorAll('.stepper-connector'));
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
    render() {
        this.steps.forEach((step, i) => {
            step.classList.remove('active', 'completed');
            if (i < this.current)
                step.classList.add('completed');
            else if (i === this.current)
                step.classList.add('active');
        });
        this.connectors.forEach((connector, i) => {
            connector.classList.toggle('completed', i < this.current);
        });
    }
    next() {
        if (this.current < this.steps.length - 1) {
            this.goTo(this.current + 1);
        }
    }
    prev() {
        if (this.current > 0) {
            this.goTo(this.current - 1);
        }
    }
    goTo(index) {
        if (index < 0 || index >= this.steps.length)
            return;
        const previous = this.current;
        this.current = index;
        this.render();
        if (this.onChange && previous !== index) {
            this.onChange(index, previous);
        }
    }
    setError(index) {
        if (index < 0 || index >= this.steps.length)
            return;
        this.steps[index].classList.add('error');
    }
    clearError(index) {
        if (index < 0 || index >= this.steps.length)
            return;
        this.steps[index].classList.remove('error');
    }
    getStep() {
        return this.current;
    }
    getStepCount() {
        return this.steps.length;
    }
    isFirst() {
        return this.current === 0;
    }
    isLast() {
        return this.current === this.steps.length - 1;
    }
    destroy() {
        this.abortController.abort();
    }
}
export { Stepper };
