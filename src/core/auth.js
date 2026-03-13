import { supabaseClient } from './supabase.js';
import { Notifications } from '../ui/notifications.js';

const Auth = (() => {
    function sb() { return supabaseClient; }

    /**
     * Centralized Error Logger & Handler
     */
    function handleError(error, context) {
        console.error(`Carenium Auth [${context}]:`, error);
        Notifications.error(error.message || 'Authentication error');
        return { success: false, message: error.message || 'Operation failed' };
    }

    function checkSupabase() {
        if (!sb()) {
            return handleError({ message: 'Supabase client not initialized' }, 'Initialization');
        }
        return true;
    }

    async function signIn(email, password) {
        if (!checkSupabase()) return { success: false, message: 'System unreachable' };

        try {
            console.log("Carenium Auth: Attempting login for", email);
            sessionStorage.clear(); // Fresh start
            window.isDemoMode = false;

            const { data, error } = await sb().auth.signInWithPassword({ email, password });
            if (error) throw error;

            console.log("Carenium Auth: Login successful.");
            return { success: true, user: data.user };
        } catch (error) {
            let message = error.message || 'Login failed';
            const lowMsg = message.toLowerCase();

            if (lowMsg.includes('invalid login') || lowMsg.includes('credentials')) {
                message = 'Invalid medical credentials. Please check your ID/Password.';
            } else if (lowMsg.includes('email not confirmed')) {
                message = 'Medical account not yet verified. Please check your email.';
            } else if (lowMsg.includes('rate limit')) {
                message = 'Too many attempts. Account locked for security. Try again later.';
            }

            return handleError({ message }, 'SignIn');
        }
    }

    async function signUp(email, password, fullName, role, phone = '') {
        if (!checkSupabase()) return { success: false, message: 'System unreachable' };

        try {
            const { data, error } = await sb().auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: role,
                        phone: phone,
                        created_at: new Date().toISOString()
                    }
                }
            });
            if (error) throw error;
            return { success: true, user: data.user };
        } catch (error) {
            return handleError(error, 'SignUp');
        }
    }

    async function signOut() {
        try {
            if (sb()) {
                await sb().auth.signOut();
            }

            sessionStorage.clear();
            localStorage.removeItem('carenium-theme');
            window.location.href = '/index.html';
        } catch (error) {
            console.error('SignOut error:', error);
            window.location.href = '/index.html';
        }
    }

    async function getSession() {
        try {
            if (window.isDemoMode) {
                return { user: { email: 'demo@carenium.com', user_metadata: { full_name: 'Dr. Demo', role: 'doctor' }, demo: true } };
            }

            if (!sb()) return null;

            const { data, error } = await sb().auth.getSession();
            if (error) throw error;
            return data.session;
        } catch (error) {
            console.warn('Session retrieval failed:', error.message);
            return null;
        }
    }

    async function redirectIfLoggedIn() {
        try {
            const session = await getSession();
            if (session || window.isDemoMode) {
                if (window.Router) window.Router.navigate('/dashboard');
                else window.location.href = '/dashboard';
                return true;
            }
        } catch (e) {
            return false;
        }
        return false;
    }

    async function redirectIfNotLoggedIn() {
        try {
            const session = await getSession();
            if (!session && !window.isDemoMode) {
                if (window.Router) window.Router.navigate('/');
                else window.location.href = '/';
                return true;
            }
        } catch (e) {
            if (window.Router) window.Router.navigate('/');
            else window.location.href = '/';
            return true;
        }
        return false;
    }

    console.log("Carenium Auth: Module loaded.");
    return {
        signIn,
        signUp,
        signOut,
        getSession,
        redirectIfLoggedIn,
        redirectIfNotLoggedIn,
        handleError
    };
})();

export { Auth };
window.Auth = Auth; // Legacy

