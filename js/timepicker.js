class TimeSpanPicker {
    constructor(elementOrSelector, options) {
        this.barEl = null;
        this.barFillEl = null;
        this.startHandleEl = null;
        this.endHandleEl = null;
        this.dragState = null;
        this.handleStartChange = () => { this.handleChange(); };
        this.handleEndChange = () => { this.handleChange(); };
        this.onStartHandleDown = (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.beginDrag('start');
        };
        this.onEndHandleDown = (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.beginDrag('end');
        };
        this.onFillDown = (e) => {
            if (e.target.classList.contains('timespan-handle'))
                return;
            e.preventDefault();
            const { start } = this.getValue();
            if (!start)
                return;
            const rect = this.barEl.getBoundingClientRect();
            const clickMins = ((e.clientX - rect.left) / rect.width) * 1440;
            const startMins = this.toMinutes(start);
            this.beginDrag('move', clickMins - startMins);
        };
        this.onPointerMove = (e) => {
            if (!this.dragState)
                return;
            e.preventDefault();
            const { type, barLeft, barWidth, startMins, endMins, clickOffsetMins } = this.dragState;
            const pct = Math.max(0, Math.min(1, (e.clientX - barLeft) / barWidth));
            const rawMins = pct * 1440;
            if (type === 'start') {
                const newStart = Math.max(0, Math.min(endMins - 5, this.snap(rawMins)));
                this.startTimeInput.value = this.minutesToTime(newStart);
            }
            else if (type === 'end') {
                const newEnd = Math.max(startMins + 5, Math.min(1440, this.snap(rawMins)));
                this.endTimeInput.value = this.minutesToTime(newEnd);
            }
            else {
                const duration = endMins - startMins;
                const newStart = Math.max(0, Math.min(1440 - duration, this.snap(rawMins - clickOffsetMins)));
                this.startTimeInput.value = this.minutesToTime(newStart);
                this.endTimeInput.value = this.minutesToTime(newStart + duration);
            }
            this.updateUI();
            const { start, end } = this.getValue();
            if (this.onChange && start && end) {
                this.onChange(start, end);
            }
        };
        this.onPointerUp = () => {
            if (!this.dragState)
                return;
            this.dragState = null;
            this.barEl?.classList.remove('is-dragging');
        };
        const element = typeof elementOrSelector === 'string'
            ? (elementOrSelector.startsWith('#') || elementOrSelector.startsWith('.')
                ? document.querySelector(elementOrSelector)
                : document.getElementById(elementOrSelector))
            : elementOrSelector;
        if (!element) {
            throw new Error(`TimeSpanPicker: Element not found for "${elementOrSelector}"`);
        }
        this.container = element;
        this.onChange = options?.onChange;
        this.uid = `tsp-${Math.random().toString(36).slice(2, 9)}`;
        this.fromString = options?.fromString ?? 'From';
        this.toString = options?.toString ?? 'To';
        this.render();
        this.startTimeInput = this.queryInput('.timespan-start');
        this.endTimeInput = this.queryInput('.timespan-end');
        if (options?.defaultStart) {
            this.startTimeInput.value = options.defaultStart;
        }
        if (options?.defaultEnd) {
            this.endTimeInput.value = options.defaultEnd;
        }
        this.attachEventListeners();
        this.attachBarListeners();
        if (options?.defaultStart || options?.defaultEnd) {
            this.updateUI();
        }
    }
    queryInput(selector) {
        const input = this.container.querySelector(selector);
        if (!input) {
            throw new Error(`Input with selector "${selector}" not found`);
        }
        return input;
    }
    render() {
        const startId = `${this.uid}-start`;
        const endId = `${this.uid}-end`;
        this.container.innerHTML = `
      <div class="timespan-picker">
        <div class="timespan-field timespan-field-start">
          <label for="${startId}">${this.fromString}</label>
          <input type="time" class="timespan-start" id="${startId}"/>
        </div>

        <div class="timespan-center">
          <span class="timespan-arrow">→</span>
          <span class="timespan-duration"></span>
        </div>

        <div class="timespan-field timespan-field-end">
          <label for="${endId}">${this.toString}</label>
          <input type="time" class="timespan-end" id="${endId}"/>
        </div>
      </div>
      <div class="timespan-bar" aria-hidden="true">
        <div class="timespan-bar-fill">
          <div class="timespan-handle timespan-handle-start"></div>
          <div class="timespan-handle timespan-handle-end"></div>
        </div>
      </div>
    `;
    }
    attachEventListeners() {
        this.startTimeInput.addEventListener('change', this.handleStartChange);
        this.endTimeInput.addEventListener('change', this.handleEndChange);
    }
    attachBarListeners() {
        this.barEl = this.container.querySelector('.timespan-bar');
        this.barFillEl = this.container.querySelector('.timespan-bar-fill');
        this.startHandleEl = this.container.querySelector('.timespan-handle-start');
        this.endHandleEl = this.container.querySelector('.timespan-handle-end');
        this.startHandleEl?.addEventListener('pointerdown', this.onStartHandleDown);
        this.endHandleEl?.addEventListener('pointerdown', this.onEndHandleDown);
        this.barFillEl?.addEventListener('pointerdown', this.onFillDown);
        document.addEventListener('pointermove', this.onPointerMove);
        document.addEventListener('pointerup', this.onPointerUp);
    }
    beginDrag(type, clickOffsetMins = 0) {
        const { start, end } = this.getValue();
        if (!start || !end)
            return;
        const rect = this.barEl.getBoundingClientRect();
        this.dragState = {
            type,
            barLeft: rect.left,
            barWidth: rect.width,
            startMins: this.toMinutes(start),
            endMins: this.toMinutes(end),
            clickOffsetMins,
        };
        this.barEl?.classList.add('is-dragging');
    }
    toMinutes(time) {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    }
    minutesToTime(minutes) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
    snap(mins, step = 5) {
        return Math.round(mins / step) * step;
    }
    formatDuration(minutes) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h && m)
            return `${h}h ${m}m`;
        if (h)
            return `${h}h`;
        return `${m}m`;
    }
    updateUI() {
        const picker = this.container.querySelector('.timespan-picker');
        const durationEl = this.container.querySelector('.timespan-duration');
        const barFill = this.barFillEl ?? this.container.querySelector('.timespan-bar-fill');
        const start = this.startTimeInput.value;
        const end = this.endTimeInput.value;
        const isError = !!(start && end && start >= end);
        picker?.classList.toggle('is-error', isError);
        if (isError) {
            this.endTimeInput.setCustomValidity('End time must be after start time');
            if (durationEl)
                durationEl.textContent = '!';
            barFill?.classList.remove('is-active');
            return;
        }
        this.endTimeInput.setCustomValidity('');
        if (start && end && durationEl && barFill) {
            const startMins = this.toMinutes(start);
            const endMins = this.toMinutes(end);
            const duration = endMins - startMins;
            durationEl.textContent = this.formatDuration(duration);
            barFill.style.left = `${((startMins / 1440) * 100).toFixed(2)}%`;
            barFill.style.width = `${((duration / 1440) * 100).toFixed(2)}%`;
            barFill.classList.add('is-active');
        }
        else {
            if (durationEl)
                durationEl.textContent = '';
            if (barFill) {
                barFill.style.left = '0';
                barFill.style.width = '0';
                barFill.classList.remove('is-active');
            }
        }
    }
    handleChange() {
        this.updateUI();
        const { start, end } = this.getValue();
        if (this.onChange && start && end) {
            this.onChange(start, end);
        }
    }
    getValue() {
        return {
            start: this.startTimeInput.value,
            end: this.endTimeInput.value
        };
    }
    setValue(start, end) {
        this.startTimeInput.value = start;
        this.endTimeInput.value = end;
        this.handleChange();
    }
    reset() {
        this.startTimeInput.value = '';
        this.endTimeInput.value = '';
        this.endTimeInput.setCustomValidity('');
        const picker = this.container.querySelector('.timespan-picker');
        const durationEl = this.container.querySelector('.timespan-duration');
        picker?.classList.remove('is-error');
        if (durationEl)
            durationEl.textContent = '';
        if (this.barFillEl) {
            this.barFillEl.style.left = '0';
            this.barFillEl.style.width = '0';
            this.barFillEl.classList.remove('is-active');
        }
    }
    isValid() {
        const { start, end } = this.getValue();
        return !!(start && end && start < end);
    }
    destroy() {
        this.startTimeInput.removeEventListener('change', this.handleStartChange);
        this.endTimeInput.removeEventListener('change', this.handleEndChange);
        this.startHandleEl?.removeEventListener('pointerdown', this.onStartHandleDown);
        this.endHandleEl?.removeEventListener('pointerdown', this.onEndHandleDown);
        this.barFillEl?.removeEventListener('pointerdown', this.onFillDown);
        document.removeEventListener('pointermove', this.onPointerMove);
        document.removeEventListener('pointerup', this.onPointerUp);
    }
}
export { TimeSpanPicker };
