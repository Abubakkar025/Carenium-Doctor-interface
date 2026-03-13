/**
 * CARENIUM — Skeletons
 * GPU-optimized loading placeholders.
 */
export const Skeletons = {
    render(containerId, count = 3, type = 'card') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const templates = {
            card: '<div class="glass-card skeleton-card"></div>',
            list: '<div class="skeleton-list-item"></div>',
            circle: '<div class="skeleton-avatar"></div>',
            text: '<div class="skeleton-text"></div>'
        };

        const html = Array(count).fill(templates[type] || templates.card).join('');

        container.innerHTML = `
            <div class="skeleton-container skeleton-${type}">
                ${html}
            </div>
        `;
    }
};
