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


const startWith = 1;

const daysData = {
    1: [1, 2, 3, 4, 5, 6, 0],
    0: [0, 1, 2, 3, 4, 5, 6]
};

const datepicker = {
    init() {
        buildWeekNames();
        const today = new Date();
        buildYearNames(today.getFullYear());

        this.setDate(today.getMonth() + 1, today.getFullYear())
        document.querySelector('.day[data-day="' + today.getDate() + '"]').click();

        this.setDay(today.getDate(), today.getMonth(), today.getFullYear());
    },

    setDate(month, year) {
        const daysString = getMonth(month, year);
        const monthName = getMonthName(month);

        document.querySelectorAll('.datepicker-days .day').forEach(dayElement => {
            dayElement.removeEventListener('click', clickEvent);
        })

        document.querySelector('.datepicker-calendar .datepicker-days').innerHTML = daysString;
        document.querySelector('.datepicker-controls .month-name').innerText = monthName;
        document.querySelector('.datepicker-controls .year').innerText = year;

        document.querySelectorAll('.datepicker-days .day').forEach(dayElement => {
            dayElement.addEventListener('click', clickEvent);
        })

    },

    setDay(day, month, year) {
        const date = new Date(year, month, day);
        const dayIndex = daysData[startWith].indexOf(date.getDay());

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
    dayElement.addEventListener('click', clickEvent)
})

const clickEvent = function (event) {
    const [day, month, year] = [parseInt(event.target.innerText), parseInt(event.target.getAttribute('data-month')), parseInt(event.target.getAttribute('data-year'))];
    const selectedElement = document.querySelector('.datepicker-days .day.selected');
    if (selectedElement !== null) {
        selectedElement.classList.remove('selected');
    }
    event.target.classList.add('selected');
    datepicker.setDay(day, month, year);
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
    } else  {
        // remove started row
        daysString = daysString.substring(datepickerRow.length * -1);
    }


    return daysString;
}

const getMonthName = function (month) {
    return months[--month];
}

const buildWeekNames = function() {
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
        console.log(year);
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
datepicker.init();

export {datepicker}