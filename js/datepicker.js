import {utils} from "./utils.js";

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
]

let daysShort = [
    'M',
    'T',
    'W',
    'T',
    'F',
    'S',
    'S',
]

let daysLong = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
]

const datepickerColumn = '<div class="datepicker-column">[element]</div>';
const datepickerElement = '<span class="day" data-index="[index]" data-day="[day]" data-month="[month]" data-year="[year]">[day]</span>';
const datepickerRow = '<div class="datepicker-row">';
const datepickerRowClosed = '</div>';
let selectedDate = {day: 0, month: 0, year: 0}
let currentMonth = 0;
let currentYear = 0;
let selectedInput = undefined;

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

const datepicker = {
    init() {
        document.querySelectorAll('.datepicker-input').forEach(datepickerElement => {
            datepickerElement.removeEventListener('click', clickDatepicker);
            datepickerElement.addEventListener('click', clickDatepicker);
        });
    },

    setDate(month, year) {
        const daysString = getMonth(month, year);
        const monthName = getMonthName(month);

        currentYear = year;
        currentMonth = month;

        document.querySelector('.datepicker-calendar .datepicker-days').innerHTML = daysString;
        document.querySelector('.datepicker-controls .month-name').innerText = monthName;
        document.querySelector('.datepicker-controls .year').innerText = year;

        document.querySelectorAll('.datepicker-days .day').forEach(dayElement => {
            dayElement.removeEventListener('click', clickEvent);
            dayElement.addEventListener('click', clickEvent);
        })
    },

    setDay(day, month, year) {
        const date = new Date(year, month, day);
        const dayIndex = daysData[startWith].indexOf(date.getDay());

        selectedDate.day = day;
        selectedDate.month = month;
        selectedDate.year = year;

        document.querySelector('.datepicker-header .day-name').innerText = daysLong[dayIndex];
        document.querySelector('.datepicker-header .date').innerText = date.toLocaleDateString();
    },

    setTranslation(parameters) {
        if (parameters.daysShort != undefined && parameters.daysShort.length === 7) {
            daysShort = parameters.daysShort;
        }
        if (parameters.daysLong != undefined && parameters.daysLong.length === 7) {
            daysLong = parameters.daysLong;
        }
        if (parameters.months != undefined && parameters.months.length === 12) {
            months = parameters.months;
        }
    }
}

document.querySelectorAll('.datepicker-days .day').forEach(dayElement => {
    dayElement.removeEventListener('click', clickEvent);
    dayElement.addEventListener('click', clickEvent)
})

const add = function () {
    let div = document.createElement('div');
    div.className = 'modal-wrapper hidden'
    div.innerHTML = template;
    document.querySelector('body').append(div);
}

const show = function() {
    document.querySelector('.month-year-picker').removeEventListener('click', clickYearSelector);
    document.querySelector('.month-year-picker').addEventListener('click', clickYearSelector);

    document.querySelector('.datepicker-select').removeEventListener('click', clickSelect);
    document.querySelector('.datepicker-select').addEventListener('click', clickSelect);

    document.querySelector('.datepicker .icon-navigate_before').removeEventListener('click', clickPrevioiusMonth);
    document.querySelector('.datepicker .icon-navigate_before').addEventListener('click', clickPrevioiusMonth);

    document.querySelector('.datepicker .icon-navigate_next').removeEventListener('click', clickNextMonth);
    document.querySelector('.datepicker .icon-navigate_next').addEventListener('click', clickNextMonth);

    document.querySelector('.modal-wrapper').classList.remove('hidden')
}

const clickNextMonth = function() {
    currentMonth++;
    if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
    }
    datepicker.setDate(currentMonth, currentYear);
}

const clickPrevioiusMonth = function() {
    currentMonth--;
    if (currentMonth === 0) {
        currentMonth = 12;
        currentYear--;
    }
    datepicker.setDate(currentMonth, currentYear);
}

const pad = function (number) {
    const s = "0" + number;
    return s.substring(s.length - 2);
}

const clickSelect = function () {
    selectedInput.value = selectedDate.year + '-' + pad(selectedDate.month + 1) + '-' + pad(selectedDate.day);
    hide();
}

const hide = function () {
    document.querySelector('.modal-wrapper').remove();
}

const clickDatepicker = function (event) {
    add();
    selectedInput = event.target;

    buildWeekNames();
    let today = new Date();
    if (selectedInput.value !== '') {
        today = new Date(selectedInput.value);
    }

    datepicker.setDate(today.getMonth() + 1, today.getFullYear())
    document.querySelector('.day[data-day="' + today.getDate() + '"]').click();

    datepicker.setDay(today.getDate(), today.getMonth(), today.getFullYear());

    selectedInput.blur();
    show();
}

const clickEvent = function (event) {
    const [day, month, year] = [parseInt(event.target.innerText), parseInt(event.target.getAttribute('data-month')), parseInt(event.target.getAttribute('data-year'))];
    const selectedElement = document.querySelector('.datepicker-days .day.selected');
    if (selectedElement !== null) {
        selectedElement.classList.remove('selected');
    }
    event.target.classList.add('selected');
    datepicker.setDay(day, (month - 1), year);
}

const clickYearSelector = function (event) {
    const currentYear = parseInt(event.target.parentElement.querySelector('.year').innerText);
    buildYearNames(currentYear);
    document.querySelector('.datepicker-calendar').classList.add('hidden');
    document.querySelector('.datepicker-years').classList.remove('hidden');

    document.querySelectorAll('.datepicker-years .datepicker-column').forEach(dayElement => {
        dayElement.removeEventListener('click', selectYearEvent);
        dayElement.addEventListener('click', selectYearEvent)
    })
}

const selectYearEvent = function (event) {
    const selectedYear = parseInt(event.target.innerText);

    datepicker.setDate(currentMonth, selectedYear)

    document.querySelector('.datepicker-years').classList.add('hidden');
    document.querySelector('.datepicker-calendar').classList.remove('hidden');
}


const getMonth = function (month, year) {
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

const getMonthName = function (month) {
    return months[--month];
}

const buildWeekNames = function () {
    let columns = '';
    for (const dayName in daysShort) {
        columns += datepickerColumn.replace('[element]', daysShort[dayName]);
    }
    document.querySelector('.datepicker-calendar .datepicker-day-names').innerHTML = datepickerRow + columns + datepickerRowClosed;
}

const buildYearNames = function (start) {
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



datepicker.setTranslation({
    daysShort: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
    daysLong: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
});

utils.ready(function () {
    datepicker.init();
});

export {datepicker}