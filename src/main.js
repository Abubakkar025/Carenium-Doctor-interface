/* =============================================
   CARENIUM — Application Entry Point
   Single orchestrator: init, routing, event binding.
   ============================================= */

// ── 1. Supabase MUST initialize first ──
import './supabase-config.js';

// ── 2. Core utilities (no dependencies) ──
import './ui.js';
import './theme.js';
import './router.js';

// ── 3. Auth & Demo data ──
import './auth.js';
import './demo.js';

// ── 4. API layer (uses supabase lazily) ──
import './api.js';

// ── 5. Dashboard modules ──
import './dashboard.js';
import './patients.js';
import './profile.js';
import './staff.js';
import './appointments.js';
import './alerts.js';
import './doctor-actions.js';
import './realtime.js';

// ── Global Error Handler ──
window.addEventListener('error', (e) => {
    console.error('Carenium Runtime Error:', e.message, e.filename, e.lineno);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Carenium Unhandled Promise:', e.reason);
});

// ── Main Init ──
document.addEventListener('DOMContentLoaded', () => {
    console.log("Carenium app started");

    // Set demo mode flag globally
    window.isDemoMode = sessionStorage.getItem('demoMode') === 'true';

    // Start Router
    if (window.Router) {
        window.Router.init();
    } else {
        console.error("Carenium: Router module not found");
    }
});

// ═══════════════════════════════════════════════
//  LOGIN PAGE LOGIC
// ═══════════════════════════════════════════════

window.initLogin = function () {
    const loginPage = document.querySelector('.login-page');
    if (loginPage) loginPage.style.display = '';

    // Check if already logged in → redirect to dashboard
    checkExistingSession();

    // ── Tab Switching ──
    const tabSignIn = document.getElementById('tabSignIn');
    const tabSignUp = document.getElementById('tabSignUp');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const signupSuccess = document.getElementById('signupSuccess');
    const tabIndicator = document.getElementById('tabIndicator');
    const authSwitch = document.getElementById('authSwitch');
    const switchToSignup = document.getElementById('switchToSignup');

    function showSignIn() {
        tabSignIn?.classList.add('active');
        tabSignUp?.classList.remove('active');
        loginForm?.classList.add('active');
        signupForm?.classList.remove('active');
        signupSuccess?.classList.remove('active');
        if (signupSuccess) signupSuccess.style.display = 'none';
        if (tabIndicator) tabIndicator.style.transform = 'translateX(0)';
        if (authSwitch) authSwitch.innerHTML = 'Don\'t have an account? <a href="#" id="switchToSignup">Create one</a>';
        // Re-bind the dynamic link
        document.getElementById('switchToSignup')?.addEventListener('click', (e) => {
            e.preventDefault();
            showSignUp();
        });
        hideError();
    }

    function showSignUp() {
        tabSignUp?.classList.add('active');
        tabSignIn?.classList.remove('active');
        signupForm?.classList.add('active');
        loginForm?.classList.remove('active');
        signupSuccess?.classList.remove('active');
        if (signupSuccess) signupSuccess.style.display = 'none';
        if (tabIndicator) tabIndicator.style.transform = 'translateX(100%)';
        if (authSwitch) authSwitch.innerHTML = 'Already have an account? <a href="#" id="switchToSignIn">Sign In</a>';
        document.getElementById('switchToSignIn')?.addEventListener('click', (e) => {
            e.preventDefault();
            showSignIn();
        });
        hideError();
    }

    tabSignIn?.addEventListener('click', showSignIn);
    tabSignUp?.addEventListener('click', showSignUp);
    switchToSignup?.addEventListener('click', (e) => {
        e.preventDefault();
        showSignUp();
    });

    // ── Login Form Submit ──
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail')?.value?.trim();
        const password = document.getElementById('loginPassword')?.value;
        const btn = document.getElementById('loginBtn');

        if (!email || !password) {
            showError('Please enter your email and password.');
            return;
        }

        setLoading(btn, true);
        hideError();

        const result = await Auth.signIn(email, password);

        if (result.success) {
            window.location.href = '/dashboard';
        } else {
            showError(result.message || 'Login failed. Please try again.');
            setLoading(btn, false);
        }
    });

    // ── Signup Form Submit ──
    signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName')?.value?.trim();
        const email = document.getElementById('signupEmail')?.value?.trim();
        const phone = document.getElementById('signupPhone')?.value?.trim() || '';
        const password = document.getElementById('signupPassword')?.value;
        const confirmPassword = document.getElementById('signupConfirmPassword')?.value;
        const role = document.getElementById('signupRole')?.value;
        const terms = document.getElementById('signupTerms')?.checked;
        const btn = document.getElementById('signupBtn');

        // Validation
        if (!name || !email || !password || !role) {
            showError('Please fill in all required fields.');
            return;
        }
        if (password.length < 6) {
            showError('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirmPassword) {
            showError('Passwords do not match.');
            return;
        }
        if (!terms) {
            showError('You must agree to the Terms of Service.');
            return;
        }

        setLoading(btn, true);
        hideError();

        const result = await Auth.signUp(email, password, name, role, phone);

        if (result.success) {
            // Show success panel
            loginForm?.classList.remove('active');
            signupForm?.classList.remove('active');
            signupSuccess?.classList.add('active');
            if (signupSuccess) signupSuccess.style.display = '';
        } else {
            showError(result.message || 'Signup failed. Please try again.');
        }
        setLoading(btn, false);
    });

    // ── Back to Sign In (from success panel) ──
    document.getElementById('backToSignIn')?.addEventListener('click', showSignIn);

    // ── Demo Access Button ──
    const demoBtn = document.getElementById('demoAccessBtn');
    demoBtn?.addEventListener('click', () => {
        sessionStorage.setItem('demoMode', 'true');
        window.isDemoMode = true;
        window.location.href = '/dashboard';
    });

    // ── Password Toggle ──
    setupPasswordToggle('passwordToggle', 'loginPassword');
    setupPasswordToggle('signupPasswordToggle', 'signupPassword');
}

