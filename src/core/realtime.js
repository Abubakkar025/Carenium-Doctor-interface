import { supabaseClient } from './supabase.js';
import { Notifications } from '../ui/notifications.js';

/* =============================================
CARENIUM — Real-time Engine
Single channel communication hub.
============================================= */

const Realtime = (() => {
    function sb() { return supabaseClient; }
    const CONFIG = {
        aiWsUrl: import.meta.env.VITE_AI_WS_URL || 'ws://localhost:8000/vitals'
    };
    let channel = null;

    function init(onUpdate) {
        if (window.isDemoMode) return;
        if (!sb()) {
            console.warn('Carenium Real-time: Supabase not ready.');
            return;
        }

        if (channel && channel.state === 'joined') {
            console.log('Carenium Real-time: Live sync already active.');
            return;
        }

        try {
            console.log('Carenium Real-time: Initializing hospital-live channel...');

            // Cleanup existing if broken
            if (channel) sb().removeChannel(channel);

            channel = sb().channel('hospital-live')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, (payload) => {
                    console.log('Carenium Real-time: [EVENT] Clinical records update.');
                    onUpdate('patients', payload);
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, (payload) => {
                    console.log('Carenium Real-time: [EVENT] Clinical schedule update.');
                    onUpdate('appointments', payload);
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'prescriptions' }, (payload) => {
                    console.log('Carenium Real-time: [EVENT] Pharmacy records update.');
                    onUpdate('prescriptions', payload);
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'vitals_history' }, (payload) => {
                    onUpdate('vitals', payload);
                })
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'doctors' }, (payload) => {
                    onUpdate('staff', payload);
                })
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'nurses' }, (payload) => {
                    onUpdate('staff', payload);
                })
                .subscribe((status, err) => {
                    if (status === 'SUBSCRIBED') {
                        console.log('Carenium Real-time: [CONNECTED] Monitoring live updates.');
                    } else if (status === 'CLOSED') {
                        console.warn('Carenium Real-time: [CLOSED] Connection lost.');
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error('Carenium Real-time: [ERROR] Subscription failed:', err);
                        Notifications.warning('Live sync interrupted. Reconnecting...');
                        channel = null;
                    }
                });
        } catch (err) {
            console.error('Carenium Real-time: [CRITICAL] Init failure:', err);
        }
    }

    function stop() {
        if (channel) channel.unsubscribe();
    }

    return { init, stop };
})();

export { Realtime };
// Register globally
window.Realtime = Realtime; // Legacy
