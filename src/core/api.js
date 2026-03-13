import { supabaseClient } from './supabase.js';
import { Notifications } from '../ui/notifications.js';

const API = (() => {
    function sb() { return supabaseClient; }

    const CONFIG = {
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
        aiWsUrl: import.meta.env.VITE_AI_WS_URL || 'ws://localhost:8000/vitals'
    };

    async function request(promise, errorMessage = 'Database operation failed', context = 'API') {
        try {
            const { data, error } = await promise;
            if (error) throw error;
            return { data, success: true };
        } catch (err) {
            console.error(`Carenium ${context} Error:`, err);
            const message = err.message || errorMessage;

            Notifications.error(message);

            if (context === 'Security' || context === 'Auth') {
                API.logAction({
                    action: 'api_failure',
                    details: { message, context, stack: err.stack }
                }).catch(() => { });
            }

            if (err.status === 401 || err.code === 'PGRST301' || err.message?.includes('JWT')) {
                console.warn('Carenium API: Session expired. Redirecting...');
                // Using window.Auth instead of import to avoid circular dependency
                if (window.Auth) window.Auth.signOut();
                return { success: false, message: 'Session expired. Please sign in again.' };
            }

            return { error: err, success: false, message };
        }
    }

    return {
        // ── Staff & Profiles ──
        async getBaseProfile(userId) {
            if (window.isDemoMode) return { data: { name: 'Demo Doctor', role: 'doctor' }, status: 'success' };

            const { data, error } = await sb().from('users').select('name, role').eq('id', userId).maybeSingle();

            if (!error && data) {
                return { data, success: true };
            }

            // Fallback to Auth Metadata
            const { data: { user }, error: authError } = await sb().auth.getUser();
            if (!authError && user && user.user_metadata) {
                return {
                    data: {
                        name: user.user_metadata.full_name || user.email.split('@')[0],
                        role: user.user_metadata.role || 'doctor'
                    },
                    success: true
                };
            }

            return { success: false, message: error?.message || 'Profile record not found' };
        },

        async getStaffProfile(role, userId) {
            if (window.isDemoMode) {
                return {
                    data: {
                        full_name: 'Dr. Demo',
                        department: 'Cardiology',
                        specialization: 'Cardiologist',
                        years_experience: 12,
                        status: 'on-duty',
                        created_at: new Date().toISOString()
                    },
                    success: true
                };
            }
            const table = role === 'doctor' ? 'doctors' : 'nurses';
            return request(
                sb().from(table).select('*').eq('id', userId).maybeSingle(),
                `Failed to fetch ${role} profile`
            );
        },

        async getAllStaff() {
            const doctorsPromise = sb().from('doctors').select('id, full_name, department, status, specialization');
            const nursesPromise = sb().from('nurses').select('id, full_name, department, status');

            const [doctors, nurses] = await Promise.all([doctorsPromise, nursesPromise]);

            if (doctors.error || nurses.error) {
                return { success: false, error: doctors.error || nurses.error };
            }

            const combined = [
                ...(doctors.data || []).map(d => ({ ...d, role: 'doctor' })),
                ...(nurses.data || []).map(n => ({ ...n, role: 'nurse' }))
            ];
            return { data: combined, success: true };
        },

        async updateStaffProfile(role, userId, updates) {
            const table = role === 'doctor' ? 'doctors' : 'nurses';
            return request(
                sb().from(table).update(updates).eq('id', userId),
                `Failed to update ${role} profile`
            );
        },

        // ── Doctor Profiles ──
        async getDoctorProfile(userId) {
            return request(
                sb().from('doctor_profiles').select('*').eq('user_id', userId).maybeSingle(),
                'Failed to fetch doctor profile'
            );
        },

        async saveDoctorProfile(profileData) {
            return request(
                sb().from('doctor_profiles').upsert([profileData]).select().single(),
                'Failed to save doctor profile'
            );
        },

        async updateDoctorProfile(userId, updates) {
            return request(
                sb().from('doctor_profiles').update(updates).eq('user_id', userId),
                'Failed to update professional credentials'
            );
        },

        // ── Patients ──
        async getPatients(role, userId) {
            if (window.isDemoMode && window.DemoData) {
                return { data: window.DemoData.getPatients?.() || [], success: true };
            }

            let query = sb().from('patients')
                .select('*')
                .order('updated_at', { ascending: false }); // Always show newest updates first

            if (role === 'doctor') {
                query = query.eq('assigned_doctor', userId);
            } else if (role === 'nurse') {
                query = query.eq('assigned_nurse', userId);
            }

            return request(query, 'Failed to load patients', 'PatientRegistry');
        },

        async addPatient(patientData) {
            if (window.isDemoMode && window.DemoData) {
                return window.DemoData.admitPatient(patientData);
            }
            if (!API.checkRole('doctor')) return { status: 'error', message: 'Unauthorized clinical action' };

            // Ensure timestamping
            const finalData = {
                ...patientData,
                updated_at: new Date().toISOString()
            };

            return request(
                sb().from('patients').insert([finalData]).select(),
                'Failed to register clinical record'
            );
        },

        async updatePatient(patientId, updates) {
            if (window.isDemoMode && window.DemoData) {
                return window.DemoData.updatePatient(patientId, updates);
            }
            return request(
                sb().from('patients').update(updates).eq('id', patientId),
                'Failed to update patient record'
            );
        },

        // ── Appointments ──
        async getAppointments(doctorId) {
            if (window.isDemoMode && window.DemoData) {
                return { data: window.DemoData.getAppointments() || [], success: true };
            }
            return request(
                sb().from('appointments').select('*').eq('doctor_id', doctorId).order('scheduled_at', { ascending: true }),
                'Failed to load appointments'
            );
        },

        async updateAppointment(id, updates) {
            return request(
                sb().from('appointments').update(updates).eq('id', id),
                'Failed to update clinical schedule'
            );
        },

        async addAppointment(appointmentData) {
            if (window.isDemoMode && window.DemoData) {
                return window.DemoData.addAppointment(appointmentData);
            }
            return request(
                sb().from('appointments').insert([appointmentData]),
                'Failed to book appointment'
            );
        },

        // ── Prescriptions ──
        async getPrescriptions(patientId) {
            return request(
                sb().from('prescriptions').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }),
                'Failed to load digital prescriptions'
            );
        },

        async addPrescription(prescriptionData) {
            return request(
                sb().from('prescriptions').insert([prescriptionData]),
                'Failed to issue digital prescription'
            );
        },

        // ── Vitals & AI Engine ──
        async getVitalsHistory(patientId, limit = 50) {
            return request(
                sb().from('vitals_history').select('*').eq('patient_id', patientId).order('recorded_at', { ascending: false }).limit(limit),
                'Failed to load vitals history'
            );
        },

        async recordVitals(vitalsData) {
            return request(
                sb().from('vitals_history').insert([vitalsData]),
                'Failed to synchronize real-time vitals'
            );
        },

        // ── Medical Reports ──
        async getMedicalReports(patientId) {
            return request(
                sb().from('medical_reports').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }),
                'Failed to load medical reports'
            );
        },

        async addMedicalReport(reportData) {
            return request(
                sb().from('medical_reports').insert([reportData]),
                'Failed to synchronize clinical report'
            );
        },

        // ── Admin & Audit ──
        async getAuditLogs(limit = 100) {
            if (window.isDemoMode && window.DemoData) {
                return { data: window.DemoData.getAuditLogs().slice(0, limit), success: true };
            }
            if (!this.checkRole('admin')) return { success: false, message: 'Admin access required' };
            return request(
                sb().from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit),
                'Failed to load system audit trails'
            );
        },

        // ── Security ──
        checkRole(requiredRole) {
            if (window.isDemoMode) return true;
            if (window.Dashboard?.AppState?.role !== requiredRole) {
                Notifications.warning(`Access Denied: ${requiredRole} privileges required.`);
                return false;
            }
            return true;
        },

        async logAction(actionData) {
            if (window.isDemoMode && window.DemoData) {
                return window.DemoData.logAction(actionData);
            }
            return request(
                sb().from('audit_logs').insert([actionData]),
                'Failed to log audit action'
            );
        }
    };
})();

export { API };
window.API = API; // Legacy