function setupPasswordToggle(toggleId, inputId) {
    const toggle = document.getElementById(toggleId);
    const input = document.getElementById(inputId);
    if (!toggle || !input) return;

    toggle.addEventListener('click', () => {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        const eyeIcon = toggle.querySelector('.icon-eye');
        const eyeOffIcon = toggle.querySelector('.icon-eye-off');
        if (eyeIcon) eyeIcon.style.display = isPassword ? 'none' : 'block';
        if (eyeOffIcon) eyeOffIcon.style.display = isPassword ? 'block' : 'none';
    });
}

function showError(message) {
    const errorDiv = document.getElementById('loginError');
    const errorText = document.getElementById('loginErrorText');
    if (errorDiv && errorText) {
        errorText.textContent = message;
        errorDiv.style.display = 'flex';
    }
}

function hideError() {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) errorDiv.style.display = 'none';
}

function setLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    btn.classList.toggle('loading', loading);
}

async function checkExistingSession() {
    if (window.isDemoMode) return; // Already demo, don't redirect
    try {
        const session = await Auth.getSession();
        if (session) {
            window.location.href = '/dashboard';
        }
    } catch (e) {
        // Not logged in, stay on login page
    }
}

// ═══════════════════════════════════════════════
//  DASHBOARD PAGE LOGIC
// ═══════════════════════════════════════════════

window.initDashboard = function () {
    // Hide login UI if present
    const loginPage = document.querySelector('.login-page');
    if (loginPage) loginPage.style.display = 'none';

    // Create dashboard root if not present
    let dashboardRoot = document.getElementById('dashboardRoot');

    if (!dashboardRoot) {
        dashboardRoot = document.createElement('div');
        dashboardRoot.id = 'dashboardRoot';
        dashboardRoot.className = 'dashboard-layout';
        document.body.appendChild(dashboardRoot);

        dashboardRoot.innerHTML = `
            <!-- Sidebar -->
            <aside class="sidebar glass-panel">
                <div class="sidebar-header">
                    <div class="brand">
                        <svg viewBox="0 0 120 120" width="40" height="40">
                            <defs>
                                <linearGradient id="gradBlue2" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stop-color="#0a8fd4" />
                                    <stop offset="100%" stop-color="#005f99" />
                                </linearGradient>
                            </defs>
                            <path d="M60 5 L110 30 V70 C110 95 85 115 60 115 C35 115 10 95 10 70 V30 Z" fill="url(#gradBlue2)" />
                            <polyline points="25,65 40,65 48,50 60,85 72,60 95,60" stroke="#ffffff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <h2 class="brand-text">Carenium</h2>
                    </div>
                </div>

                <div class="sidebar-user">
                    <div class="user-avatar" id="userAvatar">D</div>
                    <div class="user-info">
                        <span class="user-name" id="userName">Loading...</span>
                        <span class="user-role-text" id="userRoleText">...</span>
                    </div>
                </div>

                <nav class="sidebar-nav">
                    <!-- Dashboard navigation injected by dashboard.js -->
                </nav>

                <div class="sidebar-footer" id="sidebarFooter">
                    <!-- Logout button injected by dashboard.js -->
                </div>
            </aside>

            <!-- Main Content Area -->
            <main class="main-content">
                <header class="top-header glass-panel">
                    <div class="header-left">
                        <h1 class="page-title" id="topUserName">Loading Workspace...</h1>
                        <div id="specBadgeContainer">
                            <span class="role-badge doctor specialization-badge" id="topRoleBadge">Doctor</span>
                        </div>
                    </div>

                    <div class="header-right">
                        <button class="icon-btn theme-toggle" id="themeToggleDash" aria-label="Toggle theme">
                            <svg class="icon-sun" style="display:none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="5" />
                                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>
                            <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                        </button>
                        <button class="icon-btn notification-btn" onclick="UI.togglePanel('notificationPanel')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                            <span class="badge" id="alertBadgeCount" style="display:none">0</span>
                        </button>
                    </div>
                </header>

                <div class="content-area" id="dashboardContent">
                    <div class="section-loader p-12 text-center">Initializing medical systems...</div>
                </div>
            </main>
        `;
    } else {
        dashboardRoot.style.display = 'flex';
    }

    // Initialize the Dashboard module
    if (window.Dashboard) {
        window.Dashboard.init();
    }
}
