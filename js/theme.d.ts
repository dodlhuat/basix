type ThemeMode = 'light' | 'dark';
declare class Theme {
    private static readonly STORAGE_KEY;
    private static root;
    private static elements;
    private static mediaQuery;
    /**
     * Initializes the theme system with toggle functionality and system preference detection
     */
    static init(): void;
    /**
     * Safely retrieves the saved theme from localStorage
     */
    private static getSavedTheme;
    /**
     * Safely saves the theme to localStorage
     */
    private static saveTheme;
    /**
     * Gets the system-preferred theme
     */
    private static getSystemTheme;
    /**
     * Gets the current active theme
     */
    private static getCurrentTheme;
    /**
     * Applies a theme to the document
     */
    private static applyTheme;
    /**
     * Toggles between light and dark theme
     */
    private static toggleTheme;
    /**
     * Binds click event to toggle button
     */
    private static bindToggleClick;
    /**
     * Binds keyboard shortcut (Ctrl/Cmd+J) for theme toggle
     */
    private static bindKeyboardShortcut;
    /**
     * Binds listener for system theme changes
     * Only applies if user hasn't explicitly saved a preference
     */
    private static bindSystemThemeChange;
    /**
     * Public API: Get the current theme
     */
    static getTheme(): ThemeMode;
    /**
     * Public API: Set the theme programmatically
     */
    static setTheme(theme: ThemeMode): void;
    /**
     * Public API: Reset to system preference
     */
    static resetToSystem(): void;
    /**
     * Public API: Check if user has a saved preference
     */
    static hasSavedPreference(): boolean;
}
export { Theme };
