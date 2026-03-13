/**
 * CARENIUM — Modal Management
 * Core system for opening, closing, and animating modals.
 */
export const Modal = {
    init() {
        console.log("Modal system initialized");
        // Global close on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                const modalId = e.target.id;
                if (modalId) this.close(modalId);
            }
        });
    },

    open(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            // Force reflow for animation
            void modal.offsetWidth;
            modal.classList.add('modal-active');
            document.body.style.overflow = 'hidden';

            // Dispatch event for other systems
            window.dispatchEvent(new CustomEvent('modalOpened', { detail: { modalId } }));
        }
    },

    close(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('modal-active');
            document.body.style.overflow = '';

            // Wait for animation to finish
            setTimeout(() => {
                if (!modal.classList.contains('modal-active')) {
                    modal.style.display = 'none';
                }
            }, 400);

            window.dispatchEvent(new CustomEvent('modalClosed', { detail: { modalId } }));
        }
    },

    confirm(title, message, onConfirm) {
        const dialogId = 'confirmDialog';
        let dialog = document.getElementById(dialogId);
        if (!dialog) {
            dialog = document.createElement('div');
            dialog.id = dialogId;
            dialog.className = 'modal-overlay';
            document.body.appendChild(dialog);
        }

        dialog.style.display = 'flex';
        dialog.innerHTML = `
            <div class="modal-content glass-card" style="max-width: 420px; padding: 32px; border-radius: 24px; text-align: center;">
                <h3 style="font-size: 1.25rem; font-weight: 800; color: #fff; margin-bottom: 12px;">${title}</h3>
                <p style="color: var(--text-secondary); margin-bottom: 24px; font-size: 0.95rem;">${message}</p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button class="btn btn-secondary" id="confirmCancel">Cancel</button>
                    <button class="btn btn-primary" id="confirmOk">Confirm</button>
                </div>
            </div>
        `;

        void dialog.offsetWidth;
        dialog.classList.add('modal-active');

        return new Promise((resolve) => {
            document.getElementById('confirmCancel').onclick = () => {
                this.close(dialogId);
                resolve(false);
            };
            document.getElementById('confirmOk').onclick = async () => {
                this.close(dialogId);
                if (onConfirm) await onConfirm();
                resolve(true);
            };
        });
    }
};
