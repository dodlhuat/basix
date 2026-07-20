import { computePosition } from './position.js';
import { ListenerGroup } from './listeners.js';
class DatePicker {
    static CLOCK_OUTER_RADIUS_PERCENT = 38;
    static CLOCK_INNER_RADIUS_PERCENT = 23;
    input;
    options;
    currentDate;
    selectedDate;
    rangeStart;
    rangeEnd;
    viewYear;
    viewMonth;
    viewMode;
    yearRangeStart;
    selectedHours;
    selectedMinutes;
    calendar;
    backdrop;
    clockMode = 'hours';
    listeners = new ListenerGroup();
    showListeners = null;
    clockListeners = null;
    constructor(elementOrSelector, options = {}) {
        this.input = typeof elementOrSelector === 'string' ? document.querySelector(elementOrSelector) : elementOrSelector;
        if (!this.input) {
            throw new Error(`DatePicker: Element not found for selector "${elementOrSelector}"`);
        }
        const timePicker = options.timePicker ?? false;
        this.options = {
            mode: 'single',
            startDay: 0,
            timePicker,
            locales: {
                days: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
                months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            },
            format: timePicker
                ? (date) => {
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    return `${date.toDateString()} ${hours}:${minutes}`;
                }
                : (date) => date.toDateString(),
            onSelect: () => { },
            ...options,
        };
        this.currentDate = new Date();
        this.selectedDate = null;
        this.rangeStart = null;
        this.rangeEnd = null;
        this.viewYear = this.currentDate.getFullYear();
        this.viewMonth = this.currentDate.getMonth();
        this.viewMode = 'days';
        this.yearRangeStart = this.viewYear - (this.viewYear % 12);
        this.selectedHours = this.currentDate.getHours();
        this.selectedMinutes = this.currentDate.getMinutes();
        this.init();
    }
    init() {
        this.createCalendarElement();
        this.attachEvents();
        this.render();
    }
    createCalendarElement() {
        this.calendar = document.createElement('div');
        this.calendar.className = 'datepicker';
        document.body.appendChild(this.calendar);
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'datepicker-backdrop';
        document.body.appendChild(this.backdrop);
    }
    attachEvents() {
        const toggle = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.calendar.classList.contains('visible')) {
                this.hide();
            }
            else {
                this.show();
            }
        };
        const sig = { signal: this.listeners.signal };
        this.input?.addEventListener('click', toggle, sig);
        this.backdrop.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hide();
        }, sig);
    }
    show() {
        if (this.options.timePicker) {
            this.clockMode = 'hours';
            this.renderTimePicker();
        }
        const isMobile = window.innerWidth <= 640;
        if (isMobile) {
            this.calendar.classList.add('mobile');
            this.backdrop.classList.add('visible');
            document.body.style.overflow = 'hidden';
            this.calendar.style.top = '';
            this.calendar.style.left = '';
        }
        else {
            this.calendar.classList.remove('mobile');
            this.backdrop.classList.remove('visible');
            document.body.style.overflow = '';
            if (this.input) {
                this.calendar.style.display = 'block';
                this.calendar.style.visibility = 'hidden';
                const calRect = this.calendar.getBoundingClientRect();
                this.calendar.style.display = '';
                this.calendar.style.visibility = '';
                const { left, top } = computePosition(this.input.getBoundingClientRect(), calRect, { placement: 'bottom', align: 'start', offset: 5 });
                this.calendar.style.top = `${top}px`;
                this.calendar.style.left = `${left}px`;
            }
            setTimeout(() => {
                if (this.calendar.classList.contains('visible')) {
                    this.showListeners = new ListenerGroup();
                    document.addEventListener('click', (e) => {
                        const target = e.target;
                        if (!this.calendar.contains(target) && target !== this.input) {
                            this.hide();
                        }
                    }, { signal: this.showListeners.signal });
                }
            }, 0);
        }
        this.calendar.classList.add('visible');
    }
    hide() {
        this.calendar.classList.remove('visible');
        this.backdrop.classList.remove('visible');
        document.body.style.overflow = '';
        this.showListeners?.destroy();
        this.showListeners = null;
    }
    render() {
        this.calendar.innerHTML = '';
        const header = this.createHeader();
        let content;
        if (this.viewMode === 'days') {
            content = this.createGrid();
        }
        else if (this.viewMode === 'months') {
            content = this.createMonthGrid();
        }
        else {
            content = this.createYearGrid();
        }
        this.calendar.appendChild(header);
        this.calendar.appendChild(content);
        if (this.options.timePicker && this.viewMode === 'days') {
            this.calendar.appendChild(this.createTimePicker());
            const setBtn = document.createElement('button');
            setBtn.className = 'datepicker-set-btn';
            setBtn.textContent = 'Set';
            setBtn.onclick = (e) => {
                e.stopPropagation();
                this.hide();
            };
            this.calendar.appendChild(setBtn);
        }
    }
    renderTimePicker() {
        if (!this.options.timePicker || this.viewMode !== 'days')
            return;
        const existing = this.calendar.querySelector('.datepicker-clock');
        if (!existing) {
            this.render();
            return;
        }
        existing.replaceWith(this.createTimePicker());
    }
    createHeader() {
        const header = document.createElement('div');
        header.className = 'datepicker-header';
        const prevBtn = document.createElement('button');
        prevBtn.className = 'datepicker-nav';
        prevBtn.innerHTML = '&lt;';
        prevBtn.onclick = (e) => {
            e.stopPropagation();
            this.navigate(-1);
        };
        const title = document.createElement('div');
        title.className = 'datepicker-title';
        if (this.viewMode === 'days') {
            const monthBtn = document.createElement('button');
            monthBtn.className = 'datepicker-title-btn';
            monthBtn.textContent = this.options?.locales?.months[this.viewMonth] ?? '';
            monthBtn.onclick = (e) => {
                e.stopPropagation();
                this.viewMode = 'months';
                this.render();
            };
            const yearBtn = document.createElement('button');
            yearBtn.className = 'datepicker-title-btn';
            yearBtn.textContent = String(this.viewYear);
            yearBtn.onclick = (e) => {
                e.stopPropagation();
                this.viewMode = 'years';
                this.yearRangeStart = this.viewYear - (this.viewYear % 12);
                this.render();
            };
            title.appendChild(monthBtn);
            title.appendChild(yearBtn);
        }
        else if (this.viewMode === 'months') {
            const yearBtn = document.createElement('button');
            yearBtn.className = 'datepicker-title-btn';
            yearBtn.textContent = String(this.viewYear);
            yearBtn.onclick = (e) => {
                e.stopPropagation();
                this.viewMode = 'years';
                this.yearRangeStart = this.viewYear - (this.viewYear % 12);
                this.render();
            };
            title.appendChild(yearBtn);
        }
        else {
            const rangeText = document.createElement('span');
            rangeText.style.fontWeight = '600';
            rangeText.textContent = `${this.yearRangeStart} - ${this.yearRangeStart + 11}`;
            title.appendChild(rangeText);
        }
        const nextBtn = document.createElement('button');
        nextBtn.className = 'datepicker-nav';
        nextBtn.innerHTML = '&gt;';
        nextBtn.onclick = (e) => {
            e.stopPropagation();
            this.navigate(1);
        };
        header.appendChild(prevBtn);
        header.appendChild(title);
        header.appendChild(nextBtn);
        return header;
    }
    navigate(delta) {
        if (this.viewMode === 'days') {
            this.changeMonth(delta);
        }
        else if (this.viewMode === 'months') {
            this.viewYear += delta;
            this.render();
        }
        else {
            this.yearRangeStart += delta * 12;
            this.render();
        }
    }
    createMonthGrid() {
        const grid = document.createElement('div');
        grid.className = 'datepicker-grid-months';
        const now = new Date();
        this.options?.locales?.months.forEach((month, index) => {
            const el = document.createElement('div');
            el.className = 'datepicker-month';
            el.textContent = month.substring(0, 3);
            if (index === this.viewMonth) {
                el.classList.add('selected');
            }
            if (index === now.getMonth() && this.viewYear === now.getFullYear()) {
                el.classList.add('current');
            }
            el.onclick = (e) => {
                e.stopPropagation();
                this.viewMonth = index;
                this.viewMode = 'days';
                this.render();
            };
            grid.appendChild(el);
        });
        return grid;
    }
    createYearGrid() {
        const grid = document.createElement('div');
        grid.className = 'datepicker-grid-years';
        for (let i = 0; i < 12; i++) {
            const year = this.yearRangeStart + i;
            const el = document.createElement('div');
            el.className = 'datepicker-year';
            el.textContent = String(year);
            if (year === this.viewYear) {
                el.classList.add('selected');
            }
            if (year === new Date().getFullYear()) {
                el.classList.add('current');
            }
            el.onclick = (e) => {
                e.stopPropagation();
                this.viewYear = year;
                this.viewMode = 'months';
                this.render();
            };
            grid.appendChild(el);
        }
        return grid;
    }
    createGrid() {
        const grid = document.createElement('div');
        grid.className = 'datepicker-grid';
        const days = this.options?.locales?.days ?? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        const startDay = this.options.startDay ?? 0;
        const adjustedDays = [...days.slice(startDay), ...days.slice(0, startDay)];
        adjustedDays.forEach((day) => {
            const el = document.createElement('div');
            el.className = 'datepicker-day-header';
            el.textContent = day;
            grid.appendChild(el);
        });
        const firstDayOfMonth = new Date(this.viewYear, this.viewMonth, 1).getDay();
        const daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
        const offset = (firstDayOfMonth - startDay + 7) % 7;
        const prevMonthDays = new Date(this.viewYear, this.viewMonth, 0).getDate();
        for (let i = offset - 1; i >= 0; i--) {
            const day = document.createElement('div');
            day.className = 'datepicker-day other-month';
            day.textContent = String(prevMonthDays - i);
            grid.appendChild(day);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            const day = document.createElement('div');
            day.className = 'datepicker-day';
            day.textContent = String(i);
            const date = new Date(this.viewYear, this.viewMonth, i);
            date.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (date.getTime() === today.getTime()) {
                day.classList.add('today');
            }
            if (this.options.mode === 'single') {
                const selectedDay = this.selectedDate ? new Date(this.selectedDate) : null;
                if (selectedDay)
                    selectedDay.setHours(0, 0, 0, 0);
                if (selectedDay && date.getTime() === selectedDay.getTime()) {
                    day.classList.add('selected');
                }
            }
            else {
                const t = date.getTime();
                const start = this.rangeStart ? this.rangeStart.getTime() : null;
                const end = this.rangeEnd ? this.rangeEnd.getTime() : null;
                if (start && t === start) {
                    day.classList.add('range-start');
                }
                if (end && t === end) {
                    day.classList.add('range-end');
                }
                if (start && end && t > start && t < end) {
                    day.classList.add('in-range');
                }
                if (start && !end && t === start) {
                    day.classList.add('selected');
                }
            }
            day.onclick = (e) => {
                e.stopPropagation();
                this.handleDateClick(date);
            };
            grid.appendChild(day);
        }
        return grid;
    }
    createTimePicker() {
        this.clockListeners?.destroy();
        this.clockListeners = new ListenerGroup();
        const wrapper = document.createElement('div');
        wrapper.className = 'datepicker-clock';
        wrapper.appendChild(this.createClockHeader());
        wrapper.appendChild(this.createClockFace());
        return wrapper;
    }
    createClockHeader() {
        const header = document.createElement('div');
        header.className = 'datepicker-clock-header';
        const display = document.createElement('div');
        display.className = 'datepicker-clock-display';
        const hourSeg = document.createElement('span');
        hourSeg.className = 'datepicker-clock-display-segment';
        hourSeg.classList.toggle('active', this.clockMode === 'hours');
        hourSeg.textContent = String(this.selectedHours).padStart(2, '0');
        hourSeg.onclick = (e) => {
            e.stopPropagation();
            this.clockMode = 'hours';
            this.renderTimePicker();
        };
        const separator = document.createElement('span');
        separator.className = 'datepicker-clock-display-separator';
        separator.textContent = ':';
        const minuteSeg = document.createElement('span');
        minuteSeg.className = 'datepicker-clock-display-segment';
        minuteSeg.classList.toggle('active', this.clockMode === 'minutes');
        minuteSeg.textContent = String(this.selectedMinutes).padStart(2, '0');
        minuteSeg.onclick = (e) => {
            e.stopPropagation();
            this.clockMode = 'minutes';
            this.renderTimePicker();
        };
        display.appendChild(hourSeg);
        display.appendChild(separator);
        display.appendChild(minuteSeg);
        header.appendChild(display);
        return header;
    }
    createClockFace() {
        const face = document.createElement('div');
        face.className = 'datepicker-clock-face';
        const center = document.createElement('div');
        center.className = 'datepicker-clock-center';
        face.appendChild(center);
        const hand = document.createElement('div');
        hand.className = 'datepicker-clock-hand';
        face.appendChild(hand);
        if (this.clockMode === 'hours') {
            for (let slot = 0; slot < 12; slot++) {
                const outerValue = slot * 2;
                const innerValue = slot * 2 + 1;
                face.appendChild(this.createClockNumber(outerValue, this.clockPosition(slot, 12, DatePicker.CLOCK_OUTER_RADIUS_PERCENT), outerValue === this.selectedHours, false));
                face.appendChild(this.createClockNumber(innerValue, this.clockPosition(slot, 12, DatePicker.CLOCK_INNER_RADIUS_PERCENT), innerValue === this.selectedHours, true));
            }
        }
        else {
            for (let slot = 0; slot < 12; slot++) {
                const value = slot * 5;
                const isSelected = Math.round(this.selectedMinutes / 5) % 12 === slot;
                face.appendChild(this.createClockNumber(value, this.clockPosition(slot, 12, DatePicker.CLOCK_OUTER_RADIUS_PERCENT), isSelected, false));
            }
        }
        const activeValue = this.clockMode === 'hours' ? this.selectedHours : this.selectedMinutes;
        this.positionHand(hand, activeValue);
        this.bindClockDrag(face, hand);
        return face;
    }
    createClockNumber(value, position, selected, inner) {
        const number = document.createElement('div');
        number.className = 'datepicker-clock-number';
        number.classList.toggle('inner', inner);
        number.classList.toggle('selected', selected);
        number.style.left = `${position.x}%`;
        number.style.top = `${position.y}%`;
        number.textContent = String(value).padStart(2, '0');
        return number;
    }
    clockPosition(index, count, radiusPercent) {
        const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
        const x = 50 + radiusPercent * Math.cos(angle);
        const y = 50 + radiusPercent * Math.sin(angle);
        return { x, y };
    }
    positionHand(hand, value) {
        if (this.clockMode === 'hours') {
            const slot = Math.floor(value / 2) % 12;
            const isInner = value % 2 === 1;
            hand.style.transform = `rotate(${(slot / 12) * 360}deg)`;
            hand.style.height = `${isInner ? DatePicker.CLOCK_INNER_RADIUS_PERCENT : DatePicker.CLOCK_OUTER_RADIUS_PERCENT}%`;
        }
        else {
            hand.style.transform = `rotate(${(value / 60) * 360}deg)`;
            hand.style.height = `${DatePicker.CLOCK_OUTER_RADIUS_PERCENT}%`;
        }
    }
    bindClockDrag(face, hand) {
        const sig = { signal: this.clockListeners.signal };
        let dragging = false;
        const valueFromPointer = (e) => {
            const rect = face.getBoundingClientRect();
            const dx = e.clientX - (rect.left + rect.width / 2);
            const dy = e.clientY - (rect.top + rect.height / 2);
            const angle = Math.atan2(dy, dx) + Math.PI / 2;
            const normalized = (angle / (2 * Math.PI) + 1) % 1;
            const slot = Math.round(normalized * 12) % 12;
            let value;
            if (this.clockMode === 'hours') {
                const distancePercent = (Math.sqrt(dx * dx + dy * dy) / rect.width) * 100;
                const ringThreshold = (DatePicker.CLOCK_OUTER_RADIUS_PERCENT + DatePicker.CLOCK_INNER_RADIUS_PERCENT) / 2;
                value = distancePercent > ringThreshold ? slot * 2 : slot * 2 + 1;
            }
            else {
                value = Math.round(normalized * 60) % 60;
            }
            this.positionHand(hand, value);
            return value;
        };
        face.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            face.setPointerCapture(e.pointerId);
            dragging = true;
            valueFromPointer(e);
        }, sig);
        face.addEventListener('pointermove', (e) => {
            if (!dragging)
                return;
            valueFromPointer(e);
        }, sig);
        for (const type of ['pointerup', 'pointercancel']) {
            face.addEventListener(type, (e) => {
                if (!dragging)
                    return;
                dragging = false;
                this.selectClockValue(valueFromPointer(e));
            }, sig);
        }
    }
    selectClockValue(value) {
        if (this.clockMode === 'hours') {
            this.selectedHours = value;
            this.applyTimeToSelection();
            this.clockMode = 'minutes';
        }
        else {
            this.selectedMinutes = value;
            this.applyTimeToSelection();
        }
        this.renderTimePicker();
    }
    applyTimeToSelection() {
        if (this.options.mode === 'single' && this.selectedDate) {
            this.selectedDate.setHours(this.selectedHours, this.selectedMinutes, 0, 0);
            this.updateInput(this.options.format(this.selectedDate));
            this.options.onSelect(this.selectedDate);
        }
        else if (this.options.mode === 'range') {
            if (this.rangeStart) {
                this.rangeStart.setHours(this.selectedHours, this.selectedMinutes, 0, 0);
            }
            if (this.rangeStart && this.rangeEnd) {
                const startDate = this.options.format(this.rangeStart);
                const endDate = this.options.format(this.rangeEnd);
                this.updateInput(`${startDate} - ${endDate}`);
            }
            else if (this.rangeStart) {
                this.updateInput(this.options.format(this.rangeStart) + ' - ...');
            }
            this.options.onSelect({ start: this.rangeStart, end: this.rangeEnd });
        }
    }
    changeMonth(delta) {
        this.viewMonth += delta;
        if (this.viewMonth > 11) {
            this.viewMonth = 0;
            this.viewYear++;
        }
        else if (this.viewMonth < 0) {
            this.viewMonth = 11;
            this.viewYear--;
        }
        this.render();
    }
    handleDateClick(date) {
        if (this.options.timePicker) {
            date.setHours(this.selectedHours, this.selectedMinutes, 0, 0);
        }
        else {
            date.setHours(0, 0, 0, 0);
        }
        if (this.options.mode === 'single') {
            this.selectedDate = date;
            this.updateInput(this.options.format(this.selectedDate));
            this.options.onSelect(this.selectedDate);
            if (!this.options.timePicker) {
                this.hide();
            }
        }
        else {
            if (!this.rangeStart || (this.rangeStart && this.rangeEnd)) {
                this.rangeStart = date;
                this.rangeEnd = null;
                this.updateInput(this.options.format(this.rangeStart) + ' - ...');
            }
            else {
                if (date.getTime() < this.rangeStart.getTime()) {
                    this.rangeEnd = this.rangeStart;
                    this.rangeStart = date;
                }
                else {
                    this.rangeEnd = date;
                }
                const startDate = this.options.format(this.rangeStart);
                const endDate = this.options.format(this.rangeEnd);
                if (startDate === endDate) {
                    this.updateInput(startDate);
                }
                else {
                    this.updateInput(`${startDate} - ${endDate}`);
                }
                if (!this.options.timePicker) {
                    this.hide();
                }
            }
            this.options.onSelect({ start: this.rangeStart, end: this.rangeEnd });
        }
        this.render();
    }
    updateInput(value) {
        if (this.input) {
            this.input.value = value;
        }
    }
    destroy() {
        this.hide();
        this.listeners.destroy();
        this.clockListeners?.destroy();
        this.calendar.remove();
        this.backdrop.remove();
    }
}
export { DatePicker };
