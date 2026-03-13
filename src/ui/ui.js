import { Modal } from './modal.js';
import { Notifications } from './notifications.js';

/**
 * CARENIUM — Global UI Module
 * Central controller for all UI interactions.
 */
const UI = {
    init() {
        console.log("Carenium UI: Initializing Global Module...");
        Modal.init();
        window.UI = UI; // Global Registration
    },

    openModal(id) {
        if (!id) return;
        console.log(`Carenium UI: Opening Modal [${id}]`);
        Modal.open(id);
    },

    closeModal(id) {
        if (!id) return;
        console.log(`Carenium UI: Closing Modal [${id}]`);
        Modal.close(id);
    },

    openPanel(id) {
        const panel = document.getElementById(id);
        if (panel) {
            console.log(`Carenium UI: Opening Panel [${id}]`);
            panel.classList.add('open');
            document.body.style.overflow = 'hidden';
        } else {
            console.warn(`Carenium UI: Panel [${id}] not found.`);
        }
    },

    closePanel(id) {
        const panel = document.getElementById(id);
        if (panel) {
            console.log(`Carenium UI: Closing Panel [${id}]`);
            panel.classList.remove('open');
            document.body.style.overflow = '';
        } else {
            console.warn(`Carenium UI: Panel [${id}] not found.`);
        }
    },

    showToast(message, type = 'info') {
        console.log(`Carenium UI: Toast [${type}]: ${message}`);
        Notifications.show(message, type);
    }
};

export { UI };
