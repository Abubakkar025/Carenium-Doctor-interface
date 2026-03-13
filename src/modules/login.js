import { Auth } from '../core/auth.js';
import { Router } from '../core/router.js';
import { API } from '../core/api.js';

const Login = (() => {
    let isListenersWired = false;

    function init() {
        const loginWrapper = document.querySelector('.login-wrapper');
        if (!loginWrapper) return;

        console.log("Carenium Login: Initializing system access portal...");

        // Reset UI state every time init is called
        showSignIn();
        checkExistingSession();

        if (isListenersWired) {
            console.log("Carenium Login: Event listeners already active.");
            return;
        }

        // Wire listeners only once
        console.log("Carenium Login: Wiring medical-grade event listeners...");
        wireEventListeners();
        isListenersWired = true;
    }

    function getElements() {
        return {
            tabSignIn: document.getElementById('tabSignIn'),
            tabSignUp: document.getElementById('tabSignUp'),
            loginForm: document.getElementById('loginForm'),
            signupForm: document.getElementById('signupForm'),
            tabIndicator: document.getElementById('tabIndicator'),
            authSwitch: document.getElementById('authSwitch'),
            signupSuccess: document.getElementById('signupSuccess'),
            errorDiv: document.getElementById('loginError'),
            errorText: document.getElementById('loginErrorText')
        };
    }

    function showSignIn() {
        const els = getElements();
        console.log("Carenium Login: Showing Sign In panel.");
        els.tabSignIn?.classList.add('active');
        els.tabSignUp?.classList.remove('active');
        if (els.loginForm) els.loginForm.style.display = 'block';
        if (els.signupForm) els.signupForm.style.display = 'none';
        if (els.signupSuccess) els.signupSuccess.style.display = 'none';
        if (els.tabIndicator) els.tabIndicator.style.transform = 'translateX(0)';
        if (els.authSwitch) els.authSwitch.innerHTML = 'Requesting system access? <a href="#" class="switch-to-signup">Join Network</a>';
        hideError();
    }

    function showSignUp() {
        const els = getElements();
        console.log("Carenium Login: Showing Sign Up panel.");
        els.tabSignUp?.classList.add('active');
        els.tabSignIn?.classList.remove('active');
        if (els.signupForm) els.signupForm.style.display = 'block';
        if (els.loginForm) els.loginForm.style.display = 'none';
        if (els.signupSuccess) els.signupSuccess.style.display = 'none';
        if (els.tabIndicator) els.tabIndicator.style.transform = 'translateX(100%)';
        if (els.authSwitch) els.authSwitch.innerHTML = 'Already registered? <a href="#" class="switch-to-signin">Sign In</a>';
        hideError();
    }

    function wireEventListeners() {
        // Global Click Delegation
        document.addEventListener('click', (e) => {
            const target = e.target;

            // Switching between Sign In / Sign Up
            if (target.id === 'tabSignUp' || target.classList.contains('switch-to-signup')) {
                e.preventDefault();
                showSignUp();
            }
            if (target.id === 'tabSignIn' || target.classList.contains('switch-to-signin') || target.id === 'switchToSignin') {
                e.preventDefault();
                showSignIn();
            }

            // Demo Access
            if (target.closest('#demoAccessBtn')) {
                e.preventDefault();
                console.log("Carenium Login: Initializing demo simulation...");
                sessionStorage.setItem('demoMode', 'true');
                if (window.Router) window.Router.navigate('/dashboard');
                else window.location.href = '/dashboard';
            }

            // Password Toggles
            if (target.id === 'passwordToggle' || target.closest('#passwordToggle')) {
                togglePassword('loginPassword');
            }
            if (target.id === 'signupPasswordToggle' || target.closest('#signupPasswordToggle')) {
                togglePassword('signupPassword');
            }
        });

        // Form Submissions
        document.addEventListener('submit', async (e) => {
            const form = e.target;
            if (form.id === 'loginForm') {
                e.preventDefault();
                handleLogin(form);
            }
            if (form.id === 'signupForm') {
                e.preventDefault();
                handleSignup(form);
            }
        });
    }

    async function handleLogin(form) {
        try {
            console.log("Carenium Login: Sign In form submitted.");
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
                console.log("Carenium Login: Sign In success, redirecting to dashboard...");
                window.location.href = '/dashboard.html';
            } else {
                console.warn("Carenium Login: Sign In failed:", result.message);
                showError(result.message || 'Login failed.');
                setLoading(btn, false);
            }
        } catch (err) {
            console.error("Carenium Login: Fatal error during sign in:", err);
            showError("A system error occurred. Please try again or refresh.");
            const btn = document.getElementById('loginBtn');
            setLoading(btn, false);
        }
    }

    async function handleSignup(form) {
        console.log("Carenium Login: Sign Up form submitted.");
        const name = document.getElementById('signupName')?.value?.trim();
        const email = document.getElementById('signupEmail')?.value?.trim();
        const password = document.getElementById('signupPassword')?.value;
        const role = document.getElementById('signupRole')?.value;
        const btn = document.getElementById('signupBtn');

        if (!name || !email || !password || !role) {
            showError('Please fill in all clinical credentials.');
            return;
        }

        setLoading(btn, true);
        hideError();

        const result = await Auth.signUp(email, password, name, role);
        if (result.success) {
            console.log("Carenium Login: Sign Up success.");
            showSignUpSuccess();
        } else {
            console.warn("Carenium Login: Sign Up failed:", result.message);
            showError(result.message || 'Signup failed.');
        }
        setLoading(btn, false);
    }

    function showSignUpSuccess() {
        const els = getElements();
        if (els.loginForm) els.loginForm.style.display = 'none';
        if (els.signupForm) els.signupForm.style.display = 'none';
        if (els.signupSuccess) {
            els.signupSuccess.style.display = 'block';
            els.signupSuccess.classList.add('active');
        }
    }

    function togglePassword(inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            input.type = input.type === 'password' ? 'text' : 'password';
        }
    }

    function showError(message) {
        const els = getElements();
        if (els.errorDiv && els.errorText) {
            els.errorText.textContent = message;
            els.errorDiv.style.display = 'flex';
        }
    }

    function hideError() {
        const els = getElements();
        if (els.errorDiv) els.errorDiv.style.display = 'none';
    }

    function setLoading(btn, loading) {
        if (!btn) return;
        btn.disabled = loading;
        btn.classList.toggle('loading', loading);
    }

    async function checkExistingSession() {
        const session = await Auth.getSession();
        if (session && !window.isDemoMode) {
            if (window.Router) window.Router.navigate('/dashboard');
            else window.location.href = '/dashboard';
        }
    }

    return { init };
})();

export { Login };
window.Login = Login;
