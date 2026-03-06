/* =============================================
   CARENIUM — Real-time Alert System
   WebSocket + Supabase vital threshold alerts.
   ============================================= */

const Alerts = (() => {
    let stompClient = null;
    let alertHistory = [];
    const ALERT_SOUND_URL = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgn7KwnWQ6K1qUp7WlcEQuU42kr6x2Rz1OiaCpqXVGPEyHoqqse0o3UJTS';

    // Alert thresholds
    const THRESHOLDS = {
        heart_rate_high: 120,
        heart_rate_low: 40,
        spo2_low: 90,
        temperature_high: 39
    };

    function init(doctorId) {
        // Try WebSocket connection (Spring Boot backend)
        tryWebSocket(doctorId);

        // Also watch Supabase realtime for vitals changes
        watchSupabaseVitals(doctorId);
    }

    function tryWebSocket(doctorId) {
        // SockJS/STOMP for Spring Boot backend alerts
        if (typeof SockJS === 'undefined' || typeof Stomp === 'undefined') {
            console.info('Carenium Alerts: SockJS/STOMP not loaded. Using Supabase realtime only.');
            return;
        }

        try {
            const socket = new SockJS('/ws');
            stompClient = Stomp.over(socket);
            stompClient.debug = null; // Suppress debug logs

            stompClient.connect({}, () => {
                console.log('Carenium Alerts: WebSocket connected.');

                // Subscribe to doctor-specific alerts
                stompClient.subscribe(`/topic/alerts/${doctorId}`, (message) => {
                    const alert = JSON.parse(message.body);
                    handleIncoming(alert);
                });

                // Subscribe to global alerts
                stompClient.subscribe('/topic/alerts/global', (message) => {
                    const alert = JSON.parse(message.body);
                    handleIncoming(alert);
                });
            }, (error) => {
                console.warn('Carenium Alerts: WebSocket connection failed. Using Supabase only.', error);
            });
        } catch (e) {
            console.warn('Carenium Alerts: WebSocket init error:', e);
        }
    }

    function watchSupabaseVitals(doctorId) {
        if (window.isDemoMode || !window.supabaseClient) return;

        // Watch for patient vital changes and check thresholds
        const channel = window.supabaseClient.channel('vital-alerts')
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

        if (patient.heart_rate > THRESHOLDS.heart_rate_high) {
            alerts.push(`Tachycardia (HR: ${patient.heart_rate} BPM)`);
        }
        if (patient.heart_rate < THRESHOLDS.heart_rate_low && patient.heart_rate > 0) {
            alerts.push(`Bradycardia (HR: ${patient.heart_rate} BPM)`);
        }
        if (patient.spo2 < THRESHOLDS.spo2_low && patient.spo2 > 0) {
            alerts.push(`Hypoxemia (SpO2: ${patient.spo2}%)`);
        }
        if (patient.temperature > THRESHOLDS.temperature_high) {
            alerts.push(`Hyperthermia (Temp: ${patient.temperature}°C)`);
        }

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
        playAlertSound(alert.riskLevel);
        highlightPatientCard(alert.patientId);
        updateNotificationBell();

        // Log to audit
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

        const riskClass = alert.riskLevel === 'CRITICAL' ? 'alert-critical' : 'alert-high';
        const banner = document.createElement('div');
        banner.className = `alert-banner ${riskClass} fade-in`;
        banner.innerHTML = `
          <div class="alert-banner-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div class="alert-banner-body">
            <strong>${alert.riskLevel} ALERT</strong>
            <span>${alert.message}</span>
            ${alert.patientName ? `<span class="alert-patient">Patient: ${alert.patientName}</span>` : ''}
          </div>
          <div class="alert-banner-actions">
            <button class="btn btn-xs btn-outline-light" onclick="this.closest('.alert-banner').remove()">Dismiss</button>
          </div>
        `;

        container.prepend(banner);

        // Auto-dismiss after 15 seconds
        setTimeout(() => {
            banner.classList.add('fade-out');
            setTimeout(() => banner.remove(), 400);
        }, 15000);
    }

    function playAlertSound(riskLevel) {
        try {
            const audioEl = document.getElementById('alertSound');
            if (audioEl) {
                audioEl.currentTime = 0;
                audioEl.play().catch(() => { });
            } else {
                // Fallback: use Web Audio API for a beep
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = riskLevel === 'CRITICAL' ? 880 : 660;
                gain.gain.value = 0.3;
                osc.start();
                setTimeout(() => { osc.stop(); ctx.close(); }, 300);
            }
        } catch (e) {
            // Audio not available
        }
    }

    function highlightPatientCard(patientId) {
        const card = document.getElementById(`patient-${patientId}`);
        if (card) {
            card.classList.add('alert-highlight');
            setTimeout(() => card.classList.remove('alert-highlight'), 5000);
        }
    }

    function updateNotificationBell() {
        const bell = document.getElementById('notificationBell');
        const count = document.getElementById('notificationCount');
        if (bell) bell.classList.add('has-notifications');
        if (count) {
            const c = parseInt(count.textContent || '0') + 1;
            count.textContent = c;
            count.style.display = 'flex';
        }
    }

    // Demo: simulate an alert
    function simulateAlert() {
        const patients = Patients.getAll ? Patients.getAll() : [];
        if (patients.length > 0) {
            const p = patients[Math.floor(Math.random() * patients.length)];
            handleIncoming({
                patientId: p.id,
                patientName: p.name,
                riskLevel: Math.random() > 0.5 ? 'CRITICAL' : 'HIGH',
                message: 'Simulated vital threshold breach detected.',
                timestamp: new Date().toISOString()
            });
        }
    }

    function stop() {
        if (stompClient) {
            stompClient.disconnect();
        }
    }

    return { init, handleIncoming, simulateAlert, stop };
})();

// Register globally
window.Alerts = Alerts;

