import {utils} from "./utils.js";

let select = {
    init(selector) {
        const element = utils.getElement(selector);
        if (utils.isList(element)) {
            console.error('only allowed for single elements')
        } else {
            let html = '<div class="dropdown"><span class="selected-text"></span> <span class="icon arrow-down float-right"></span></div>';
            html += '<div class="options">';
            const options = utils.getElement(selector + ' option');
            let selected_value = ''
            for (let i = 0; i < options.length; i++) {
                const selected = options[i].hasAttribute('selected')
                html += buildOption(utils.text(options[i]), utils.value(options[i]), selected)
                if (selected) {
                    selected_value = utils.text(options[i]);
                }
            }
            if (selected_value === '') {
                // todo: if single select select first value, if multi select show "nothing selected"
                selected_value = utils.text(options[0])
            }
            html += '</div>'

            let div = document.createElement('div');
            div.className = 'select';
            div.id = selector.substring(1)
            div.innerHTML = html;
            div.dataset.multiple = document.querySelector(selector).hasAttribute('multiple')
            element.parentNode.insertBefore(div, element);

            utils.getElement(selector + ' .selected-text').innerText = selected_value;

            element.remove();

            div.removeEventListener('mouseover', show);
            div.addEventListener('mouseover', show);

            div.removeEventListener('mouseleave', hide);
            div.addEventListener('mouseleave', hide);

            div.querySelector('.options').removeEventListener('click', selectOption);
            div.querySelector('.options').addEventListener('click', selectOption);
        }

        return this;
    }
};

// TODO: selektieren, deselektieren, werte zurückgeben

const selectOption = function(event) {
    // console.log(event.target.dataset.value);
    // console.log(event.target.innerText);
    const isMultiple = event.currentTarget.parentNode.dataset.multiple == 'true'
    const selectedText = event.currentTarget.parentNode.querySelector('.selected-text');
    if (!isMultiple) {
        selectedText.innerText = event.target.innerText;
        event.currentTarget.parentNode.querySelectorAll('.option').forEach(option => {
            const value = option.dataset.value;
            if (value == event.target.dataset.value) {
                option.classList.add('selected')
            } else {
                option.classList.remove('selected')
            }
        })
        event.currentTarget.parentNode.querySelector('.options').classList.remove('open')
    } else {
        const selectedElements = [];
        event.currentTarget.parentNode.querySelectorAll('.option').forEach(option => {
            const value = option.dataset.value;
            if (value === event.target.dataset.value && !option.classList.contains('selected')) {
                option.classList.add('selected')
                selectedElements.push(option.innerText)
            } else if (value !== event.target.dataset.value && option.classList.contains('selected')) {
                selectedElements.push(option.innerText)
            } else {
                option.classList.remove('selected')
            }
        })
        console.log(selectedElements);
        selectedText.innerText = selectedElements.join(', ');
    }
}

const show = function(event) {
    this.querySelector('.options').classList.add('open')
}

const hide = function(event) {
    this.querySelector('.options').classList.remove('open')
}

const buildOption = function (text, value, selected) {
    const selected_class = selected ? ' selected' : '';
    return '<div class="option' + selected_class + '" data-value="' + value + '">' + text + '</div>'
}

export {select};