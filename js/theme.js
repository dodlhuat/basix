class Theme {
    static init() {
        const KEY = 'theme';
        const root = document.documentElement;
        const toggleBtn = document.getElementById('theme-toggle');
        const icon = document.getElementById('theme-icon');
        const status = document.getElementById('status');

        // Sanity check
        if (!toggleBtn || !icon) {
            console.error('Theme toggle: missing DOM elements', {toggleBtn, icon});
            if (status) status.textContent = 'Error: missing toggle elements (check IDs).';
            return;
        }

        // Helper: read localStorage safely
        function safeGet(key) {
            try {
                return localStorage.getItem(key);
            } catch (e) {
                console.warn('localStorage.getItem failed', e);
                return null;
            }
        }

        function safeSet(key, value) {
            try {
                localStorage.setItem(key, value);
            } catch (e) {
                console.warn('localStorage.setItem failed', e);
            }
        }

        // matchMedia with fallback
        const mql = (window.matchMedia) ? window.matchMedia('(prefers-color-scheme: dark)') : null;

        function applyTheme(theme) {
            root.setAttribute('data-theme', theme);
            const isDark = theme === 'dark';
            toggleBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
            icon.classList.toggle('icon-dark');
            icon.classList.toggle('icon-light');
        }

        // initial
        const saved = safeGet(KEY);
        const initial = saved || (mql && mql.matches ? 'dark' : 'light');
        applyTheme(initial);

        // toggle click handler
        toggleBtn.addEventListener('click', () => {
            try {
                const current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
                const next = current === 'dark' ? 'light' : 'dark';
                safeSet(KEY, next);
                applyTheme(next);
            } catch (err) {
                console.error('Error toggling theme', err);
                if (status) status.textContent = 'Error toggling theme (see console).';
            }
        });

        // keyboard shortcut (Ctrl/Cmd+J)
        window.addEventListener('keydown', (ev) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const mod = isMac ? ev.metaKey : ev.ctrlKey;
            if (mod && ev.key.toLowerCase() === 'j') {
                ev.preventDefault();
                toggleBtn.click();
            }
        });

        // respond to system changes only if user hasn't explicitly chosen
        if (mql) {
            // modern API
            if (typeof mql.addEventListener === 'function') {
                mql.addEventListener('change', (e) => {
                    if (!safeGet(KEY)) applyTheme(e.matches ? 'dark' : 'light');
                });
            } else if (typeof mql.addListener === 'function') {
                // older browsers
                mql.addListener((e) => {
                    if (!safeGet(KEY)) applyTheme(e.matches ? 'dark' : 'light');
                });
            }
        }
    }
}

export {Theme};