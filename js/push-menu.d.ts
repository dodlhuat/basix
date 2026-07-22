interface PushMenuElements {
    navigation: HTMLElement | null;
    content: HTMLElement | null;
    menu: HTMLElement | null;
    header: HTMLElement | null;
    controlIcon: HTMLElement | null;
    backdrop: HTMLElement | null;
}
interface PushMenuOptions {
    iconBasePath?: string;
}
declare class PushMenu {
    private static iconBasePath;
    private static elements;
    private static initialized;
    private static panelStack;
    private static listeners;
    private static clickNavListeners;
    static init(options?: PushMenuOptions): void;
    private static buildPanels;
    private static extractSubPanels;
    static openPanel(panel: HTMLElement): void;
    static goBack(): void;
    private static resetPanels;
    private static handleNavigationChange;
    static pushToggle(): void;
    private static clickNav;
    private static handleBackdropClick;
    static open(): void;
    static close(): void;
    static isOpen(): boolean;
    static destroy(): void;
    static refresh(): void;
}
export { PushMenu, type PushMenuElements, type PushMenuOptions };
