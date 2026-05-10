interface DropdownOptions {
    closeOnSelect?: boolean;
    allowMultipleOpen?: boolean;
}
interface DropdownSelectDetail {
    text: string;
    element: HTMLElement;
}
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
    /**
     * Cleanup method to remove event listeners
     */
    destroy(): void;
}
export { Dropdown, DropdownSelectDetail };
