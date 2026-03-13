import { API } from '../core/api.js';
import { AppState } from './dashboard.js';
import { Patients } from './patients.js';
import { supabaseClient } from '../core/supabase.js';

const Alerts = (() => {
    let stompClient = null;
    let alertHistory = [];

    const THRESHOLDS = {
        heart_rate_high: 120,
        heart_rate_low: 40,
        spo2_low: 90,
        temperature_high: 39
    };

    function init(doctorId) {
        if (!doctorId) return;
        tryWebSocket(doctorId);
        watchSupabaseVitals(doctorId);
    }

    function tryWebSocket(doctorId) {
        if (typeof SockJS === 'undefined' || typeof Stomp === 'undefined') {
            console.debug('Alerts: WebSocket libraries not available.');
            return;
        }

        try {
            const socket = new SockJS('/ws');
            stompClient = Stomp.over(socket);
            stompClient.debug = null;

            stompClient.connect({}, () => {
                stompClient.subscribe(`/topic/alerts/${doctorId}`, (m) => handleIncoming(JSON.parse(m.body)));
                stompClient.subscribe('/topic/alerts/global', (m) => handleIncoming(JSON.parse(m.body)));
            }, (err) => {
                console.warn('Alerts: WebSocket failed.', err);
            });
        } catch (e) {
            console.warn('Alerts: WebSocket init error:', e);
        }
    }

    function watchSupabaseVitals(doctorId) {
        if (window.isDemoMode || !supabaseClient) return;

        supabaseClient.channel('vital-alerts')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'patients',
                filter: `assigned_doctor=eq.${doctorId}`
            }, (payload) => {
                checkVitalThresholds(payload.new);
            })
            .subscribe();
    }

    function checkVitalThresholds(patient) {
        const alerts = [];
        if (patient.heart_rate > THRESHOLDS.heart_rate_high) alerts.push(`High HR: ${patient.heart_rate}`);
        if (patient.heart_rate < THRESHOLDS.heart_rate_low && patient.heart_rate > 0) alerts.push(`Low HR: ${patient.heart_rate}`);
        if (patient.spo2 < THRESHOLDS.spo2_low && patient.spo2 > 0) alerts.push(`Low SpO2: ${patient.spo2}%`);
        if (patient.temperature > THRESHOLDS.temperature_high) alerts.push(`High Temp: ${patient.temperature}°C`);

        if (alerts.length > 0) {
            handleIncoming({
                patientId: patient.id,
                patientName: patient.name,
                riskLevel: alerts.length > 1 ? 'CRITICAL' : 'HIGH',
                message: alerts.join(' | '),
                timestamp: new Date().toISOString()
            });
        }
    }

    function handleIncoming(alert) {
        alertHistory.unshift(alert);
        if (alertHistory.length > 50) alertHistory.pop();

        showAlertBanner(alert);
        playAlertBeep(alert.riskLevel);
        highlightPatientCard(alert.patientId);
        updateNotificationBell();

        if (!AppState.isDemoMode) {
            API.logAction({
                action_type: 'VITAL_ALERT',
                user_id: AppState.user?.id,
                entity: 'patients',
                entity_id: alert.patientId,
                new_data: alert
            });
        }
    }

    function showAlertBanner(alert) {
        const container = document.getElementById('alertBanner');
        if (!container) return;

        const isCritical = alert.riskLevel === 'CRITICAL';
        const banner = document.createElement('div');
        banner.className = `alert-banner ${isCritical ? 'alert-critical' : 'alert-high'} fade-page p-4 mb-2 rounded-xl flex items-center justify-between shadow-2xl`;
        banner.style.background = isCritical ? 'rgba(239, 68, 68, 0.95)' : 'rgba(245, 158, 11, 0.95)';
        banner.style.backdropFilter = 'blur(10px)';
        banner.style.color = '#fff';

        banner.innerHTML = `
          <div class="flex items-center gap-3">
            <div class="font-black text-xs uppercase tracking-tighter opacity-70">${alert.riskLevel}</div>
            <div class="font-bold flex-1">${alert.message}</div>
            ${alert.patientName ? `<div class="text-xs opacity-80 decoration-dotted underline">Pt: ${alert.patientName}</div>` : ''}
          </div>
          <button class="ml-4 opacity-50 hover:opacity-100" onclick="this.closest('.alert-banner').remove()">✕</button>
        `;

        container.prepend(banner);
        setTimeout(() => {
            banner.classList.add('opacity-0', 'translate-y-[-20px]', 'transition-all', 'duration-500');
            setTimeout(() => banner.remove(), 500);
        }, 15000);
    }

    function playAlertBeep(riskLevel) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = riskLevel === 'CRITICAL' ? 880 : 660;
            gain.gain.value = 0.1;
            osc.start();
            setTimeout(() => { osc.stop(); ctx.close(); }, 200);
        } catch (e) { }
    }

    function highlightPatientCard(patientId) {
        const card = document.getElementById(`patient-${patientId}`);
        if (card) {
            card.classList.add('ring-4', 'ring-red-500', 'animate-pulse');
            setTimeout(() => card.classList.remove('ring-4', 'ring-red-500', 'animate-pulse'), 5000);
        }
    }

    function updateNotificationBell() {
        const bell = document.getElementById('notificationBell');
        const count = document.getElementById('notificationCount');
        if (bell) bell.classList.add('text-red-400');
        if (count) {
            const c = parseInt(count.textContent || '0') + 1;
            count.textContent = c;
            count.style.display = 'flex';
        }
    }

    function simulateAlert() {
        const patients = Patients.getAll ? Patients.getAll() : [];
        if (patients.length > 0) {
            const p = patients[Math.floor(Math.random() * patients.length)];
            handleIncoming({
                patientId: p.id,
                patientName: p.name,
                riskLevel: Math.random() > 0.5 ? 'CRITICAL' : 'HIGH',
                message: 'Simulated threshold breach.',
                timestamp: new Date().toISOString()
            });
        }
    }

    function stop() {
        if (stompClient) stompClient.disconnect();
    }

    return { init, handleIncoming, simulateAlert, stop };
})();

export { Alerts };
window.Alerts = Alerts;


