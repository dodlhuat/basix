import { escapeHtml } from './utils.js';

/** A single selectable option for a VirtualDropdown. */
interface DropdownOption {
    label: string;
    value: string | number;
}

/** Configuration for a VirtualDropdown instance. */
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

/** Virtualised dropdown that renders only visible items for performance with large option lists. */
class VirtualDropdown {
    private readonly container: HTMLElement;
    private readonly options: DropdownOption[];
    private readonly multiSelect: boolean;
    private readonly searchable: boolean;
    private readonly placeholder: string;
    private readonly renderLimit: number;
    private readonly itemHeight: number;
    private readonly onSelect: ((selectedValues: Array<string | number>) => void) | null;
    // Unique CSS anchor name for this instance — prevents conflicts when
    // multiple dropdowns exist on the same page.
    private readonly anchorName: string;

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

    private abortController = new AbortController();

    public constructor(config: VirtualDropdownConfig) {
        const containerElement = typeof config.container === 'string' ? document.querySelector<HTMLElement>(config.container) : config.container;

        if (!containerElement) {
            throw new Error('Container element not found');
        }

        this.container = containerElement;
        this.options = config.options || [];
        this.multiSelect = config.multiSelect ?? false;
        this.searchable = config.searchable ?? false;
        this.placeholder = config.placeholder || 'Select...';
        this.renderLimit = config.renderLimit ?? 20;
        this.itemHeight = config.itemHeight ?? 40;
        this.onSelect = config.onSelect ?? null;
        this.anchorName = `--vd-${Math.random().toString(36).slice(2, 9)}`;

        this.selectedValues = new Set();
        this.filteredOptions = [...this.options];
        this.isOpen = false;
        this.scrollTop = 0;

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
        <span class="trigger-text">${escapeHtml(this.placeholder)}</span>
        <span class="trigger-arrow" aria-hidden="true">▼</span>
      </div>
      <div class="dropdown-menu" popover="manual" role="listbox">
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

        // Wire up anchor positioning: each instance gets a unique anchor name
        // so multiple dropdowns on the same page don't interfere.
        this.trigger.style.setProperty('anchor-name', this.anchorName);
        this.menu.style.setProperty('position-anchor', this.anchorName);

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
        const sig = { signal: this.abortController.signal };

        this.trigger.addEventListener('click', () => this.toggle(), sig);

        this.trigger.addEventListener(
            'keydown',
            (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggle();
                } else if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            },
            sig,
        );

        // Close when clicking outside — popover="manual" does not auto-dismiss.
        document.addEventListener(
            'click',
            (e: MouseEvent) => {
                if (!this.container.contains(e.target as Node) && !this.menu.contains(e.target as Node)) {
                    this.close();
                }
            },
            sig,
        );

        if (this.searchable && this.searchInput) {
            this.searchInput.addEventListener(
                'input',
                (e: Event) => {
                    this.handleSearch((e.target as HTMLInputElement).value);
                },
                sig,
            );
        }

        this.listWrapper.addEventListener(
            'scroll',
            (e: Event) => {
                this.scrollTop = (e.target as HTMLElement).scrollTop;
                this.renderList();
            },
            sig,
        );

        // Sync state if the browser closes the popover externally.
        this.menu.addEventListener(
            'toggle',
            (e: Event) => {
                const te = e as ToggleEvent;
                if (te.newState === 'closed' && this.isOpen) {
                    this.isOpen = false;
                    this.container.classList.remove('open');
                    this.trigger.setAttribute('aria-expanded', 'false');
                }
            },
            sig,
        );
    }

    private toggle(): void {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    private open(): void {
        this.isOpen = true;
        this.container.classList.add('open');
        this.menu.showPopover();
        this.trigger.setAttribute('aria-expanded', 'true');
        this.renderList();

        if (this.searchable && this.searchInput) {
            this.searchInput.focus();
        }
    }

    private close(): void {
        this.isOpen = false;
        this.container.classList.remove('open');
        this.menu.hidePopover();
        this.trigger.setAttribute('aria-expanded', 'false');
    }

    private handleSearch(query: string): void {
        if (!query.trim()) {
            this.filteredOptions = [...this.options];
        } else {
            const lowerQuery = query.toLowerCase();
            this.filteredOptions = this.options.filter((opt) => opt.label.toLowerCase().includes(lowerQuery));
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
        const renderEnd = Math.min(this.filteredOptions.length, startIdx + this.renderLimit + buffer);

        const offsetY = renderStart * this.itemHeight;
        this.content.style.transform = `translateY(${offsetY}px)`;

        const visibleOptions = this.filteredOptions.slice(renderStart, renderEnd);

        this.content.innerHTML = visibleOptions
            .map((opt, idx) => {
                const realIdx = renderStart + idx;
                const isSelected = this.selectedValues.has(opt.value);
                return `
          <div class="dropdown-item ${isSelected ? 'selected' : ''}"
               data-value="${escapeHtml(String(opt.value))}"
               data-idx="${realIdx}"
               role="option"
               aria-selected="${isSelected}"
               tabindex="0"
               style="height: ${this.itemHeight}px; line-height: ${this.itemHeight}px;">
            ${this.multiSelect ? `<input type="checkbox" ${isSelected ? 'checked' : ''} tabindex="-1" aria-hidden="true">` : ''}
            <span class="item-label">${escapeHtml(opt.label)}</span>
          </div>
        `;
            })
            .join('');

        this.content.querySelectorAll('.dropdown-item').forEach((item) => {
            item.addEventListener('click', (e: Event) => {
                e.stopPropagation();
                const value = (item as HTMLElement).dataset.value;
                if (value) this.handleSelect(value);
            });
            item.addEventListener('keydown', (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const value = (item as HTMLElement).dataset.value;
                    if (value) this.handleSelect(value);
                }
            });
        });
    }

    private handleSelect(valueString: string): void {
        const selectedOpt = this.filteredOptions.find((o) => String(o.value) === valueString);

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

        this.onSelect?.(Array.from(this.selectedValues));
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
                const opt = this.options.find((o) => o.value === val);
                this.triggerText.textContent = opt ? opt.label : String(val);
            }
        }
    }

    public getValue(): Array<string | number> {
        return Array.from(this.selectedValues);
    }

    public setValue(values: Array<string | number>): void {
        this.selectedValues.clear();
        values.forEach((val) => {
            if (this.options.some((opt) => opt.value === val)) {
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
        if (this.isOpen) this.menu.hidePopover();
        this.abortController.abort();
        this.container.innerHTML = '';
        this.container.classList.remove('custom-dropdown', 'open');
    }
}

export { VirtualDropdown };
export type { DropdownOption, VirtualDropdownConfig };
