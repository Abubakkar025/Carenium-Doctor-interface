import './styles/main.css';
import { ThemeManager } from './core/theme.js';
import { Router } from './core/router.js';
import { Notifications } from './ui/notifications.js';
import { UI } from './ui/ui.js';
import './core/effects.js';

// ── 0. Initialize Global UI ──
UI.init();

// ── 1. Global State ──
window.isDemoMode = sessionStorage.getItem('demoMode') === 'true';

// ── 2. Module Loading Registry (Lazy) ──
window.CareniumModules = {
    Login: () => import('./modules/login.js'),
    Dashboard: () => import('./modules/dashboard.js'),
    Patients: () => import('./modules/patients.js'),
    Profile: () => import('./modules/profile.js'),
    Appointments: () => import('./modules/appointments.js'),
    Reports: () => import('./modules/reports.js'),
    Staff: () => import('./modules/staff.js'),
    Alerts: () => import('./modules/alerts.js'),
    Onboarding: () => import('./modules/onboarding.js')
};

// ── 3. Application Start ──
document.addEventListener('DOMContentLoaded', () => {
    console.log("%c Carenium: [SYSTEM] DOM Content Loaded. App bootstrap starting...", "color: #1dd1a1; font-weight: bold;");

    window.CareniumApp = {
        init: async () => {
            console.log("Carenium: [INIT] Initializing Core Infrastructure...");
            try {
                if (window.ThemeManager) {
                    ThemeManager.init();
                    console.log("Carenium: [OK] ThemeManager connected.");
                }

                if (window.Router) {
                    Router.init();
                    console.log("Carenium: [OK] Route Controller active.");
                }

                console.log("%c Carenium app initialized ", "background: #1dd1a1; color: #000; font-weight: bold;");
            } catch (err) {
                console.error("Carenium: [CRITICAL] App bootstrap failed:", err);
            }
        }
    };

    window.CareniumApp.init();

    // ── 4. Demo Access Handler ──
    const demoBtn = document.getElementById('demoAccessBtn') || document.getElementById('demoBtn');
    if (demoBtn) {
        demoBtn.addEventListener('click', () => {
            console.log("Carenium: [DEMO] Activating Demo Dashboard...");
            sessionStorage.setItem("demoMode", "true");
            window.isDemoMode = true; // Force local state update
            if (window.Router) {
                Router.navigate('/dashboard');
            } else {
                window.location.href = '/dashboard';
            }
        });
    }
});

// Global Error Handling
window.addEventListener('error', (e) => {
    console.error('Carenium [RUNTIME ERROR]:', e.message);
    if (e.message.includes('ResizeObserver')) return;

    if (window.Notifications) {
        window.Notifications.error('A system error occurred. Our team has been notified.');
    }

    // Show system error overlay for severe errors
    const errorOverlay = document.getElementById('systemError');
    if (errorOverlay) {
        errorOverlay.style.display = 'flex';
        const errorText = errorOverlay.querySelector('p');
        if (errorText) errorText.textContent = `Technical details: ${e.message}. Please refresh or contact support.`;
    }
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Carenium [PROMISE ERROR]:', e.reason);
    if (window.Notifications) {
        window.Notifications.warning('Network or async operation failed. Please check your connection.');
    }
});
