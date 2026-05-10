declare class Select {
    private readonly element;
    private readonly isMultiselect;
    private readonly dropdown;
    private readonly documentClickHandler;
    constructor(elementOrSelector: string | HTMLSelectElement);
    destroy(): void;
    value(): string | string[] | undefined;
    static init(elementOrSelector: string | HTMLSelectElement): boolean | null;
    private static initElement;
    private static closeAllDropdowns;
    private static handleMultiSelect;
    private static handleSingleSelect;
    private static transformSelect;
}
export { Select };
