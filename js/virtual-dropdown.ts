interface DropdownOption {
    label: string;
    value: string | number;
}

interface VirtualDropdownConfig {
    container: string | HTMLElement;
    options: DropdownOption[];
    multiSelect?: boolean;
    searchable?: boolean;
    placeholder?: string;
    renderLimit?: number;
    itemHeight?: number;
    onSelect?: (selectedValues: Array<string | number>) => void;
}

class VirtualDropdown {
    private readonly container: HTMLElement;
    private readonly options: DropdownOption[];
    private readonly multiSelect: boolean;
    private readonly searchable: boolean;
    private readonly placeholder: string;
    private readonly renderLimit: number;
    private readonly itemHeight: number;
    private readonly onSelect: ((selectedValues: Array<string | number>) => void) | null;

    private trigger!: HTMLElement;
    private triggerText!: HTMLElement;
    private menu!: HTMLElement;
    private listWrapper!: HTMLElement;
    private scroller!: HTMLElement;
    private spacer!: HTMLElement;
    private content!: HTMLElement;
    private searchInput?: HTMLInputElement;

    private selectedValues: Set<string | number>;
    private filteredOptions: DropdownOption[];
    private isOpen: boolean;
    private scrollTop: number;

    private boundHandlers: Map<string, EventListener>;

    constructor(config: VirtualDropdownConfig) {
        const containerElement = typeof config.container === 'string'
            ? document.querySelector<HTMLElement>(config.container)
            : config.container;

        if (!containerElement) {
            throw new Error('Container element not found');
        }

        this.container = containerElement;
        this.options = config.options || [];
        this.multiSelect = config.multiSelect ?? false;
        this.searchable = config.searchable ?? false;
        this.placeholder = config.placeholder || 'Select...';
        this.renderLimit = config.renderLimit || 20;
        this.itemHeight = config.itemHeight || 40;
        this.onSelect = config.onSelect ?? null;

        this.selectedValues = new Set();
        this.filteredOptions = [...this.options];
        this.isOpen = false;
        this.scrollTop = 0;
        this.boundHandlers = new Map();

        this.init();
    }

    private init(): void {
        this.container.classList.add('custom-dropdown');
        this.renderBase();
        this.bindEvents();
        this.updateTrigger();
    }

    private renderBase(): void {
        this.container.innerHTML = `
      <div class="dropdown-trigger" tabindex="0" role="button" aria-haspopup="listbox" aria-expanded="false">
        <span class="trigger-text">${this.escapeHtml(this.placeholder)}</span>
        <span class="trigger-arrow" aria-hidden="true">▼</span>
      </div>
      <div class="dropdown-menu" role="listbox">
        ${this.searchable ? '<div class="dropdown-search"><input type="text" placeholder="Search..." aria-label="Search options"></div>' : ''}
        <div class="dropdown-list-wrapper">
          <div class="dropdown-list-scroller">
            <div class="virtual-spacer"></div>
            <div class="virtual-content"></div>
          </div>
        </div>
      </div>
    `;

        this.trigger = this.querySelector('.dropdown-trigger');
        this.triggerText = this.querySelector('.trigger-text');
        this.menu = this.querySelector('.dropdown-menu');
        this.listWrapper = this.querySelector('.dropdown-list-wrapper');
        this.scroller = this.querySelector('.dropdown-list-scroller');
        this.spacer = this.querySelector('.virtual-spacer');
        this.content = this.querySelector('.virtual-content');

        if (this.searchable) {
            this.searchInput = this.querySelector('.dropdown-search input');
        }
    }

    private querySelector<T extends HTMLElement>(selector: string): T {
        const element = this.container.querySelector<T>(selector);
        if (!element) {
            throw new Error(`Required element not found: ${selector}`);
        }
        return element;
    }

