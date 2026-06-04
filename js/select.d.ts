declare class Select {
    private readonly element;
    private readonly isMultiselect;
    private readonly dropdown;
    private readonly documentClickHandler;
    constructor(elementOrSelector: string | HTMLSelectElement);
    destroy(): void;
    value(): string | string[];
    static init(elementOrSelector: string | HTMLSelectElement): (() => void) | null;
    private static initElement;
    private static closeAllDropdowns;
    private static handleMultiSelect;
    private static handleSingleSelect;
    private static transformSelect;
}
export { Select };
