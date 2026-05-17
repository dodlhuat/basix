/** Definition for a single context menu item including optional submenu. */
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
    /** Path to the SVG sprite file, e.g. `'svg-icons/icons.svg'`. Required to render icons. */
    spritePath?: string;
}
/** Right-click context menu with keyboard navigation and nested submenu support. */
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
