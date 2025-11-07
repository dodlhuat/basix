let months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

let daysShort = [
    'M',
    'T',
    'W',
    'T',
    'F',
    'S',
    'S',
];

let daysLong = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
];

const datepickerColumn = '<div class="datepicker-column">[element]</div>';
const datepickerElement = '<span class="day" data-index="[index]" data-day="[day]" data-month="[month]" data-year="[year]">[day]</span>';
const datepickerRow = '<div class="datepicker-row">';
const datepickerRowClosed = '</div>';

const template = '<div class="modal datepicker">\n' +
    '        <div class="datepicker-header">\n' +
    '            <div class="info-text">Select Date</div>\n' +
    '            <div class="selected-date"><span class="day-name"></span>, <span class="date"></span></div>\n' +
    '        </div>\n' +
    '        <div class="datepicker-controls">\n' +
    '            <div class="month-year-picker"><span class="month-name"></span> <span class="year"></span></div>\n' +
    '            <div class="icon icon-navigate_before"></div>\n' +
    '            <div class="icon icon-navigate_next"></div>\n' +
    '        </div>\n' +
    '        <div class="datepicker-calendar text-center">\n' +
    '            <div class="datepicker-day-names"></div>\n' +
    '            <div class="datepicker-days"></div>\n' +
    '        </div>\n' +
    '        <div class="datepicker-years text-center hidden"></div>\n' +
    '        <div class="datepicker-buttons">\n' +
    '            <button class="datepicker-cancel">Cancel</button>\n' +
    '            <button class="datepicker-select">Select</button>\n' +
    '        </div>\n' +
    '    </div>' +
    '    <div class="modal-background"></div>';

const startWith = 1;

const daysData = {
    1: [1, 2, 3, 4, 5, 6, 0],
    0: [0, 1, 2, 3, 4, 5, 6]
};

class Datepicker {
    constructor(input) {
        this.input = input;
        this.selectedDate = { day: 0, month: 0, year: 0 };
        this.currentMonth = 0;
        this.currentYear = 0;

        // bind handlers
        this.onClickDatepicker = this.onClickDatepicker.bind(this);
        this.onClickDay = this.onClickDay.bind(this);
        this.onClickNextMonth = this.onClickNextMonth.bind(this);
        this.onClickPrevMonth = this.onClickPrevMonth.bind(this);
        this.onClickSelect = this.onClickSelect.bind(this);
        this.onClickYearSelector = this.onClickYearSelector.bind(this);
        this.onSelectYear = this.onSelectYear.bind(this);
    }

    static initAll(selector = '.datepicker-input') {
        document.querySelectorAll(selector).forEach(el => {
            const instance = new Datepicker(el);
            el.removeEventListener('click', instance.onClickDatepicker);
            el.addEventListener('click', instance.onClickDatepicker);
        });
    }

    static setTranslation(parameters) {
        if (parameters.daysShort !== undefined && parameters.daysShort.length === 7) {
            daysShort = parameters.daysShort;
        }
        if (parameters.daysLong !== undefined && parameters.daysLong.length === 7) {
            daysLong = parameters.daysLong;
        }
        if (parameters.months !== undefined && parameters.months.length === 12) {
            months = parameters.months;
        }
    }

    // UI helpers
    addModal() {
        const div = document.createElement('div');
        div.className = 'modal-wrapper hidden';
        div.innerHTML = template;
        document.querySelector('body').append(div);
    }

    show() {
        document.querySelector('.month-year-picker').removeEventListener('click', this.onClickYearSelector);
        document.querySelector('.month-year-picker').addEventListener('click', this.onClickYearSelector);

        document.querySelector('.datepicker-select').removeEventListener('click', this.onClickSelect);
        document.querySelector('.datepicker-select').addEventListener('click', this.onClickSelect);

        document.querySelector('.datepicker .icon-navigate_before').removeEventListener('click', this.onClickPrevMonth);
        document.querySelector('.datepicker .icon-navigate_before').addEventListener('click', this.onClickPrevMonth);

        document.querySelector('.datepicker .icon-navigate_next').removeEventListener('click', this.onClickNextMonth);
        document.querySelector('.datepicker .icon-navigate_next').addEventListener('click', this.onClickNextMonth);

        document.querySelector('.modal-wrapper').classList.remove('hidden');
    }

    hide() {
        const wrapper = document.querySelector('.modal-wrapper');
        if (wrapper) wrapper.remove();
    }

    pad(number) {
        const s = '0' + number;
        return s.substring(s.length - 2);
    }

    onClickSelect() {
        this.input.value = this.selectedDate.year + '-' + this.pad(this.selectedDate.month + 1) + '-' + this.pad(this.selectedDate.day);
        this.hide();
    }

    onClickNextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 12) {
            this.currentMonth = 1;
            this.currentYear++;
        }
        this.setDate(this.currentMonth, this.currentYear);
    }

    onClickPrevMonth() {
        this.currentMonth--;
        if (this.currentMonth === 0) {
            this.currentMonth = 12;
            this.currentYear--;
        }
        this.setDate(this.currentMonth, this.currentYear);
    }

    onClickDatepicker(event) {
        this.addModal();
        this.input = event.target;

        this.buildWeekNames();
        let today = new Date();
        if (this.input.value !== '') {
            today = new Date(this.input.value);
        }

        this.setDate(today.getMonth() + 1, today.getFullYear());
        const preselect = document.querySelector('.day[data-day="' + today.getDate() + '"]');
        if (preselect) preselect.click();

        this.setDay(today.getDate(), today.getMonth(), today.getFullYear());

        this.input.blur();
        this.show();
    }

    onClickDay(event) {
        const [day, month, year] = [parseInt(event.target.innerText), parseInt(event.target.getAttribute('data-month')), parseInt(event.target.getAttribute('data-year'))];
        const selectedElement = document.querySelector('.datepicker-days .day.selected');
        if (selectedElement !== null) {
            selectedElement.classList.remove('selected');
        }
        event.target.classList.add('selected');
        this.setDay(day, (month - 1), year);
    }

    onClickYearSelector(event) {
        const currentYear = parseInt(event.target.parentElement.querySelector('.year').innerText);
        this.buildYearNames(currentYear);
        document.querySelector('.datepicker-calendar').classList.add('hidden');
        document.querySelector('.datepicker-years').classList.remove('hidden');

        document.querySelectorAll('.datepicker-years .datepicker-column').forEach(dayElement => {
            dayElement.removeEventListener('click', this.onSelectYear);
            dayElement.addEventListener('click', this.onSelectYear);
        });
    }

    onSelectYear(event) {
        const selectedYear = parseInt(event.target.innerText);
        this.setDate(this.currentMonth, selectedYear);
        document.querySelector('.datepicker-years').classList.add('hidden');
        document.querySelector('.datepicker-calendar').classList.remove('hidden');
    }

    setDate(month, year) {
        const daysString = this.getMonth(month, year);
        const monthName = this.getMonthName(month);

        this.currentYear = year;
        this.currentMonth = month;

        document.querySelector('.datepicker-calendar .datepicker-days').innerHTML = daysString;
        document.querySelector('.datepicker-controls .month-name').innerText = monthName;
        document.querySelector('.datepicker-controls .year').innerText = year;

        document.querySelectorAll('.datepicker-days .day').forEach(dayElement => {
            dayElement.removeEventListener('click', this.onClickDay);
            dayElement.addEventListener('click', this.onClickDay);
        });
    }

    setDay(day, month, year) {
        const date = new Date(year, month, day);
        const dayIndex = daysData[startWith].indexOf(date.getDay());

        this.selectedDate.day = day;
        this.selectedDate.month = month;
        this.selectedDate.year = year;

        document.querySelector('.datepicker-header .day-name').innerText = daysLong[dayIndex];
        document.querySelector('.datepicker-header .date').innerText = date.toLocaleDateString();
    }

    getMonth(month, year) {
        let daysString = datepickerRow;
        --month;
        let date = new Date(year, (month + 1), 0);
        const daysInMonth = date.getDate();
        date = new Date(year, month, 1);
        const firstDay = date.getDay();

        let current = 0;
        let startIndex = 0; // index of day
        let daysIndex = 0;

        for (const dayIndex in daysData[startWith]) {
            if (parseInt(dayIndex) === firstDay) {
                startIndex = parseInt(dayIndex);
                break;
            }
        }

        for (const [index, dayIndex] of daysData[startWith].entries()) {
            if (dayIndex !== startIndex) {
                daysString += datepickerColumn.replace('[element]', '');
            }
            if (dayIndex === startIndex) {
                daysIndex = index;
                break;
            }
        }
        do {
            current++;
            let el = datepickerElement
                .replace('[day]', current)
                .replace('[day]', current)
                .replace('[index]', daysIndex)
                .replace('[month]', (month + 1))
                .replace('[year]', year);
            daysString += datepickerColumn.replace('[element]', el);
            if (daysIndex < daysData[startWith].length - 1) {
                daysIndex++;
            } else {
                daysIndex = 0;
                daysString += datepickerRowClosed;
                daysString += datepickerRow;
            }
        } while (current < daysInMonth);

        if (daysIndex > 0) {
            for (const dayIndex in daysData[startWith]) {
                if (daysIndex <= daysData[startWith].length - 1) {
                    daysString += datepickerColumn.replace('[element]', '');
                    daysIndex++;
                } else {
                    break;
                }
            }
            daysString += datepickerRowClosed;
        } else {
            // remove started row
            daysString = daysString.substring(datepickerRow.length * -1);
        }

        return daysString;
    }

    getMonthName(month) {
        return months[--month];
    }

    buildWeekNames() {
        let columns = '';
        for (const dayName in daysShort) {
            columns += datepickerColumn.replace('[element]', daysShort[dayName]);
        }
        document.querySelector('.datepicker-calendar .datepicker-day-names').innerHTML = datepickerRow + columns + datepickerRowClosed;
    }

    buildYearNames(start) {
        const start_year = start - 8;
        const end_year = start + 11;
        let years = datepickerRow;
        for (let year = start_year; year <= end_year; year++) {
            const diff = year - start;
            if (diff % 4 === 0) {
                years += datepickerRowClosed;
                years += datepickerRow;
            }
            years += datepickerColumn.replace('[element]', year);
        }
        years += datepickerRowClosed;
        document.querySelector('.datepicker-years').innerHTML = years;
    }
}

// Optional: default German translation as before
Datepicker.setTranslation({
    daysShort: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
    daysLong: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
});

export { Datepicker }