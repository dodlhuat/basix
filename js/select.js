class Select {
    constructor(selector) {
        this.selector = selector;
        this.is_multiselect = Select.init(selector);
        return this;
    }

    value() {
        const data = Array.from(document.querySelector(this.selector).options).filter(function (option) {
            return option.selected;
        }).map(function (option) {
            return option.value;
        });
        if (this.is_multiselect) return data;
        return data[0];
    }

    static init(selector) {
        let element = document.querySelector(selector);
        if (element) {
            if (!Select.#transformSelect(element)) {
                return;
            }
        } else {
            console.error('select element not found');
            return;
        }

        let dropdown = element.closest('.select-group').querySelector('.dropdown');

        const selected = dropdown.querySelector('.dropdown-selected');
        const options = dropdown.querySelector('.dropdown-options');
        const multi = dropdown.dataset.multi === 'true';

        selected.addEventListener('click', () => {
            // Close others
            document.querySelectorAll('.dropdown').forEach(d => {
                if (d !== dropdown) d.classList.remove('open');
            });
            dropdown.classList.toggle('open');
        });
        options.addEventListener('click', e => {
            if (!e.target.classList.contains('dropdown-option')) return;
            const option = e.target;
            if (multi) {
                option.classList.toggle('selected');
                const values = [...options.querySelectorAll('.selected')].map(o => o.textContent);
                selected.textContent = values.length ? values.join(', ') : 'Select options';
                const selectedValues = [...options.querySelectorAll('.selected')].map(o => o.dataset.value);
                Array.from(element.options).forEach(opt => opt.selected = selectedValues.includes(opt.value));
            } else {
                options.querySelectorAll('.dropdown-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                selected.textContent = option.textContent;
                dropdown.classList.remove('open');
                element.value = option.dataset.value;
            }
        });

        // event listener on dropdown-options-icon
        options.querySelector('.dropdown-options-icon').addEventListener('click', (e) => {
            dropdown.classList.remove('open');
        });

        return multi;
    }

    static #transformSelect(select) {
        const parent = select.closest('.select-group');
        if (!parent) {
            console.error('select-group not defined');
            return;
        }
        const label = parent.querySelector('label');
        const isMulti = select.hasAttribute('multiple');
        const labelText = label ? label.textContent.trim() : 'Select';

        // Create wrapper for the original select
        const hiddenWrapper = document.createElement('div');
        hiddenWrapper.classList.add('hidden');

        // Move label and select inside hidden wrapper
        hiddenWrapper.appendChild(label);
        hiddenWrapper.appendChild(select);

        // Create dropdown structure
        const dropdown = document.createElement('div');
        dropdown.className = 'dropdown';
        dropdown.dataset.multi = isMulti;

        const dropdownSelected = document.createElement('div');
        dropdownSelected.className = 'dropdown-selected';
        dropdownSelected.textContent = labelText;

        const dropdownOptions = document.createElement('div');
        dropdownOptions.className = 'dropdown-options';

        // add menu for dropdown on mobile devices
        const optionsMenu = document.createElement('div');
        optionsMenu.className = 'dropdown-options-menu';
        optionsMenu.classList.add('hidden');
        optionsMenu.innerHTML = 'Select options<span class="dropdown-options-icon icon icon-close"></span>';
        dropdownOptions.appendChild(optionsMenu);

        // Create options
        [...select.options].forEach(opt => {
            const optDiv = document.createElement('div');
            optDiv.className = 'dropdown-option';
            optDiv.dataset.value = opt.value;
            optDiv.textContent = opt.textContent;
            dropdownOptions.appendChild(optDiv);
        });

        // Assemble dropdown
        dropdown.appendChild(dropdownSelected);
        dropdown.appendChild(dropdownOptions);

        // Replace original content
        parent.innerHTML = '';
        parent.appendChild(hiddenWrapper);
        parent.appendChild(dropdown);
        return true;
    }
}

export {Select};