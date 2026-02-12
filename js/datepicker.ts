interface DatePickerLocales {
  days: string[];
  months: string[];
}

interface DatePickerOptions {
  mode?: 'single' | 'range';
  startDay?: number;
  timePicker?: boolean;
  locales?: DatePickerLocales;
  format?: (date: Date) => string;
  onSelect?: (date: Date | DateRange) => void;
}

interface DateRange {
  start: Date | null;
  end: Date | null;
}

type ViewMode = 'days' | 'months' | 'years';

class DatePicker {
  private input: HTMLInputElement | null;
  private options: DatePickerOptions;
  private currentDate: Date;
  private selectedDate: Date | null;
  private rangeStart: Date | null;
  private rangeEnd: Date | null;
  private viewYear: number;
  private viewMonth: number;
  private viewMode: ViewMode;
  private yearRangeStart: number;
  private selectedHours: number;
  private selectedMinutes: number;
  private calendar!: HTMLDivElement;
  private backdrop!: HTMLDivElement;
  private handleDocumentClick!: (e: Event) => void;


  constructor(elementOrSelector: string | HTMLInputElement, options: DatePickerOptions = {}) {
    this.input = typeof elementOrSelector === 'string'
      ? document.querySelector<HTMLInputElement>(elementOrSelector)
      : elementOrSelector;

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
        months: [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ]
      },
      format: timePicker
        ? (date: Date) => {
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${date.toDateString()} ${hours}:${minutes}`;
          }
        : (date: Date) => date.toDateString(),
      onSelect: () => {},
      ...options
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

  private init(): void {
    this.createCalendarElement();
    this.attachEvents();
    this.render();
  }

  private createCalendarElement(): void {
    this.calendar = document.createElement('div');
    this.calendar.className = 'datepicker';
    document.body.appendChild(this.calendar);

    this.backdrop = document.createElement('div');
    this.backdrop.className = 'datepicker-backdrop';
    document.body.appendChild(this.backdrop);

    this.backdrop.addEventListener('click', () => this.hide());
  }

  private attachEvents(): void {
    const toggle = (e: Event): void => {
      e.preventDefault();
      e.stopPropagation();

      if (this.calendar.classList.contains('visible')) {
        this.hide();
      } else {
        this.show();
      }
    };

    this.input?.addEventListener('click', toggle);

    this.backdrop.addEventListener('click', (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      this.hide();
    });

    this.handleDocumentClick = (e: Event): void => {
      if (this.calendar.classList.contains('mobile')) return;

      const target = e.target as Node;
      if (!this.calendar.contains(target) && target !== this.input) {
        this.hide();
      }
    };
  }

  private show(): void {
    const isMobile = window.innerWidth <= 640;

    if (isMobile) {
      this.calendar.classList.add('mobile');
      this.backdrop.classList.add('visible');
      document.body.style.overflow = 'hidden';

      this.calendar.style.top = '';
      this.calendar.style.left = '';
    } else {
      this.calendar.classList.remove('mobile');
      this.backdrop.classList.remove('visible');
      document.body.style.overflow = '';

      if (this.input) {
        const rect = this.input.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        this.calendar.style.top = `${rect.bottom + scrollTop + 5}px`;
        this.calendar.style.left = `${rect.left + scrollLeft}px`;

        if (rect.left + 320 > window.innerWidth) {
          this.calendar.style.left = `${rect.right + scrollLeft - 320}px`;
        }
      }

      setTimeout(() => {
        document.addEventListener('click', this.handleDocumentClick);
      }, 0);
    }

    this.calendar.classList.add('visible');
  }

  private hide(): void {
    this.calendar.classList.remove('visible');
    this.backdrop.classList.remove('visible');
    document.body.style.overflow = '';

    document.removeEventListener('click', this.handleDocumentClick);
  }

  private render(): void {
    this.calendar.innerHTML = '';

    const header = this.createHeader();
    let content: HTMLDivElement;

    if (this.viewMode === 'days') {
      content = this.createGrid();
    } else if (this.viewMode === 'months') {
      content = this.createMonthGrid();
    } else {
      content = this.createYearGrid();
    }

    this.calendar.appendChild(header);
    this.calendar.appendChild(content);

    if (this.options.timePicker && this.viewMode === 'days') {
      const timeSection = this.createTimePicker();
      this.calendar.appendChild(timeSection);
    }
  }

  private createHeader(): HTMLDivElement {
    const header = document.createElement('div');
    header.className = 'datepicker-header';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'datepicker-nav';
    prevBtn.innerHTML = '&lt;';
    prevBtn.onclick = (e: MouseEvent) => {
      e.stopPropagation();
      this.navigate(-1);
    };

    const title = document.createElement('div');
    title.className = 'datepicker-title';

    if (this.viewMode === 'days') {
      const monthBtn = document.createElement('button');
      monthBtn.className = 'datepicker-title-btn';

      monthBtn.textContent = this.options?.locales?.months[this.viewMonth] ?? '';
      monthBtn.onclick = (e: MouseEvent) => {
        e.stopPropagation();
        this.viewMode = 'months';
        this.render();
      };

      const yearBtn = document.createElement('button');
      yearBtn.className = 'datepicker-title-btn';
      yearBtn.textContent = String(this.viewYear);
      yearBtn.onclick = (e: MouseEvent) => {
        e.stopPropagation();
        this.viewMode = 'years';
        this.yearRangeStart = this.viewYear - (this.viewYear % 12);
        this.render();
      };

      title.appendChild(monthBtn);
      title.appendChild(yearBtn);
    } else if (this.viewMode === 'months') {
      const yearBtn = document.createElement('button');
      yearBtn.className = 'datepicker-title-btn';
      yearBtn.textContent = String(this.viewYear);
      yearBtn.onclick = (e: MouseEvent) => {
        e.stopPropagation();
        this.viewMode = 'years';
        this.yearRangeStart = this.viewYear - (this.viewYear % 12);
        this.render();
      };
      title.appendChild(yearBtn);
    } else {
      const rangeText = document.createElement('span');
      rangeText.style.fontWeight = '600';
      rangeText.textContent = `${this.yearRangeStart} - ${this.yearRangeStart + 11}`;
      title.appendChild(rangeText);
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = 'datepicker-nav';
    nextBtn.innerHTML = '&gt;';
    nextBtn.onclick = (e: MouseEvent) => {
      e.stopPropagation();
      this.navigate(1);
    };

    header.appendChild(prevBtn);
    header.appendChild(title);
    header.appendChild(nextBtn);

    return header;
  }

  private navigate(delta: number): void {
    if (this.viewMode === 'days') {
      this.changeMonth(delta);
    } else if (this.viewMode === 'months') {
      this.viewYear += delta;
      this.render();
    } else {
      this.yearRangeStart += delta * 12;
      this.render();
    }
  }

  private createMonthGrid(): HTMLDivElement {
    const grid = document.createElement('div');
    grid.className = 'datepicker-grid-months';

    this.options?.locales?.months.forEach((month, index) => {
      const el = document.createElement('div');
      el.className = 'datepicker-month';
      el.textContent = month.substring(0, 3);

      if (index === this.viewMonth) {
        el.classList.add('selected');
      }
      if (index === new Date().getMonth() && this.viewYear === new Date().getFullYear()) {
        el.classList.add('current');
      }

      el.onclick = (e: MouseEvent) => {
        e.stopPropagation();
        this.viewMonth = index;
        this.viewMode = 'days';
        this.render();
      };
      grid.appendChild(el);
    });

    return grid;
  }

  private createYearGrid(): HTMLDivElement {
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

      el.onclick = (e: MouseEvent) => {
        e.stopPropagation();
        this.viewYear = year;
        this.viewMode = 'months';
        this.render();
      };
      grid.appendChild(el);
    }

    return grid;
  }

  private createGrid(): HTMLDivElement {
    const grid = document.createElement('div');
    grid.className = 'datepicker-grid';

    const days = this.options?.locales?.days ?? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const startDay = this.options.startDay ?? 0;
    const adjustedDays = [...days.slice(startDay), ...days.slice(0, startDay)];

    adjustedDays.forEach(day => {
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
        if (selectedDay) selectedDay.setHours(0, 0, 0, 0);
        if (selectedDay && date.getTime() === selectedDay.getTime()) {
          day.classList.add('selected');
        }
      } else {
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

      day.onclick = (e: MouseEvent) => {
        e.stopPropagation();
        this.handleDateClick(date);
      };
      grid.appendChild(day);
    }

    return grid;
  }

  private createTimePicker(): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'datepicker-time';

    const label = document.createElement('div');
    label.className = 'datepicker-time-label';
    label.textContent = 'Time';
    wrapper.appendChild(label);

    const controls = document.createElement('div');
    controls.className = 'datepicker-time-controls';

    // Hours spinner
    const hoursSpinner = this.createSpinner(
      this.selectedHours,
      0,
      23,
      (value) => {
        this.selectedHours = value;
        this.applyTimeToSelection();
      }
    );

    const separator = document.createElement('span');
    separator.className = 'datepicker-time-separator';
    separator.textContent = ':';

    // Minutes spinner
    const minutesSpinner = this.createSpinner(
      this.selectedMinutes,
      0,
      59,
      (value) => {
        this.selectedMinutes = value;
        this.applyTimeToSelection();
      }
    );

    controls.appendChild(hoursSpinner);
    controls.appendChild(separator);
    controls.appendChild(minutesSpinner);
    wrapper.appendChild(controls);

    return wrapper;
  }

  private createSpinner(
    value: number,
    min: number,
    max: number,
    onChange: (value: number) => void
  ): HTMLDivElement {
    const spinner = document.createElement('div');
    spinner.className = 'datepicker-time-spinner';

    const upBtn = document.createElement('button');
    upBtn.className = 'datepicker-time-btn';
    upBtn.innerHTML = '&#9650;';
    upBtn.onclick = (e: MouseEvent) => {
      e.stopPropagation();
      const next = value + 1 > max ? min : value + 1;
      onChange(next);
      this.render();
    };

    const display = document.createElement('input');
    display.className = 'datepicker-time-display';
    display.type = 'text';
    display.inputMode = 'numeric';
    display.value = String(value).padStart(2, '0');
    display.maxLength = 2;

    display.addEventListener('click', (e: Event) => e.stopPropagation());
    display.addEventListener('focus', () => display.select());
    display.addEventListener('change', (e: Event) => {
      e.stopPropagation();
      let parsed = parseInt(display.value, 10);
      if (isNaN(parsed) || parsed < min || parsed > max) {
        display.value = String(value).padStart(2, '0');
        return;
      }
      onChange(parsed);
      this.render();
    });
    display.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const next = value + 1 > max ? min : value + 1;
        onChange(next);
        this.render();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = value - 1 < min ? max : value - 1;
        onChange(next);
        this.render();
      }
    });

    const downBtn = document.createElement('button');
    downBtn.className = 'datepicker-time-btn';
    downBtn.innerHTML = '&#9660;';
    downBtn.onclick = (e: MouseEvent) => {
      e.stopPropagation();
      const next = value - 1 < min ? max : value - 1;
      onChange(next);
      this.render();
    };

    spinner.appendChild(upBtn);
    spinner.appendChild(display);
    spinner.appendChild(downBtn);

    return spinner;
  }

  private applyTimeToSelection(): void {
    if (this.options.mode === 'single' && this.selectedDate) {
      this.selectedDate.setHours(this.selectedHours, this.selectedMinutes, 0, 0);
      this.updateInput(this.options!.format!(this.selectedDate));
      this.options!.onSelect!(this.selectedDate);
    } else if (this.options.mode === 'range') {
      if (this.rangeStart) {
        this.rangeStart.setHours(this.selectedHours, this.selectedMinutes, 0, 0);
      }
      if (this.rangeStart && this.rangeEnd) {
        const startDate = this.options!.format!(this.rangeStart);
        const endDate = this.options!.format!(this.rangeEnd);
        this.updateInput(`${startDate} - ${endDate}`);
      } else if (this.rangeStart) {
        this.updateInput(this.options!.format!(this.rangeStart) + ' - ...');
      }
      this.options!.onSelect!({ start: this.rangeStart, end: this.rangeEnd });
    }
  }

  private changeMonth(delta: number): void {
    this.viewMonth += delta;
    if (this.viewMonth > 11) {
      this.viewMonth = 0;
      this.viewYear++;
    } else if (this.viewMonth < 0) {
      this.viewMonth = 11;
      this.viewYear--;
    }
    this.render();
  }

  private handleDateClick(date: Date): void {
    if (this.options.timePicker) {
      date.setHours(this.selectedHours, this.selectedMinutes, 0, 0);
    } else {
      date.setHours(0, 0, 0, 0);
    }

    if (this.options.mode === 'single') {
      this.selectedDate = date;
      this.updateInput(this.options!.format!(this.selectedDate));
      this.options!.onSelect!(this.selectedDate);
      if (!this.options.timePicker) {
        this.hide();
      }
    } else {
      if (!this.rangeStart || (this.rangeStart && this.rangeEnd)) {
        this.rangeStart = date;
        this.rangeEnd = null;
        this.updateInput(this.options!.format!(this.rangeStart) + ' - ...');
      } else {
        if (date.getTime() < this.rangeStart.getTime()) {
          this.rangeEnd = this.rangeStart;
          this.rangeStart = date;
        } else {
          this.rangeEnd = date;
        }
        const startDate = this.options!.format!(this.rangeStart);
        const endDate = this.options!.format!(this.rangeEnd);
        if (startDate === endDate) {
          this.updateInput(startDate);
        } else {
          this.updateInput(`${startDate} - ${endDate}`);
        }
        if (!this.options.timePicker) {
          this.hide();
        }
      }
      this.options!.onSelect!({ start: this.rangeStart, end: this.rangeEnd });
    }
    this.render();
  }

  private updateInput(value: string): void {
    if (this.input) {
      this.input.value = value;
    }
  }
}

export { DatePicker };
export type { DatePickerOptions, DatePickerLocales, DateRange };