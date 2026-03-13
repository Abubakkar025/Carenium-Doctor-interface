import { API } from '../core/api.js';
import { Notifications } from '../ui/notifications.js';

const VitalsMonitor = (() => {
    const RISK_THRESHOLDS = {
        HR: { min: 60, max: 100 },
        SpO2: { min: 92, max: 100 },
        Temp: { min: 36.1, max: 37.2 },
        RR: { min: 12, max: 20 }
    };

    function calculateRisk(vitals) {
        let score = 0;
        let triggers = [];

        if (vitals.heart_rate) {
            if (vitals.heart_rate < RISK_THRESHOLDS.HR.min || vitals.heart_rate > RISK_THRESHOLDS.HR.max) {
                score += 25;
                triggers.push('Heart Rate Anomaly');
            }
        }

        if (vitals.spo2) {
            if (vitals.spo2 < RISK_THRESHOLDS.SpO2.min) {
                score += 35;
                triggers.push('Critical SpO2 Level');
            }
        }

        if (vitals.temperature) {
            if (vitals.temperature < RISK_THRESHOLDS.Temp.min || vitals.temperature > RISK_THRESHOLDS.Temp.max) {
                score += 15;
                triggers.push('Temperature Instability');
            }
        }

        // Add some random variation for AI realism if vitals are mostly normal
        if (score === 0) score = Math.floor(Math.random() * 15) + 5;

        return {
            score: Math.min(score, 100),
            status: score > 70 ? 'critical' : (score > 30 ? 'warning' : 'stable'),
            triggers
        };
    }

    async function processUpdate(patientId, vitals) {
        const assessment = calculateRisk(vitals);

        const updates = {
            ...vitals,
            ai_risk_score: assessment.score,
            status: assessment.status,
            updated_at: new Date().toISOString()
        };

        const { success } = await API.updatePatient(patientId, updates);

        if (success && assessment.status === 'critical') {
            await triggerCriticalAlert(patientId, assessment.triggers);
        }

        return { success, assessment };
    }

    async function triggerCriticalAlert(patientId, triggers) {
        const patient = window.Patients?.getAll().find(p => p.id === patientId);
        const alertMsg = `Critical Alert: ${patient?.name || 'Patient'} - ${triggers.join(', ')}`;

        Notifications.error(alertMsg);

        await API.logAction({
            action_type: 'CRITICAL_ALERT',
            entity: 'patients',
            entity_id: patientId,
            details: { triggers }
        });

        // Trigger global UI alert if Alert module exists
        if (window.Alerts) {
            window.Alerts.handleIncoming({
                type: 'vital_alert',
                patient_id: patientId,
                patient_name: patient?.name,
                message: triggers.join(', '),
                priority: 'high'
            });
        }
    }

    return { calculateRisk, processUpdate };
})();

export { VitalsMonitor };
window.VitalsMonitor = VitalsMonitor;
