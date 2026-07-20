type ThemeMode = 'light' | 'dark';
declare class Theme {
    private static readonly STORAGE_KEY;
    private static readonly isMac;
    private static root;
    private static elements;
    private static mediaQuery;
    static init(): void;
    private static getSavedTheme;
    private static saveTheme;
    private static getSystemTheme;
    private static getCurrentTheme;
    private static applyTheme;
    private static toggleTheme;
    private static bindToggleClick;
    private static bindKeyboardShortcut;
    private static bindSystemThemeChange;
    static getTheme(): ThemeMode;
    static setTheme(theme: ThemeMode): void;
    static resetToSystem(): void;
    static hasSavedPreference(): boolean;
}
export { Theme };
