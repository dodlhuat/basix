interface ContextMenuItemDef {
    label: string;
    icon?: string;
    shortcut?: string;
    disabled?: boolean;
    destructive?: boolean;
    action?: (target: HTMLElement) => void;
    submenu?: ContextMenuInput[];
}
type ContextMenuInput = ContextMenuItemDef | 'separator' | {
    group: string;
};
declare class ContextMenu {
    private items;
    private targets;
    private menuEl;
    private currentTarget;
    private abortController;
    constructor(selectorOrElement: string | HTMLElement | HTMLElement[], items: ContextMenuInput[]);
    private init;
    private open;
    private close;
    private buildMenu;
    private buildItem;
    private closeAllSubmenus;
    private getFocusableItems;
    private moveFocus;
    private activateFocused;
    destroy(): void;
}
export { ContextMenu, type ContextMenuInput, type ContextMenuItemDef };
