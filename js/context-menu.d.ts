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
interface ContextMenuOptions {
    spritePath?: string;
}
declare class ContextMenu {
    private items;
    private targets;
    private menuEl;
    private currentTarget;
    private abortController;
    private spritePath;
    constructor(selectorOrElement: string | HTMLElement | HTMLElement[], items: ContextMenuInput[], options?: ContextMenuOptions);
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
export { ContextMenu, type ContextMenuInput, type ContextMenuItemDef, type ContextMenuOptions };
