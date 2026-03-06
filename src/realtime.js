   /* =============================================
   CARENIUM — Real-time Engine
   Single channel communication hub.
   ============================================= */

const Realtime = (() => {
    function sb() { return window.supabaseClient; }
    const CONFIG = {
        aiWsUrl: import.meta.env.VITE_AI_WS_URL || 'ws://localhost:8000/vitals'
    };
    let channel = null;

    function init(onUpdate) {
        if (window.isDemoMode) return;
        if (!sb()) return;

        channel = sb().channel('hospital-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, (payload) => {
                onUpdate('patients', payload);
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'doctors' }, (payload) => {
                onUpdate('staff', payload);
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'nurses' }, (payload) => {
                onUpdate('staff', payload);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Carenium Real-time: Subscribed to live updates.');
                }
                if (status === 'CHANNEL_ERROR') {
                    console.error('Carenium Real-time: Subscription error.');
                    if (typeof UI !== 'undefined') UI.showToast('Live sync interrupted. Reconnecting...', 'warning');
                }
            });
    }

    function stop() {
        if (channel) channel.unsubscribe();
    }

    return { init, stop };
})();

// Register globally
window.Realtime = Realtime;
