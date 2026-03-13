/**
 * CARENIUM — Sidebar
 * Manage navigation and sidebar states.
 */
export const Sidebar = {
    init() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');

        if (!sidebar) return;

        console.log("Sidebar system initialized");

        // Handle mobile toggle (to be added)
        window.addEventListener('toggleSidebar', () => {
            sidebar.classList.toggle('collapsed');
            mainContent?.classList.toggle('full-width');
        });
    },

    updateUser(user) {
        const nameEl = document.getElementById('userName');
        const avatarEl = document.getElementById('userAvatar');
        const roleEl = document.getElementById('userRoleText');

        if (nameEl) nameEl.textContent = user.name || 'User';
        if (avatarEl) avatarEl.textContent = (user.name || 'U').charAt(0).toUpperCase();
        if (roleEl) roleEl.textContent = user.role || 'Staff';
    }
};
