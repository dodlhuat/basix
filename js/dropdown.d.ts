/** Configuration options for a Dropdown instance. */
interface DropdownOptions {
    closeOnSelect?: boolean;
    allowMultipleOpen?: boolean;
}
/** Event detail payload for the `dropdown-select` custom event. */
interface DropdownSelectDetail {
    text: string;
    element: HTMLElement;
}
/** Hierarchical dropdown menu with optional multi-open and close-on-select behaviour. */
declare class Dropdown {
    private container;
    private trigger;
    private menu;
    private options;
    private abortController;
    constructor(selector: string, options?: DropdownOptions);
    private init;
    private attachEventListeners;
    private setupItems;
    toggle(): void;
    close(): void;
    open(): void;
    private toggleSubmenu;
    private closeAllSubmenus;
    private handleSelection;
    destroy(): void;
}
export { Dropdown, DropdownSelectDetail };
