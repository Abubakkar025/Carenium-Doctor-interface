/* =============================================
   CARENIUM — UI Utilities Suite
   Toasts, Modals, Spinners, and Skeletons.
   ============================================= */

const UI = (() => {
    /**
     * Premium Toast Notification System
     */
    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) {
            console.warn('Toast container not found. Falling back to alert.');
            alert(`${type.toUpperCase()}: ${message}`);
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type} glass-card`;

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <div class="toast-content flex items-center gap-3">
                <span class="toast-icon">${icons[type] || 'ℹ'}</span>
                <span class="toast-message">${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Close">×</button>
        `;

        container.appendChild(toast);

        // Force reflow for enter animation
        void toast.offsetWidth;
        toast.classList.add('show');

        // Auto-remove with clean up
        const duration = 5000;
        let timeout = setTimeout(() => {
            removeToast(toast);
        }, duration);

        // Interactive behavior
        toast.onmouseenter = () => clearTimeout(timeout);
        toast.onmouseleave = () => {
            timeout = setTimeout(() => removeToast(toast), duration / 2);
        };
    }

    function removeToast(toast) {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 400);
    }

    /**
     * Modal Management with smooth transitions
     */
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            void modal.offsetWidth; // Reflow
            modal.classList.add('modal-active');
            document.body.style.overflow = 'hidden'; // Prevent scroll
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('modal-active');
            document.body.style.overflow = '';
            setTimeout(() => {
                if (!modal.classList.contains('modal-active')) {
                    modal.style.display = 'none';
                }
            }, 300);
        }
    }

    /**
     * Confirm Action Dialog
     */
    function confirmAction(title, message, onConfirm) {
        const existing = document.getElementById('confirmDialog');
        if (existing) existing.remove();

        const dialog = document.createElement('div');
        dialog.id = 'confirmDialog';
        dialog.className = 'modal-overlay';
        dialog.style.display = 'flex';
        dialog.innerHTML = `
            <div class="modal-content glass-card" style="max-width: 420px; padding: 32px; border-radius: 24px; text-align: center;">
                <h3 style="font-size: 1.25rem; font-weight: 800; color: #fff; margin-bottom: 12px;">${title}</h3>
                <p style="color: var(--text-secondary); margin-bottom: 24px; font-size: 0.95rem;">${message}</p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button class="btn btn-secondary" id="confirmCancel" style="padding: 10px 24px; border-radius: 12px;">Cancel</button>
                    <button class="btn btn-primary" id="confirmOk" style="padding: 10px 24px; border-radius: 12px; background: var(--gradient-uranus, linear-gradient(135deg, #0a8fd4, #005f99)); color: #fff; font-weight: 700;">Confirm</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);

        document.getElementById('confirmCancel').onclick = () => dialog.remove();
        document.getElementById('confirmOk').onclick = async () => {
            dialog.remove();
            if (onConfirm) await onConfirm();
        };
    }

    /**
     * Toggle Panel visibility
     */
    function togglePanel(panelId) {
        const panel = document.getElementById(panelId);
        if (!panel) return;
        const isVisible = panel.style.display !== 'none';
        panel.style.display = isVisible ? 'none' : 'block';
    }

    /**
     * Skeleton Loading Indicators (GPU Optimized)
     */
    function setSkeleton(containerId, count = 3, type = 'card') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const templates = {
            card: '<div class="glass-card skeleton-card" style="height: 250px;"></div>',
            list: '<div class="skeleton-list-item" style="height: 48px; margin-bottom: 8px; border-radius: 8px;"></div>',
            circle: '<div class="skeleton-avatar" style="height: 64px; width: 64px; border-radius: 50%;"></div>'
        };

        container.innerHTML = `
            <div class="skeleton-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${Array(count).fill(templates[type] || templates.card).join('')}
            </div>
        `;
    }

    function renderSkeletonGrid(containerId, count = 3) {
        setSkeleton(containerId, count, 'card');
    }

    /**
     * Icon Engine Integration
     */
    function initIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    return {
        showToast,
        openModal,
        closeModal,
        confirmAction,
        togglePanel,
        setSkeleton,
        renderSkeletonGrid,
        initIcons
    };
})();

// Register globally
window.UI = UI;
