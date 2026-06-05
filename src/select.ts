/** Enhances a native `<select>` element with a custom styled dropdown. */
class Select {
    private readonly element: HTMLSelectElement;
    private readonly isMultiselect: boolean;
    private readonly dropdown: HTMLElement | null;
    private readonly documentClickHandler: (e: Event) => void;

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

        this.isMultiselect = result.isMulti;
        this.dropdown = result.dropdown;

        this.documentClickHandler = (e: Event) => {
            if (this.dropdown && !this.dropdown.contains(e.target as Node)) {
                this.dropdown.classList.remove('open');
            }
        };
        document.addEventListener('click', this.documentClickHandler);
    }

    public destroy(): void {
        document.removeEventListener('click', this.documentClickHandler);
        this.dropdown?.classList.remove('open');
    }

    public value(): string | string[] {
        const selectedValues = Array.from(this.element.options)
            .filter(option => option.selected)
            .map(option => option.value);

        return this.isMultiselect ? selectedValues : selectedValues[0];
    }

    public static init(elementOrSelector: string | HTMLSelectElement): (() => void) | null {
        const element = typeof elementOrSelector === 'string'
            ? document.querySelector<HTMLSelectElement>(elementOrSelector)
            : elementOrSelector;

        if (!element) return null;

        const result = Select.initElement(element);
        if (!result) return null;

        const handler = (e: Event) => {
            if (!result.dropdown.contains(e.target as Node)) {
                result.dropdown.classList.remove('open');
            }
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }

    private static initElement(element: HTMLSelectElement): { isMulti: boolean; dropdown: HTMLElement } | null {
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

        selected.addEventListener('click', () => {
            Select.closeAllDropdowns(dropdown);
            dropdown.classList.toggle('open');
        });

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

        const closeIcon = options.querySelector('.dropdown-options-icon') as HTMLElement | null;
        if (closeIcon) {
            closeIcon.addEventListener('click', () => {
                dropdown.classList.remove('open');
            });
        }

        return { isMulti, dropdown };
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
        selectElement.dispatchEvent(new Event('change'));
    }

    private static transformSelect(select: HTMLSelectElement): boolean {
        const parent = select.closest('.select-group') as HTMLElement | null;

        if (!parent) {
            return false;
        }

        const label = parent.querySelector('label');
        const isMulti = select.hasAttribute('multiple');
        const labelText = label?.textContent?.trim() || 'Select';

        const hiddenWrapper = document.createElement('div');
        hiddenWrapper.classList.add('hidden');

        if (label) {
            hiddenWrapper.appendChild(label);
        }
        hiddenWrapper.appendChild(select);

        const dropdown = document.createElement('div');
        dropdown.className = 'dropdown';
        dropdown.dataset.multi = String(isMulti);

        const dropdownSelected = document.createElement('div');
        dropdownSelected.className = 'dropdown-selected';
        dropdownSelected.textContent = labelText;

        const dropdownOptions = document.createElement('div');
        dropdownOptions.className = 'dropdown-options';

        const optionsMenu = document.createElement('div');
        optionsMenu.className = 'dropdown-options-menu hidden';
        optionsMenu.innerHTML = 'Select options<span class="dropdown-options-icon icon icon-close"></span>';
        dropdownOptions.appendChild(optionsMenu);

        Array.from(select.options).forEach(opt => {
            const optDiv = document.createElement('div');
            optDiv.className = 'dropdown-option';
            optDiv.dataset.value = opt.value;
            optDiv.textContent = opt.textContent;
            dropdownOptions.appendChild(optDiv);
        });

        dropdown.appendChild(dropdownSelected);
        dropdown.appendChild(dropdownOptions);

        parent.innerHTML = '';
        parent.appendChild(hiddenWrapper);
        parent.appendChild(dropdown);

        return true;
    }
}

export { Select };