/* =============================================
   CARENIUM — SPA Router
   Controls navigation between Login and Dashboard.
   ============================================= */

const Router = (() => {
    function init() {
        console.log("Carenium: Router initializing...");
        window.addEventListener('popstate', handleRoute);
        handleRoute();
    }

    function handleRoute() {
        const path = window.location.pathname;
        console.log(`Carenium: Navigating to ${path}`);

        if (path === '/dashboard') {
            renderDashboard();
        } else {
            renderLogin();
        }
    }

    function navigate(path) {
        window.history.pushState({}, '', path);
        handleRoute();
    }

    function renderLogin() {
        // Ensure Login module handles its own UI visibility
        if (window.initLogin) window.initLogin();
    }

    function renderDashboard() {
        // Ensure Dashboard module handles its own UI visibility
        if (window.initDashboard) window.initDashboard();
    }

    return { init, navigate, handleRoute };
})();

// Register globally
window.Router = Router;
