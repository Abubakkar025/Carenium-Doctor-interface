/* =============================================
   CARENIUM — Enterprise Auth Module (v2.1 Hardened)
   ============================================= */

// Global Demo Gate
window.isDemoMode = sessionStorage.getItem('demoMode') === 'true';

const Auth = (() => {
    // Lazy getter — supabase is initialized by supabase-config.js before this runs
    function sb() { return window.supabaseClient; }

    /**
     * Centralized Error Logger & Handler
     */
    function handleError(error, context) {
        console.error(`Carenium Auth [${context}]:`, error);
        if (window.UI && window.UI.showToast) {
            window.UI.showToast(error.message || 'Authentication error', 'error');
        }
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
            sessionStorage.removeItem('demoMode');
            window.isDemoMode = false;

            const { data, error } = await sb().auth.signInWithPassword({ email, password });
            if (error) throw error;
            return { success: true, user: data.user };
        } catch (error) {
            let message = error.message || 'Login failed';
            if (message.toLowerCase().includes('invalid login')) {
                message = 'Invalid credentials. Please verify your email and password.';
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
            if (window.isDemoMode) {
                sessionStorage.removeItem('demoMode');
                window.isDemoMode = false;
                window.location.href = '/';
                return;
            }

            if (sb()) {
                await sb().auth.signOut();
            }

            sessionStorage.clear();
            localStorage.removeItem('carenium-theme');
            window.location.href = '/';
        } catch (error) {
            console.error('SignOut error:', error);
            window.location.href = '/';
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
                window.location.href = '/dashboard';
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
                window.location.href = '/';
                return true;
            }
        } catch (e) {
            window.location.href = '/';
            return true;
        }
        return false;
    }

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

// Register globally so other modules and inline onclick handlers can access it
window.Auth = Auth;
