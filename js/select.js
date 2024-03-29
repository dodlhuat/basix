import {utils} from "./utils.js";

let select = {
    init(selector) {
        const element = document.querySelector(selector);
        if (utils.isList(element)) {
            console.error('only allowed for single elements')
        } else {
            let html = '<div class="dropdown"><span class="selected-text"></span> <span class="icon arrow-down float-right"></span></div>';
            html += '<div class="options">';
            const options = document.querySelectorAll(selector + ' option');
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

            document.querySelector(selector + ' .selected-text').innerText = selected_value;

            element.remove();
            this.listen(div);
        }
    },
    listen(element) {
        const parent = element.querySelector('.options').getAttribute('data-parent')
        if (parent != null) {
            element.querySelector('.options').style.top = document.querySelector('#' + parent).clientHeight + 'px';
        }

        element.removeEventListener('mouseover', show);
        element.addEventListener('mouseover', show);

        element.removeEventListener('mouseleave', hide);
        element.addEventListener('mouseleave', hide);

        element.querySelector('.options').removeEventListener('click', selectOption);
        element.querySelector('.options').addEventListener('click', selectOption);
    },
    value(selector) {
        const element = document.querySelector(selector);
        let response = [];
        element.querySelectorAll('.option.selected').forEach(option => {
            response.push(option.dataset.value);
        })
        if (response.length === 1) return response[0];
        return response;
    },
};

const selectOption = function(event) {
    const isMultiple = event.currentTarget.parentNode.dataset.multiple == 'true'
    const selectedText = event.currentTarget.parentNode.querySelector('.selected-text');
    if (!isMultiple) {
        if (selectedText != null) {
            selectedText.innerText = event.target.innerText;
            event.currentTarget.parentNode.querySelectorAll('.option').forEach(option => {
                const value = option.dataset.value;
                if (value == event.target.dataset.value) {
                    option.classList.add('selected')
                } else {
                    option.classList.remove('selected')
                }
            })
        }
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