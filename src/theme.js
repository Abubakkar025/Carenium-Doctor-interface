/* =============================================
   CARENIUM — Theme Toggle (Dark / Light)
   ============================================= */

const ThemeManager = (() => {
    const STORAGE_KEY = 'carenium-theme';
    const THEMES = ['uranus', 'pluto', 'moon', 'black-hole', 'saturn', 'light'];

    function getPreferred() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && THEMES.includes(saved)) return saved;
        return 'moon'; // New Default: Moon Elite
    }

    function apply(theme) {
        if (!THEMES.includes(theme)) theme = 'uranus';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEY, theme);
        updateUI(theme);
    }

    function setSpecificTheme(theme) {
        apply(theme);
    }

    function toggle() {
        const current = getPreferred();
        const next = current === 'light' ? 'uranus' : 'light';
        apply(next);
        return next;
    }

    function updateUI(theme) {
        document.querySelectorAll('.theme-toggle').forEach(btn => {
            const sunIcon = btn.querySelector('.icon-sun');
            const moonIcon = btn.querySelector('.icon-moon');
            if (sunIcon && moonIcon) {
                if (theme === 'light') {
                    sunIcon.style.display = 'none';
                    moonIcon.style.display = 'block';
                } else {
                    sunIcon.style.display = 'block';
                    moonIcon.style.display = 'none';
                }
            }
        });

        // Update body class for role-based animations if needed
        document.body.className = `theme-${theme} animate-cosmic-flow`;
    }

    function init() {
        const theme = getPreferred();
        apply(theme);

        // Bind toggle buttons
        document.querySelectorAll('.theme-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                toggle();
                btn.classList.add('theme-toggle-animate');
                setTimeout(() => btn.classList.remove('theme-toggle-animate'), 300);
            });
        });
    }

    return { init, toggle, apply, setSpecificTheme, getPreferred };
})();

// Register globally
window.ThemeManager = ThemeManager;

document.addEventListener('DOMContentLoaded', ThemeManager.init);

