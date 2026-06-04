type ThemeMode = 'light' | 'dark';

/** DOM element references used by the Theme static class. */
interface ThemeElements {
    toggleBtn: HTMLElement;
    icon: HTMLElement;
    status: HTMLElement | null;
}

/** Static class for managing light/dark theme switching with system preference and localStorage persistence. */
class Theme {
    private static readonly STORAGE_KEY = 'theme';
    private static root: HTMLElement;
    private static elements: ThemeElements | null = null;
    private static mediaQuery: MediaQueryList | null = null;

    public static init(): void {
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

    private static getSavedTheme(): ThemeMode | null {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            return saved === 'dark' || saved === 'light' ? saved : null;
        } catch (e) {
            console.warn('localStorage.getItem failed', e);
            return null;
        }
    }

    private static saveTheme(theme: ThemeMode): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, theme);
        } catch (e) {
            console.warn('localStorage.setItem failed', e);
        }
    }

    private static getSystemTheme(): ThemeMode {
        return this.mediaQuery?.matches ? 'dark' : 'light';
    }

    private static getCurrentTheme(): ThemeMode {
        const current = this.root.getAttribute('data-theme');
        return current === 'dark' ? 'dark' : 'light';
    }

    private static applyTheme(theme: ThemeMode): void {
        if (!this.elements) return;

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
        } else {
            if (isDark) {
                icon.classList.remove('icon-light');
                icon.classList.add('icon-dark');
            } else {
                icon.classList.remove('icon-dark');
                icon.classList.add('icon-light');
            }
        }
    }

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

    private static bindToggleClick(): void {
        if (!this.elements) return;

        this.elements.toggleBtn.addEventListener('click', () => {
            this.toggleTheme();
        });
    }

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

    private static bindSystemThemeChange(): void {
        if (!this.mediaQuery) return;

        const handler = (e: MediaQueryListEvent | MediaQueryList): void => {
            if (!this.getSavedTheme()) {
                const matches = 'matches' in e ? e.matches : (e as MediaQueryList).matches;
                this.applyTheme(matches ? 'dark' : 'light');
            }
        };

        if ('addEventListener' in this.mediaQuery) {
            this.mediaQuery.addEventListener('change', handler as (e: MediaQueryListEvent) => void);
        } else if ('addListener' in this.mediaQuery) {
            (this.mediaQuery as any).addListener(handler);
        }
    }

    public static getTheme(): ThemeMode {
        return this.getCurrentTheme();
    }

    public static setTheme(theme: ThemeMode): void {
        this.saveTheme(theme);
        this.applyTheme(theme);
    }

    public static resetToSystem(): void {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            const systemTheme = this.getSystemTheme();
            this.applyTheme(systemTheme);
        } catch (e) {
            console.warn('Failed to reset theme', e);
        }
    }

    public static hasSavedPreference(): boolean {
        return this.getSavedTheme() !== null;
    }
}

export { Theme };