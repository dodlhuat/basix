class DatePicker {
    constructor(selector, options = {}) {
        this.input = document.querySelector(selector);
        if (!this.input) {
            console.error(`DatePicker: Input element not found for selector "${selector}"`);
            return;
        }

        this.options = {
            mode: 'single', // 'single' or 'range'
            startDay: 0, // 0 = Sunday, 1 = Monday, etc.
            locales: {
                days: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
                months: [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                ]
            },
            format: (date) => date.toDateString(),
            onSelect: () => {
            },
            ...options
        };

        this.currentDate = new Date();
        this.selectedDate = null;
        this.rangeStart = null;
        this.rangeEnd = null;

        // Initialize with current month/year
        this.viewYear = this.currentDate.getFullYear();
        this.viewMonth = this.currentDate.getMonth();

        // View Mode: 'days', 'months', 'years'
        this.viewMode = 'days';
        this.yearRangeStart = this.viewYear - (this.viewYear % 12); // For year grid pagination

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

        // Create backdrop for mobile
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'datepicker-backdrop';
        document.body.appendChild(this.backdrop);

        this.backdrop.addEventListener('click', () => this.hide());
    }

    attachEvents() {
        // Input events
        const toggle = (e) => {
            e.preventDefault(); // Prevent default to avoid double firing
            e.stopPropagation();

            if (this.calendar.classList.contains('visible')) {
                this.hide();
            } else {
                this.show();
            }
        };

        // Use click for desktop and touchstart for mobile
        this.input.addEventListener('click', toggle);
        // this.input.addEventListener('touchstart', toggle); // Click handles touch on most modern browsers well enough for inputs

        // Use the backdrop for closing on mobile
        this.backdrop.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hide();
        });

        this.handleDocumentClick = (e) => {
            if (this.calendar.classList.contains('mobile')) return; // Mobile handled by backdrop

            if (!this.calendar.contains(e.target) && e.target !== this.input) {
                this.hide();
            }
        };
    }

    show() {
        const isMobile = window.innerWidth <= 640;

        if (isMobile) {
            this.calendar.classList.add('mobile');
            this.backdrop.classList.add('visible');
            document.body.style.overflow = 'hidden'; // Lock scroll

            // Reset inline styles that might interfere
            this.calendar.style.top = '';
            this.calendar.style.left = '';
        } else {
            this.calendar.classList.remove('mobile');
            this.backdrop.classList.remove('visible');
            document.body.style.overflow = '';

            // Position the calendar
            const rect = this.input.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

            this.calendar.style.top = `${rect.bottom + scrollTop + 5}px`;
            this.calendar.style.left = `${rect.left + scrollLeft}px`;

            // Basic viewport check (right edge)
            if (rect.left + 320 > window.innerWidth) {
                this.calendar.style.left = `${rect.right + scrollLeft - 320}px`;
            }

            // Add document listener for desktop
            setTimeout(() => {
                document.addEventListener('click', this.handleDocumentClick);
            }, 0);
        }

        this.calendar.classList.add('visible');
    }

    hide() {
        this.calendar.classList.remove('visible');
        this.backdrop.classList.remove('visible');
        document.body.style.overflow = '';

        // Remove document listeners
        document.removeEventListener('click', this.handleDocumentClick);
        // document.removeEventListener('touchstart', this.handleDocumentClick);
    }

    render() {
        this.calendar.innerHTML = '';

        const header = this.createHeader();
        let content;

        if (this.viewMode === 'days') {
            content = this.createGrid();
        } else if (this.viewMode === 'months') {
            content = this.createMonthGrid();
        } else if (this.viewMode === 'years') {
            content = this.createYearGrid();
        }

        this.calendar.appendChild(header);
        this.calendar.appendChild(content);
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
            monthBtn.textContent = this.options.locales.months[this.viewMonth];
            monthBtn.onclick = (e) => {
                e.stopPropagation();
                this.viewMode = 'months';
                this.render();
            };

            const yearBtn = document.createElement('button');
            yearBtn.className = 'datepicker-title-btn';
            yearBtn.textContent = this.viewYear;
            yearBtn.onclick = (e) => {
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
            yearBtn.textContent = this.viewYear;
            yearBtn.onclick = (e) => {
                e.stopPropagation();
                this.viewMode = 'years';
                this.yearRangeStart = this.viewYear - (this.viewYear % 12);
                this.render();
            };
            title.appendChild(yearBtn);
        } else if (this.viewMode === 'years') {
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
        } else if (this.viewMode === 'months') {
            this.viewYear += delta;
            this.render();
        } else if (this.viewMode === 'years') {
            this.yearRangeStart += (delta * 12);
            this.render();
        }
    }

    createMonthGrid() {
        const grid = document.createElement('div');
        grid.className = 'datepicker-grid-months';

        this.options.locales.months.forEach((month, index) => {
            const el = document.createElement('div');
            el.className = 'datepicker-month';
            el.textContent = month.substring(0, 3); // Short name

            if (index === this.viewMonth) {
                el.classList.add('selected');
            }
            if (index === new Date().getMonth() && this.viewYear === new Date().getFullYear()) {
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
            el.textContent = year;

            if (year === this.viewYear) {
                el.classList.add('selected');
            }
            if (year === new Date().getFullYear()) {
                el.classList.add('current');
            }

            el.onclick = (e) => {
                e.stopPropagation();
                this.viewYear = year;
                this.viewMode = 'months'; // Go to months after selecting year
                this.render();
            };
            grid.appendChild(el);
        }

        return grid;
    }

    createGrid() {
        const grid = document.createElement('div');
        grid.className = 'datepicker-grid';

        // Day Headers (adjusted for startDay)
        const days = this.options.locales.days;
        const startDay = this.options.startDay;
        const adjustedDays = [...days.slice(startDay), ...days.slice(0, startDay)];

        adjustedDays.forEach(day => {
            const el = document.createElement('div');
            el.className = 'datepicker-day-header';
            el.textContent = day;
            grid.appendChild(el);
        });

        // Days
        const firstDayOfMonth = new Date(this.viewYear, this.viewMonth, 1).getDay();
        const daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();

        // Calculate offset based on startDay
        const offset = (firstDayOfMonth - startDay + 7) % 7;

        // Previous month filler
        const prevMonthDays = new Date(this.viewYear, this.viewMonth, 0).getDate();
        for (let i = offset - 1; i >= 0; i--) {
            const day = document.createElement('div');
            day.className = 'datepicker-day other-month';
            day.textContent = prevMonthDays - i;
            grid.appendChild(day);
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            const day = document.createElement('div');
            day.className = 'datepicker-day';
            day.textContent = i;

            const date = new Date(this.viewYear, this.viewMonth, i);
            date.setHours(0, 0, 0, 0); // Normalize time

            // Check if today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (date.getTime() === today.getTime()) {
                day.classList.add('today');
            }

            // Selection Logic Styling
            if (this.options.mode === 'single') {
                if (this.selectedDate && date.getTime() === this.selectedDate.getTime()) {
                    day.classList.add('selected');
                }
            } else if (this.options.mode === 'range') {
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
                // Handle visual case where only start is selected but it acts as both
                if (start && !end && t === start) {
                    day.classList.add('selected'); // Or some other style to indicate it's the start
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

    changeMonth(delta) {
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

    handleDateClick(date) {
        // Normalize date just in case
        date.setHours(0, 0, 0, 0);

        if (this.options.mode === 'single') {
            this.selectedDate = date;
            this.updateInput(this.options.format(this.selectedDate));
            this.options.onSelect(this.selectedDate);
            this.hide();
        } else {
            if (!this.rangeStart || (this.rangeStart && this.rangeEnd)) {
                // Start new range
                this.rangeStart = date;
                this.rangeEnd = null;
                this.updateInput(this.options.format(this.rangeStart) + ' - ...');
            } else {
                // Complete range
                if (date.getTime() < this.rangeStart.getTime()) {
                    this.rangeEnd = this.rangeStart;
                    this.rangeStart = date;
                } else {
                    this.rangeEnd = date;
                }
                const startDate = `${this.options.format(this.rangeStart)}`;
                const endDate = `${this.options.format(this.rangeEnd)}`;
                if (startDate === endDate) {
                    this.updateInput(startDate);
                } else {
                    this.updateInput(`${startDate} - ${endDate}`);
                }
                this.hide(); // Close on range completion
            }
            this.options.onSelect({start: this.rangeStart, end: this.rangeEnd});
        }
        this.render();
    }

    updateInput(value) {
        if (this.input) {
            this.input.value = value;
        }
    }
}

export {DatePicker};