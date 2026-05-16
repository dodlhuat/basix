class TimeSpanPicker {
    constructor(elementOrSelector, options) {
        this.dragState = null;
        this.handleChange = () => {
            this.updateUI();
            const start = this.startTimeInput.value;
            const end = this.endTimeInput.value;
            if (this.onChange && start && end) {
                this.onChange(start, end);
            }
        };
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
            const start = this.startTimeInput.value;
            if (!start)
                return;
            const rect = this.barEl.getBoundingClientRect();
            const clickMins = ((e.clientX - rect.left) / rect.width) * 1440;
            this.beginDrag('move', clickMins - this.toMinutes(start), rect);
        };
        this.onPointerMove = (e) => {
            if (!this.dragState)
                return;
            e.preventDefault();
            const { type, barLeft, barWidth, startMins, endMins, clickOffsetMins } = this.dragState;
            const pct = Math.max(0, Math.min(1, (e.clientX - barLeft) / barWidth));
            const rawMins = pct * 1440;
            let start = this.startTimeInput.value;
            let end = this.endTimeInput.value;
            if (type === 'start') {
                start = this.minutesToTime(Math.max(0, Math.min(endMins - 5, this.snap(rawMins))));
                this.startTimeInput.value = start;
            }
            else if (type === 'end') {
                end = this.minutesToTime(Math.max(startMins + 5, Math.min(1440, this.snap(rawMins))));
                this.endTimeInput.value = end;
            }
            else {
                const duration = endMins - startMins;
                const newStartMins = Math.max(0, Math.min(1440 - duration, this.snap(rawMins - clickOffsetMins)));
                start = this.minutesToTime(newStartMins);
                end = this.minutesToTime(newStartMins + duration);
                this.startTimeInput.value = start;
                this.endTimeInput.value = end;
            }
            this.updateUI();
            if (this.onChange)
                this.onChange(start, end);
        };
        this.onPointerUp = () => {
            if (!this.dragState)
                return;
            this.dragState = null;
            this.barEl.classList.remove('is-dragging');
            document.removeEventListener('pointermove', this.onPointerMove);
            document.removeEventListener('pointerup', this.onPointerUp);
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
        this.toLabel = options?.toString ?? 'To';
        this.render();
        this.startTimeInput = this.queryEl('.timespan-start');
        this.endTimeInput = this.queryEl('.timespan-end');
        if (options?.defaultStart)
            this.startTimeInput.value = options.defaultStart;
        if (options?.defaultEnd)
            this.endTimeInput.value = options.defaultEnd;
        this.attachEventListeners();
        this.attachBarListeners();
        if (options?.defaultStart || options?.defaultEnd) {
            this.updateUI();
        }
    }
    queryEl(selector) {
        const el = this.container.querySelector(selector);
        if (!el)
            throw new Error(`TimeSpanPicker: "${selector}" not found`);
        return el;
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
          <label for="${endId}">${this.toLabel}</label>
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
        this.startTimeInput.addEventListener('change', this.handleChange);
        this.endTimeInput.addEventListener('change', this.handleChange);
    }
    attachBarListeners() {
        this.pickerEl = this.queryEl('.timespan-picker');
        this.durationEl = this.queryEl('.timespan-duration');
        this.barEl = this.queryEl('.timespan-bar');
        this.barFillEl = this.queryEl('.timespan-bar-fill');
        this.startHandleEl = this.queryEl('.timespan-handle-start');
        this.endHandleEl = this.queryEl('.timespan-handle-end');
        this.startHandleEl.addEventListener('pointerdown', this.onStartHandleDown);
        this.endHandleEl.addEventListener('pointerdown', this.onEndHandleDown);
        this.barFillEl.addEventListener('pointerdown', this.onFillDown);
    }
    beginDrag(type, clickOffsetMins = 0, rect) {
        const start = this.startTimeInput.value;
        const end = this.endTimeInput.value;
        if (!start || !end)
            return;
        const barRect = rect ?? this.barEl.getBoundingClientRect();
        this.dragState = {
            type,
            barLeft: barRect.left,
            barWidth: barRect.width,
            startMins: this.toMinutes(start),
            endMins: this.toMinutes(end),
            clickOffsetMins,
        };
        this.barEl.classList.add('is-dragging');
        document.addEventListener('pointermove', this.onPointerMove);
        document.addEventListener('pointerup', this.onPointerUp);
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
    snap(mins) {
        return Math.round(mins / 5) * 5;
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
        const start = this.startTimeInput.value;
        const end = this.endTimeInput.value;
        const isError = !!(start && end && start >= end);
        this.pickerEl.classList.toggle('is-error', isError);
        if (isError) {
            this.endTimeInput.setCustomValidity('End time must be after start time');
            this.durationEl.textContent = '!';
            this.barFillEl.classList.remove('is-active');
            return;
        }
        this.endTimeInput.setCustomValidity('');
        if (start && end) {
            const startMins = this.toMinutes(start);
            const endMins = this.toMinutes(end);
            const duration = endMins - startMins;
            this.durationEl.textContent = this.formatDuration(duration);
            this.barFillEl.style.left = `${((startMins / 1440) * 100).toFixed(2)}%`;
            this.barFillEl.style.width = `${((duration / 1440) * 100).toFixed(2)}%`;
            this.barFillEl.classList.add('is-active');
        }
        else {
            this.durationEl.textContent = '';
            this.barFillEl.style.left = '0';
            this.barFillEl.style.width = '0';
            this.barFillEl.classList.remove('is-active');
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
        this.pickerEl.classList.remove('is-error');
        this.durationEl.textContent = '';
        this.barFillEl.style.left = '0';
        this.barFillEl.style.width = '0';
        this.barFillEl.classList.remove('is-active');
    }
    isValid() {
        const { start, end } = this.getValue();
        return !!(start && end && start < end);
    }
    destroy() {
        this.startTimeInput.removeEventListener('change', this.handleChange);
        this.endTimeInput.removeEventListener('change', this.handleChange);
        this.startHandleEl.removeEventListener('pointerdown', this.onStartHandleDown);
        this.endHandleEl.removeEventListener('pointerdown', this.onEndHandleDown);
        this.barFillEl.removeEventListener('pointerdown', this.onFillDown);
        document.removeEventListener('pointermove', this.onPointerMove);
        document.removeEventListener('pointerup', this.onPointerUp);
    }
}
export { TimeSpanPicker };