    private bindEvents(): void {
        const handleTriggerClick = (): void => this.toggle();
        this.trigger.addEventListener('click', handleTriggerClick);
        this.boundHandlers.set('triggerClick', handleTriggerClick);

        const handleTriggerKeydown = (e: KeyboardEvent): void => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggle();
            } else if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        };
        this.trigger.addEventListener('keydown', handleTriggerKeydown as EventListener);
        this.boundHandlers.set('triggerKeydown', handleTriggerKeydown as EventListener);

        const handleDocumentClick = (e: MouseEvent): void => {
            if (!this.container.contains(e.target as Node)) {
                this.close();
            }
        };
        document.addEventListener('click', handleDocumentClick as EventListener);
        this.boundHandlers.set('documentClick', handleDocumentClick as EventListener);

        if (this.searchable && this.searchInput) {
            const handleSearchInput = (e: Event): void => {
                const target = e.target as HTMLInputElement;
                this.handleSearch(target.value);
            };
            this.searchInput.addEventListener('input', handleSearchInput);
            this.boundHandlers.set('searchInput', handleSearchInput);
        }

        const handleScroll = (e: Event): void => {
            const target = e.target as HTMLElement;
            this.scrollTop = target.scrollTop;
            this.renderList();
        };
        this.listWrapper.addEventListener('scroll', handleScroll);
        this.boundHandlers.set('scroll', handleScroll);
    }

    private toggle(): void {
        this.isOpen ? this.close() : this.open();
    }

    private open(): void {
        this.isOpen = true;
        this.container.classList.add('open');
        this.menu.classList.add('open');
        this.trigger.setAttribute('aria-expanded', 'true');
        this.renderList();

        if (this.searchable && this.searchInput) {
            this.searchInput.focus();
        }
    }

    private close(): void {
        this.isOpen = false;
        this.container.classList.remove('open');
        this.menu.classList.remove('open');
        this.trigger.setAttribute('aria-expanded', 'false');
    }

    private handleSearch(query: string): void {
        if (!query.trim()) {
            this.filteredOptions = [...this.options];
        } else {
            const lowerQuery = query.toLowerCase();
            this.filteredOptions = this.options.filter(opt =>
                opt.label.toLowerCase().includes(lowerQuery)
            );
        }

        this.listWrapper.scrollTop = 0;
        this.scrollTop = 0;
        this.renderList();
    }

    private renderList(): void {
        const totalHeight = this.filteredOptions.length * this.itemHeight;
        this.spacer.style.height = `${totalHeight}px`;

        const startIdx = Math.floor(this.scrollTop / this.itemHeight);
        const buffer = 5;
        const renderStart = Math.max(0, startIdx - buffer);
        const renderEnd = Math.min(
            this.filteredOptions.length,
            startIdx + this.renderLimit + buffer
        );

        const offsetY = renderStart * this.itemHeight;
        this.content.style.transform = `translateY(${offsetY}px)`;

        const visibleOptions = this.filteredOptions.slice(renderStart, renderEnd);

        this.content.innerHTML = visibleOptions
            .map((opt, idx) => {
                const realIdx = renderStart + idx;
                const isSelected = this.selectedValues.has(opt.value);
                return `
          <div class="dropdown-item ${isSelected ? 'selected' : ''}"
               data-value="${this.escapeHtml(String(opt.value))}"
               data-idx="${realIdx}"
               role="option"
               aria-selected="${isSelected}"
               tabindex="0"
               style="height: ${this.itemHeight}px; line-height: ${this.itemHeight}px;">
            ${this.multiSelect ? `<input type="checkbox" ${isSelected ? 'checked' : ''} tabindex="-1" aria-hidden="true">` : ''}
            <span class="item-label">${this.escapeHtml(opt.label)}</span>
          </div>
        `;
            })
            .join('');

        this.content.querySelectorAll('.dropdown-item').forEach(item => {
            const handleItemClick = (e: Event): void => {
                e.stopPropagation();
                const value = (item as HTMLElement).dataset.value;
                if (value) {
                    this.handleSelect(value);
                }
            };

            const handleItemKeydown = (e: KeyboardEvent): void => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const value = (item as HTMLElement).dataset.value;
                    if (value) {
                        this.handleSelect(value);
                    }
                }
            };

            item.addEventListener('click', handleItemClick);
            item.addEventListener('keydown', handleItemKeydown as EventListener);
        });
    }

    private handleSelect(valueString: string): void {
        const selectedOpt = this.filteredOptions.find(
            o => String(o.value) === valueString
        );

        if (!selectedOpt) return;

        const val = selectedOpt.value;

        if (this.multiSelect) {
            if (this.selectedValues.has(val)) {
                this.selectedValues.delete(val);
            } else {
                this.selectedValues.add(val);
            }
            this.renderList();
        } else {
            this.selectedValues.clear();
            this.selectedValues.add(val);
            this.close();
        }

        this.updateTrigger();

        if (this.onSelect) {
            this.onSelect(Array.from(this.selectedValues));
        }
    }

    private updateTrigger(): void {
        if (this.selectedValues.size === 0) {
            this.triggerText.textContent = this.placeholder;
            this.triggerText.classList.remove('has-value');
        } else {
            this.triggerText.classList.add('has-value');

            if (this.multiSelect) {
                const count = this.selectedValues.size;
                this.triggerText.textContent = `${count} item${count !== 1 ? 's' : ''} selected`;
            } else {
                const val = Array.from(this.selectedValues)[0];
                const opt = this.options.find(o => o.value === val);
                this.triggerText.textContent = opt ? opt.label : String(val);
            }
        }
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    public getValue(): Array<string | number> {
        return Array.from(this.selectedValues);
    }

    public setValue(values: Array<string | number>): void {
        this.selectedValues.clear();
        values.forEach(val => {
            if (this.options.some(opt => opt.value === val)) {
                this.selectedValues.add(val);
            }
        });
        this.updateTrigger();
        if (this.isOpen) {
            this.renderList();
        }
    }

    public clearSelection(): void {
        this.selectedValues.clear();
        this.updateTrigger();
        if (this.isOpen) {
            this.renderList();
        }
    }

    public destroy(): void {
        const triggerClick = this.boundHandlers.get('triggerClick');
        if (triggerClick) {
            this.trigger.removeEventListener('click', triggerClick);
        }

        const triggerKeydown = this.boundHandlers.get('triggerKeydown');
        if (triggerKeydown) {
            this.trigger.removeEventListener('keydown', triggerKeydown);
        }

        const documentClick = this.boundHandlers.get('documentClick');
        if (documentClick) {
            document.removeEventListener('click', documentClick);
        }

        const searchInput = this.boundHandlers.get('searchInput');
        if (searchInput && this.searchInput) {
            this.searchInput.removeEventListener('input', searchInput);
        }

        const scroll = this.boundHandlers.get('scroll');
        if (scroll) {
            this.listWrapper.removeEventListener('scroll', scroll);
        }

        this.boundHandlers.clear();

        this.container.innerHTML = '';
        this.container.classList.remove('custom-dropdown', 'open');
    }
}

export { VirtualDropdown, DropdownOption, VirtualDropdownConfig };