class VirtualDropdown {
    constructor(config) {
        const containerElement = typeof config.container === 'string'
            ? document.querySelector(config.container)
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
    init() {
        this.container.classList.add('custom-dropdown');
        this.renderBase();
        this.bindEvents();
        this.updateTrigger();
    }
    renderBase() {
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
    querySelector(selector) {
        const element = this.container.querySelector(selector);
        if (!element) {
            throw new Error(`Required element not found: ${selector}`);
        }
        return element;
    }
    bindEvents() {
        const handleTriggerClick = () => this.toggle();
        this.trigger.addEventListener('click', handleTriggerClick);
        this.boundHandlers.set('triggerClick', handleTriggerClick);
        const handleTriggerKeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggle();
            }
            else if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        };
        this.trigger.addEventListener('keydown', handleTriggerKeydown);
        this.boundHandlers.set('triggerKeydown', handleTriggerKeydown);
        const handleDocumentClick = (e) => {
            if (!this.container.contains(e.target)) {
                this.close();
            }
        };
        document.addEventListener('click', handleDocumentClick);
        this.boundHandlers.set('documentClick', handleDocumentClick);
        if (this.searchable && this.searchInput) {
            const handleSearchInput = (e) => {
                const target = e.target;
                this.handleSearch(target.value);
            };
            this.searchInput.addEventListener('input', handleSearchInput);
            this.boundHandlers.set('searchInput', handleSearchInput);
        }
        const handleScroll = (e) => {
            const target = e.target;
            this.scrollTop = target.scrollTop;
            this.renderList();
        };
        this.listWrapper.addEventListener('scroll', handleScroll);
        this.boundHandlers.set('scroll', handleScroll);
    }
    toggle() {
        this.isOpen ? this.close() : this.open();
    }
    open() {
        this.isOpen = true;
        this.container.classList.add('open');
        this.menu.classList.add('open');
        this.trigger.setAttribute('aria-expanded', 'true');
        this.renderList();
        if (this.searchable && this.searchInput) {
            this.searchInput.focus();
        }
    }
    close() {
        this.isOpen = false;
        this.container.classList.remove('open');
        this.menu.classList.remove('open');
        this.trigger.setAttribute('aria-expanded', 'false');
    }
    handleSearch(query) {
        if (!query.trim()) {
            this.filteredOptions = [...this.options];
        }
        else {
            const lowerQuery = query.toLowerCase();
            this.filteredOptions = this.options.filter(opt => opt.label.toLowerCase().includes(lowerQuery));
        }
        this.listWrapper.scrollTop = 0;
        this.scrollTop = 0;
        this.renderList();
    }
    renderList() {
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
            const handleItemClick = (e) => {
                e.stopPropagation();
                const value = item.dataset.value;
                if (value) {
                    this.handleSelect(value);
                }
            };
            const handleItemKeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const value = item.dataset.value;
                    if (value) {
                        this.handleSelect(value);
                    }
                }
            };
            item.addEventListener('click', handleItemClick);
            item.addEventListener('keydown', handleItemKeydown);
        });
    }
    handleSelect(valueString) {
        const selectedOpt = this.filteredOptions.find(o => String(o.value) === valueString);
        if (!selectedOpt)
            return;
        const val = selectedOpt.value;
        if (this.multiSelect) {
            if (this.selectedValues.has(val)) {
                this.selectedValues.delete(val);
            }
            else {
                this.selectedValues.add(val);
            }
            this.renderList();
        }
        else {
            this.selectedValues.clear();
            this.selectedValues.add(val);
            this.close();
        }
        this.updateTrigger();
        if (this.onSelect) {
            this.onSelect(Array.from(this.selectedValues));
        }
    }
    updateTrigger() {
        if (this.selectedValues.size === 0) {
            this.triggerText.textContent = this.placeholder;
            this.triggerText.classList.remove('has-value');
        }
        else {
            this.triggerText.classList.add('has-value');
            if (this.multiSelect) {
                const count = this.selectedValues.size;
                this.triggerText.textContent = `${count} item${count !== 1 ? 's' : ''} selected`;
            }
            else {
                const val = Array.from(this.selectedValues)[0];
                const opt = this.options.find(o => o.value === val);
                this.triggerText.textContent = opt ? opt.label : String(val);
            }
        }
    }
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    getValue() {
        return Array.from(this.selectedValues);
    }
    setValue(values) {
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
    clearSelection() {
        this.selectedValues.clear();
        this.updateTrigger();
        if (this.isOpen) {
            this.renderList();
        }
    }
    destroy() {
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
export { VirtualDropdown };
