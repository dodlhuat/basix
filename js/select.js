import {utils} from "./utils.js";

let select = {};

// TODO: multiselect dropdowns
select.init = function (selector) {
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
            selected_value = utils.text(options[0])
        }
        html += '</div>'

        let div = document.createElement('div');
        div.className = 'select';
        div.id = selector.substring(1)
        div.innerHTML = html;
        element.parentNode.insertBefore(div, element);

        utils.getElement(selector + ' .selected-text').innerText = selected_value;

        element.remove()
    }

    return this;
}

// TODO: selektieren, deselektieren, werte zurückgeben

const buildOption = function (text, value, selected) {
    const selected_string = selected ? ' data-selected="true"' : '';
    return '<div class="option" data-value="' + value + '"' + selected_string + '>' + text + '</div>'
}

export {select};