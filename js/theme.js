class Theme {
    /**
     * Initializes the theme system with toggle functionality and system preference detection
     */
    static init() {
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
    static getSavedTheme() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            return saved === 'dark' || saved === 'light' ? saved : null;
        }
        catch (e) {
            console.warn('localStorage.getItem failed', e);
            return null;
        }
    }
    /**
     * Safely saves the theme to localStorage
     */
    static saveTheme(theme) {
        try {
            localStorage.setItem(this.STORAGE_KEY, theme);
        }
        catch (e) {
            console.warn('localStorage.setItem failed', e);
        }
    }
    /**
     * Gets the system-preferred theme
     */
    static getSystemTheme() {
        return this.mediaQuery?.matches ? 'dark' : 'light';
    }
    /**
     * Gets the current active theme
     */
    static getCurrentTheme() {
        const current = this.root.getAttribute('data-theme');
        return current === 'dark' ? 'dark' : 'light';
    }
    /**
     * Applies a theme to the document
     */
    static applyTheme(theme) {
        if (!this.elements)
            return;
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
        }
        else {
            icon.classList.remove('icon-dark');
            icon.classList.add('icon-light');
        }
    }
    /**
     * Toggles between light and dark theme
     */
    static toggleTheme() {
        if (!this.elements)
            return;
        try {
            const current = this.getCurrentTheme();
            const next = current === 'dark' ? 'light' : 'dark';
            this.saveTheme(next);
            this.applyTheme(next);
        }
        catch (err) {
            console.error('Error toggling theme', err);
            if (this.elements.status) {
                this.elements.status.textContent = 'Error toggling theme (see console).';
            }
        }
    }
    /**
     * Binds click event to toggle button
     */
    static bindToggleClick() {
        if (!this.elements)
            return;
        this.elements.toggleBtn.addEventListener('click', () => {
            this.toggleTheme();
        });
    }
    /**
     * Binds keyboard shortcut (Ctrl/Cmd+J) for theme toggle
     */
    static bindKeyboardShortcut() {
        window.addEventListener('keydown', (ev) => {
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
    static bindSystemThemeChange() {
        if (!this.mediaQuery)
            return;
        const handler = (e) => {
            // Only apply system theme if user hasn't saved a preference
            if (!this.getSavedTheme()) {
                const matches = 'matches' in e ? e.matches : e.matches;
                this.applyTheme(matches ? 'dark' : 'light');
            }
        };
        // Modern API
        if ('addEventListener' in this.mediaQuery) {
            this.mediaQuery.addEventListener('change', handler);
        }
        // Legacy API (deprecated but still supported in older browsers)
        else if ('addListener' in this.mediaQuery) {
            this.mediaQuery.addListener(handler);
        }
    }
    /**
     * Public API: Get the current theme
     */
    static getTheme() {
        return this.getCurrentTheme();
    }
    /**
     * Public API: Set the theme programmatically
     */
    static setTheme(theme) {
        this.saveTheme(theme);
        this.applyTheme(theme);
    }
    /**
     * Public API: Reset to system preference
     */
    static resetToSystem() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            const systemTheme = this.getSystemTheme();
            this.applyTheme(systemTheme);
        }
        catch (e) {
            console.warn('Failed to reset theme', e);
        }
    }
    /**
     * Public API: Check if user has a saved preference
     */
    static hasSavedPreference() {
        return this.getSavedTheme() !== null;
    }
}
Theme.STORAGE_KEY = 'theme';
Theme.elements = null;
Theme.mediaQuery = null;
export { Theme };
