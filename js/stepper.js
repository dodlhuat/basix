class Stepper {
    container;
    steps;
    connectors;
    current;
    onChange;
    iconBasePath;
    abortController = new AbortController();
    injectedConnectors = false;
    constructor(elementOrSelector, options = {}) {
        const element = typeof elementOrSelector === 'string'
            ? document.querySelector(elementOrSelector)
            : elementOrSelector;
        if (!element)
            throw new Error('Stepper: element not found');
        this.container = element;
        this.steps = Array.from(this.container.querySelectorAll('.stepper-step'));
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
    injectConnectors() {
        const injected = [];
        for (let i = 0; i < this.steps.length - 1; i++) {
            const connector = document.createElement('div');
            connector.className = 'stepper-connector';
            this.steps[i].insertAdjacentElement('afterend', connector);
            injected.push(connector);
        }
        this.injectedConnectors = true;
        return injected;
    }
    checkSvg() {
        return `<svg class="icon-svg" aria-hidden="true"><use href="${this.iconBasePath}icons.svg#check"/></svg>`;
    }
    render() {
        this.steps.forEach((step, i) => {
            step.classList.remove('active', 'completed', 'error');
            const indicator = step.querySelector('.stepper-indicator');
            if (i < this.current) {
                step.classList.add('completed');
                step.removeAttribute('aria-current');
                if (indicator)
                    indicator.innerHTML = this.checkSvg();
            }
            else if (i === this.current) {
                step.classList.add('active');
                step.setAttribute('aria-current', 'step');
                if (indicator)
                    indicator.textContent = String(i + 1);
            }
            else {
                step.removeAttribute('aria-current');
                if (indicator)
                    indicator.textContent = String(i + 1);
            }
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
        if (this.injectedConnectors) {
            this.connectors.forEach(c => c.remove());
            this.connectors = [];
        }
        this.steps.forEach(step => step.removeAttribute('aria-current'));
    }
}
export { Stepper };
