/* =============================================
   CARENIUM — Notifications Bell Module
   Polls and manages real-time alerts.
   ============================================= */

const NotificationsBell = (() => {

    async function fetchAndRender() {
        if (!window.AppState || !window.AppState.user) return;

        let notifications = [];

        if (window.isDemoMode || !window.sb || !window.sb()) {
            notifications = JSON.parse(localStorage.getItem('demoNotifications') || '[]');
        } else {
            try {
                const { data } = await window.API?.request?.(window.sb().from('notifications').select('*').eq('user_id', window.AppState.user.id).eq('is_read', false).order('created_at', { ascending: false }));
                if (data) notifications = data;
            } catch (e) {
                console.warn("Notifications fetch error", e);
            }
        }

        renderDropdown(notifications);
    }

    function renderDropdown(notifications) {
        const badge = document.getElementById('notifBadge');
        const count = document.getElementById('notifCount');
        const list = document.getElementById('notificationList');

        if (!badge || !list) return;

        if (notifications.length > 0) {
            badge.classList.remove('hidden');
            if (count) count.textContent = notifications.length + ' New';
            list.innerHTML = notifications.map((n, i) => `
                <div class="p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer flex flex-col gap-1 transition-colors" onclick="NotificationsBell.markAsRead('${n.id}')">
                   <span class="text-xs font-bold flex items-center gap-2 ${n.type === 'critical' ? 'text-red-400' : 'text-blue-400'}">
                      ${n.type === 'critical' ? '🚨' : '💬'} ${n.title}
                   </span>
                   <span class="text-[11px] text-white/70">${n.message}</span>
                </div>
            `).join('');
        } else {
            badge.classList.add('hidden');
            if (count) count.textContent = '0 New';
            list.innerHTML = '<div class="p-6 text-center opacity-40 text-xs">No recent notifications.</div>';
        }
    }

    async function markAsRead(id) {
        if (window.isDemoMode || !window.sb || !window.sb()) {
            let data = JSON.parse(localStorage.getItem('demoNotifications') || '[]');
            data = data.filter(n => n.id !== id);
            localStorage.setItem('demoNotifications', JSON.stringify(data));
        } else {
            try {
                await window.API?.request?.(window.sb().from('notifications').update({ is_read: true }).eq('id', id));
            } catch (e) {
                console.error("Failed to mark as read", e);
            }
        }
        
        // Refresh
        fetchAndRender();
    }

    // Attach to real-time alerts if dashboard pushes them 
    // Usually dashboard.js calls updateNotificationBell, so we intercept
    function updateFromDashboard(mockData) {
        if (window.isDemoMode) {
             renderDropdown(mockData);
        } else {
             fetchAndRender(); // Always fetch from DB if live
        }
    }

    return { fetchAndRender, renderDropdown, markAsRead, updateFromDashboard };
})();

export { NotificationsBell };
window.NotificationsBell = NotificationsBell;
