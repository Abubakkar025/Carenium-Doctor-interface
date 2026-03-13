/**
 * CARENIUM — Notifications
 * Real-time toast notification system.
 */
export const Notifications = {
    show(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type} glass-card`;

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${icons[type] || 'ℹ'}</span>
                <span class="toast-message">${message}</span>
            </div>
            <button class="toast-close">×</button>
        `;

        container.appendChild(toast);

        // Trigger entrance animation
        void toast.offsetWidth;
        toast.classList.add('show');

        const remove = () => {
            toast.classList.remove('show');
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 400);
        };

        toast.querySelector('.toast-close').onclick = remove;

        let timeout = setTimeout(remove, 5000);

        toast.onmouseenter = () => clearTimeout(timeout);
        toast.onmouseleave = () => {
            timeout = setTimeout(remove, 2500);
        };
    },

    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error'); },
    warning(msg) { this.show(msg, 'warning'); },
    info(msg) { this.show(msg, 'info'); }
};
