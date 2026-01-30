class Select {
    private readonly element: HTMLSelectElement;
    private readonly isMultiselect: boolean;

    constructor(elementOrSelector: string | HTMLSelectElement) {
        const element = typeof elementOrSelector === 'string'
            ? document.querySelector<HTMLSelectElement>(elementOrSelector)
            : elementOrSelector;

        if (!element) {
            throw new Error(`Select: Element not found for selector "${elementOrSelector}"`);
        }

        this.element = element;
        const result = Select.initElement(element);

        if (result === null) {
            throw new Error(`Select: Failed to initialize select for "${elementOrSelector}"`);
        }

        this.isMultiselect = result;
    }

    public value(): string | string[] | undefined {
        if (!this.element) {
            return undefined;
        }

        const selectedValues = Array.from(this.element.options)
            .filter(option => option.selected)
            .map(option => option.value);

        return this.isMultiselect ? selectedValues : selectedValues[0];
    }

    public static init(elementOrSelector: string | HTMLSelectElement): boolean | null {
        const element = typeof elementOrSelector === 'string'
            ? document.querySelector<HTMLSelectElement>(elementOrSelector)
            : elementOrSelector;

        if (!element) {
            return null;
        }

        return Select.initElement(element);
    }

    private static initElement(element: HTMLSelectElement): boolean | null {
        if (!Select.transformSelect(element)) {
            return null;
        }

        const selectGroup = element.closest('.select-group');
        if (!selectGroup) {
            throw new Error(`Select: Parent .select-group not found for "${element}"`);
        }

        const dropdown = selectGroup.querySelector('.dropdown') as HTMLElement | null;
        if (!dropdown) {
            throw new Error(`Select: Dropdown element not found for "${element}"`);
        }

        const selected = dropdown.querySelector('.dropdown-selected') as HTMLElement | null;
        const options = dropdown.querySelector('.dropdown-options') as HTMLElement | null;

        if (!selected || !options) {
            throw new Error(`Select: Required dropdown elements not found for "${element}"`);
        }

        const isMulti = dropdown.dataset.multi === 'true';

        // Toggle dropdown on selected element click
        selected.addEventListener('click', () => {
            Select.closeAllDropdowns(dropdown);
            dropdown.classList.toggle('open');
        });

        // Handle option selection
        options.addEventListener('click', (e: Event) => {
            const target = e.target as HTMLElement;

            if (!target.classList.contains('dropdown-option')) {
                return;
            }

            if (isMulti) {
                Select.handleMultiSelect(target, options, selected, element);
            } else {
                Select.handleSingleSelect(target, options, selected, dropdown, element);
            }
        });

        // Close dropdown when clicking the close icon
        const closeIcon = options.querySelector('.dropdown-options-icon') as HTMLElement | null;
        if (closeIcon) {
            closeIcon.addEventListener('click', () => {
                dropdown.classList.remove('open');
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e: Event) => {
            if (!dropdown.contains(e.target as Node)) {
                dropdown.classList.remove('open');
            }
        });

        return isMulti;
    }

    private static closeAllDropdowns(exceptDropdown?: HTMLElement): void {
        document.querySelectorAll('.dropdown').forEach(dropdown => {
            if (dropdown !== exceptDropdown) {
                dropdown.classList.remove('open');
            }
        });
    }

    private static handleMultiSelect(
        option: HTMLElement,
        optionsContainer: HTMLElement,
        selected: HTMLElement,
        selectElement: HTMLSelectElement
    ): void {
        option.classList.toggle('selected');

        const selectedOptions = Array.from(
            optionsContainer.querySelectorAll('.dropdown-option.selected')
        ) as HTMLElement[];

        const values = selectedOptions.map(opt => opt.textContent?.trim() || '');
        selected.textContent = values.length ? values.join(', ') : 'Select options';

        const selectedValues = selectedOptions.map(opt => opt.dataset.value || '');
        Array.from(selectElement.options).forEach(opt => {
            opt.selected = selectedValues.includes(opt.value);
        });
    }

    private static handleSingleSelect(
        option: HTMLElement,
        optionsContainer: HTMLElement,
        selected: HTMLElement,
        dropdown: HTMLElement,
        selectElement: HTMLSelectElement
    ): void {
        optionsContainer.querySelectorAll('.dropdown-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        option.classList.add('selected');
        selected.textContent = option.textContent?.trim() || '';
        dropdown.classList.remove('open');
        selectElement.value = option.dataset.value || '';
    }

    private static transformSelect(select: HTMLSelectElement): boolean {
        const parent = select.closest('.select-group') as HTMLElement | null;

        if (!parent) {
            return false;
        }

        const label = parent.querySelector('label');
        const isMulti = select.hasAttribute('multiple');
        const labelText = label?.textContent?.trim() || 'Select';

        // Create hidden wrapper for original select
        const hiddenWrapper = document.createElement('div');
        hiddenWrapper.classList.add('hidden');

        if (label) {
            hiddenWrapper.appendChild(label);
        }
        hiddenWrapper.appendChild(select);

        // Create dropdown structure
        const dropdown = document.createElement('div');
        dropdown.className = 'dropdown';
        dropdown.dataset.multi = String(isMulti);

        const dropdownSelected = document.createElement('div');
        dropdownSelected.className = 'dropdown-selected';
        dropdownSelected.textContent = labelText;

        const dropdownOptions = document.createElement('div');
        dropdownOptions.className = 'dropdown-options';

        // Add mobile menu
        const optionsMenu = document.createElement('div');
        optionsMenu.className = 'dropdown-options-menu hidden';
        optionsMenu.innerHTML = 'Select options<span class="dropdown-options-icon icon icon-close"></span>';
        dropdownOptions.appendChild(optionsMenu);

        // Create option elements
        Array.from(select.options).forEach(opt => {
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

export { Select };