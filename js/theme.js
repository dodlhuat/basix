class Theme {
    static STORAGE_KEY = 'theme';
    static isMac = /Mac|iPhone|iPod|iPad/i.test(navigator.platform);
    static root;
    static elements = null;
    static mediaQuery = null;
    static init() {
        this.root = document.documentElement;
        const toggleBtn = document.getElementById('theme-toggle');
        const icon = document.getElementById('theme-icon');
        const status = document.getElementById('status');
        if (!toggleBtn || !icon) {
            console.error('Theme toggle: missing DOM elements', { toggleBtn, icon });
            if (status) {
                status.textContent = 'Error: missing toggle elements (check IDs).';
            }
            return;
        }
        this.elements = { toggleBtn, icon, status };
        if (window.matchMedia) {
            this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        }
        const savedTheme = this.getSavedTheme();
        const systemTheme = this.getSystemTheme();
        const initialTheme = savedTheme || systemTheme;
        this.applyTheme(initialTheme);
        this.bindToggleClick();
        this.bindKeyboardShortcut();
        this.bindSystemThemeChange();
    }
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
    static saveTheme(theme) {
        try {
            localStorage.setItem(this.STORAGE_KEY, theme);
        }
        catch (e) {
            console.warn('localStorage.setItem failed', e);
        }
    }
    static getSystemTheme() {
        return this.mediaQuery?.matches ? 'dark' : 'light';
    }
    static getCurrentTheme() {
        const current = this.root.getAttribute('data-theme');
        return current === 'dark' ? 'dark' : 'light';
    }
    static applyTheme(theme) {
        if (!this.elements)
            return;
        this.root.setAttribute('data-theme', theme);
        const isDark = theme === 'dark';
        const { toggleBtn, icon } = this.elements;
        toggleBtn.setAttribute('aria-pressed', String(isDark));
        toggleBtn.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
        const useEl = icon.querySelector('use');
        if (useEl) {
            const iconName = isDark ? icon.dataset.iconDark : icon.dataset.iconLight;
            if (iconName) {
                const existingHref = useEl.getAttribute('href') ?? '';
                const basePath = existingHref.includes('#') ? existingHref.split('#')[0] : '';
                useEl.setAttribute('href', `${basePath}#${iconName}`);
            }
        }
        else {
            if (isDark) {
                icon.classList.remove('icon-light');
                icon.classList.add('icon-dark');
            }
            else {
                icon.classList.remove('icon-dark');
                icon.classList.add('icon-light');
            }
        }
    }
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
    static bindToggleClick() {
        if (!this.elements)
            return;
        this.elements.toggleBtn.addEventListener('click', () => this.toggleTheme());
    }
    static bindKeyboardShortcut() {
        window.addEventListener('keydown', (ev) => {
            const modifierPressed = Theme.isMac ? ev.metaKey : ev.ctrlKey;
            if (modifierPressed && ev.key.toLowerCase() === 'j') {
                ev.preventDefault();
                this.toggleTheme();
            }
        });
    }
    static bindSystemThemeChange() {
        if (!this.mediaQuery)
            return;
        this.mediaQuery.addEventListener('change', (e) => {
            if (!this.getSavedTheme()) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
    static getTheme() {
        return this.getCurrentTheme();
    }
    static setTheme(theme) {
        this.saveTheme(theme);
        this.applyTheme(theme);
    }
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
    static hasSavedPreference() {
        return this.getSavedTheme() !== null;
    }
}
export { Theme };
