const Router = (() => {
    function init() {
        window.addEventListener('popstate', handleRoute);
        handleRoute();
    }

    function handleRoute() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        console.log(`Carenium Router: Handling route for path: "${path}"`);
        
        const isDashboardPage = filename === 'dashboard.html';
        const isIndexPage = filename === 'index.html' || filename === '';

        if (path.includes('dashboard')) {
            if (!isDashboardPage) {
                window.location.href = '/dashboard.html';
                return;
            }
            renderDashboard();
        } else if (path.includes('onboarding')) {
            renderOnboarding();
        } else {
            if (!isIndexPage) {
                window.location.href = '/index.html';
                return;
            }
            renderLogin();
        }
    }

    async function renderOnboarding() {
        // Onboarding wizard lives in a separate HTML page — redirect there
        window.location.href = '/doctor-onboarding.html';
    }

    function navigate(path) {
        window.history.pushState({}, '', path);
        handleRoute();
    }

    async function renderLogin() {
        try {
            console.log("Carenium Router: Loading Login module...");
            const { Login } = await window.CareniumModules.Login();
            const loginWrapper = document.querySelector('.login-wrapper');
            if (loginWrapper) loginWrapper.style.display = 'flex';
            Login.init();
            console.log("Carenium Router: Login module initialized.");
        } catch (err) {
            console.error("Carenium Router: Failed to render login:", err);
        }
    }

    async function renderDashboard() {
        try {
            console.log("Carenium Router: Loading Dashboard module...");
            const { Dashboard } = await window.CareniumModules.Dashboard();
            console.log("Carenium Router: Initializing Dashboard...");
            await Dashboard.init();
            console.log("Carenium Router: Dashboard initialization complete.");
        } catch (err) {
            console.error("Carenium Router: Failed to render Dashboard:", err);
            // Fallback: If dashboard fails, we might still be stuck on login with a spinner.
            // Let's try to notify the user.
            if (window.Notifications) window.Notifications.error("Failed to load clinical dashboard. Please refresh.");
        }
    }

    return { init, navigate, handleRoute };
})();

export { Router };
window.Router = Router;

