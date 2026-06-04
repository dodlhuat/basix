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
declare class VirtualDropdown {
    private readonly container;
    private readonly options;
    private readonly multiSelect;
    private readonly searchable;
    private readonly placeholder;
    private readonly renderLimit;
    private readonly itemHeight;
    private readonly onSelect;
    private readonly anchorName;
    private trigger;
    private triggerText;
    private menu;
    private listWrapper;
    private scroller;
    private spacer;
    private content;
    private searchInput?;
    private selectedValues;
    private filteredOptions;
    private isOpen;
    private scrollTop;
    private boundHandlers;
    constructor(config: VirtualDropdownConfig);
    private init;
    private renderBase;
    private querySelector;
    private bindEvents;
    private toggle;
    private open;
    private close;
    private handleSearch;
    private renderList;
    private handleSelect;
    private updateTrigger;
    getValue(): Array<string | number>;
    setValue(values: Array<string | number>): void;
    clearSelection(): void;
    destroy(): void;
}
export { VirtualDropdown, DropdownOption, VirtualDropdownConfig };
