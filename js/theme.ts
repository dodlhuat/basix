type ThemeMode = 'light' | 'dark';

interface ThemeElements {
    toggleBtn: HTMLElement;
    icon: HTMLElement;
    status: HTMLElement | null;
}

class Theme {
    private static readonly STORAGE_KEY = 'theme';
    private static root: HTMLElement;
    private static elements: ThemeElements | null = null;
    private static mediaQuery: MediaQueryList | null = null;

    /**
     * Initializes the theme system with toggle functionality and system preference detection
     */
    public static init(): void {
        this.root = document.documentElement;

        // Get DOM elements
        const toggleBtn = document.getElementById('theme-toggle');
        const icon = document.getElementById('theme-icon');
        const status = document.getElementById('status');

        // Validate required elements
        if (!toggleBtn || !icon) {
            console.error('Theme toggle: missing DOM elements', { toggleBtn, icon });
            if (status) {
                status.textContent = 'Error: missing toggle elements (check IDs).';
            }
            return;
        }

        this.elements = { toggleBtn, icon, status };

        // Initialize media query
        if (window.matchMedia) {
            this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        }

        // Apply initial theme
        const savedTheme = this.getSavedTheme();
        const systemTheme = this.getSystemTheme();
        const initialTheme = savedTheme || systemTheme;
        this.applyTheme(initialTheme);

        // Bind event listeners
        this.bindToggleClick();
        this.bindKeyboardShortcut();
        this.bindSystemThemeChange();
    }

    /**
     * Safely retrieves the saved theme from localStorage
     */
    private static getSavedTheme(): ThemeMode | null {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            return saved === 'dark' || saved === 'light' ? saved : null;
        } catch (e) {
            console.warn('localStorage.getItem failed', e);
            return null;
        }
    }

    /**
     * Safely saves the theme to localStorage
     */
    private static saveTheme(theme: ThemeMode): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, theme);
        } catch (e) {
            console.warn('localStorage.setItem failed', e);
        }
    }

    /**
     * Gets the system-preferred theme
     */
    private static getSystemTheme(): ThemeMode {
        return this.mediaQuery?.matches ? 'dark' : 'light';
    }

    /**
     * Gets the current active theme
     */
    private static getCurrentTheme(): ThemeMode {
        const current = this.root.getAttribute('data-theme');
        return current === 'dark' ? 'dark' : 'light';
    }

    /**
     * Applies a theme to the document
     */
    private static applyTheme(theme: ThemeMode): void {
        if (!this.elements) return;

        this.root.setAttribute('data-theme', theme);

        const isDark = theme === 'dark';
        const { toggleBtn, icon } = this.elements;

        // Update button state
        toggleBtn.setAttribute('aria-pressed', String(isDark));
        toggleBtn.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);

        // Update icon classes
        if (isDark) {
            icon.classList.remove('icon-light');
            icon.classList.add('icon-dark');
        } else {
            icon.classList.remove('icon-dark');
            icon.classList.add('icon-light');
        }
    }

    /**
     * Toggles between light and dark theme
     */
    private static toggleTheme(): void {
        if (!this.elements) return;

        try {
            const current = this.getCurrentTheme();
            const next: ThemeMode = current === 'dark' ? 'light' : 'dark';

            this.saveTheme(next);
            this.applyTheme(next);
        } catch (err) {
            console.error('Error toggling theme', err);
            if (this.elements.status) {
                this.elements.status.textContent = 'Error toggling theme (see console).';
            }
        }
    }

    /**
     * Binds click event to toggle button
     */
    private static bindToggleClick(): void {
        if (!this.elements) return;

        this.elements.toggleBtn.addEventListener('click', () => {
            this.toggleTheme();
        });
    }

    /**
     * Binds keyboard shortcut (Ctrl/Cmd+J) for theme toggle
     */
    private static bindKeyboardShortcut(): void {
        window.addEventListener('keydown', (ev: KeyboardEvent) => {
            const isMac = /Mac|iPhone|iPod|iPad/i.test(navigator.platform);
            const modifierPressed = isMac ? ev.metaKey : ev.ctrlKey;

            if (modifierPressed && ev.key.toLowerCase() === 'j') {
                ev.preventDefault();
                this.toggleTheme();
            }
        });
    }

    /**
     * Binds listener for system theme changes
     * Only applies if user hasn't explicitly saved a preference
     */
    private static bindSystemThemeChange(): void {
        if (!this.mediaQuery) return;

        const handler = (e: MediaQueryListEvent | MediaQueryList): void => {
            // Only apply system theme if user hasn't saved a preference
            if (!this.getSavedTheme()) {
                const matches = 'matches' in e ? e.matches : (e as MediaQueryList).matches;
                this.applyTheme(matches ? 'dark' : 'light');
            }
        };

        // Modern API
        if ('addEventListener' in this.mediaQuery) {
            this.mediaQuery.addEventListener('change', handler as (e: MediaQueryListEvent) => void);
        }
        // Legacy API (deprecated but still supported in older browsers)
        else if ('addListener' in this.mediaQuery) {
            (this.mediaQuery as any).addListener(handler);
        }
    }

    /**
     * Public API: Get the current theme
     */
    public static getTheme(): ThemeMode {
        return this.getCurrentTheme();
    }

    /**
     * Public API: Set the theme programmatically
     */
    public static setTheme(theme: ThemeMode): void {
        this.saveTheme(theme);
        this.applyTheme(theme);
    }

    /**
     * Public API: Reset to system preference
     */
    public static resetToSystem(): void {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            const systemTheme = this.getSystemTheme();
            this.applyTheme(systemTheme);
        } catch (e) {
            console.warn('Failed to reset theme', e);
        }
    }

    /**
     * Public API: Check if user has a saved preference
     */
    public static hasSavedPreference(): boolean {
        return this.getSavedTheme() !== null;
    }
}

export { Theme };