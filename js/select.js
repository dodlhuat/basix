import {utils} from "./utils.js";

class Select {
    static initAll() {
        const elements = document.querySelectorAll('select');
        let counter = 1;
        elements.forEach(element => {
            const selectClass = 'select_' + counter;
            element.classList.add(selectClass);
            Select.init('.' + selectClass);
            counter++;
        });
    }
    static init(selector) {
        const element = document.querySelector(selector);
        if (utils.isList(element)) {
            console.error('only allowed for single elements')
        } else {
            let html = '<div class="dropdown"><span class="selected-text"></span> <span class="icon arrow-down float-right"></span></div>';
            html += '<div class="options">';
            const options = document.querySelectorAll(selector + ' option');
            let selected_value = '';
            let anySelected = false;
            for (let i = 0; i < options.length; i++) {
                const isSelected = options[i].hasAttribute('selected');
                html += Select.buildOption(utils.text(options[i]), utils.value(options[i]), isSelected);
                if (isSelected) {
                    selected_value = utils.text(options[i]);
                    anySelected = true;
                }
            }
            const isMultiple = document.querySelector(selector).hasAttribute('multiple');
            if (selected_value === '') {
                if (isMultiple) {
                    selected_value = 'nothing selected';
                } else if (options.length > 0) {
                    selected_value = utils.text(options[0]);
                }
            }
            html += '</div>';

            let div = document.createElement('div');
            div.className = 'select';
            div.classList.add(selector.substring(1));
            div.innerHTML = html;
            div.dataset.multiple = String(isMultiple);
            element.parentNode.insertBefore(div, element);

            // TODO: replace label with simple div!

            document.querySelector(selector + ' .selected-text').innerText = selected_value;

            // If no option was selected originally and this is a single select, mark first as selected
            if (!isMultiple && !anySelected) {
                const firstOption = div.querySelector('.option');
                if (firstOption) firstOption.classList.add('selected');
            }

            element.remove();
            Select.listen(div);
        }
    }

    // Attach listeners for a rendered custom select element
    static listen(element) {
        const parent = element.querySelector('.options').getAttribute('data-parent');
        if (parent != null) {
            element.querySelector('.options').style.top = document.querySelector('#' + parent).clientHeight + 'px';
        }

        element.removeEventListener('mouseover', Select.show);
        element.addEventListener('mouseover', Select.show);

        element.removeEventListener('mouseleave', Select.hide);
        element.addEventListener('mouseleave', Select.hide);

        const options = element.querySelector('.options');
        if (options) {
            options.removeEventListener('click', Select.selectOption);
            options.addEventListener('click', Select.selectOption);
        }
    }

    // Get current value(s) from a rendered custom select by its selector
    static value(selector) {
        const element = document.querySelector(selector);
        let response = [];
        element.querySelectorAll('.option.selected').forEach(option => {
            response.push(option.dataset.value);
        });
        if (response.length === 1) return response[0];
        return response;
    }

    // Event handlers and helpers
    static selectOption(event) {
        const isMultiple = event.currentTarget.parentNode.dataset.multiple == 'true';
        const selectedText = event.currentTarget.parentNode.querySelector('.selected-text');
        if (!isMultiple) {
            if (selectedText != null) {
                selectedText.innerText = event.target.innerText;
                event.currentTarget.parentNode.querySelectorAll('.option').forEach(option => {
                    const value = option.dataset.value;
                    if (value == event.target.dataset.value) {
                        option.classList.add('selected');
                    } else {
                        option.classList.remove('selected');
                    }
                });
            }
            event.currentTarget.parentNode.querySelector('.options').classList.remove('open');
        } else {
            const selectedElements = [];
            event.currentTarget.parentNode.querySelectorAll('.option').forEach(option => {
                const value = option.dataset.value;
                if (value === event.target.dataset.value) {
                    // toggle selection state for clicked option
                    if (option.classList.contains('selected')) {
                        option.classList.remove('selected');
                    } else {
                        option.classList.add('selected');
                    }
                }
                if (option.classList.contains('selected')) {
                    selectedElements.push(option.innerText);
                }
            });
            selectedText.innerText = selectedElements.length > 0 ? selectedElements.join(', ') : 'nothing selected';
        }
    }

    static show(event) {
        this.querySelector('.options').classList.add('open');
    }

    static hide(event) {
        this.querySelector('.options').classList.remove('open');
    }

    static buildOption(text, value, selected) {
        const selected_class = selected ? ' selected' : '';
        return '<div class="option' + selected_class + '" data-value="' + value + '">' + text + '</div>';
    }
}

// Backwards compatible export
const select = Select;
export { Select, select };