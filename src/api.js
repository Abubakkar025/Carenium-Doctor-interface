/* =============================================
   CARENIUM — Centralized API Layer v3
   Extended with doctor profile, appointments,
   diagnosis, prescriptions, and lab test endpoints.
   ============================================= */

const API = (() => {
    // Lazy getter — ensures supabase is initialized before use
    function sb() { return window.supabaseClient; }

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

            if (typeof UI !== 'undefined' && UI.showToast) {
                UI.showToast(message, 'error');
            }

            if (context === 'Security' || context === 'Auth') {
                API.logAction({
                    action: 'api_failure',
                    details: { message, context, stack: err.stack }
                }).catch(() => { });
            }

            if (err.status === 401 || err.code === 'PGRST301' || err.message?.includes('JWT')) {
                console.warn('Carenium API: Session expired or invalid JWT. Redirecting...');
                if (typeof Auth !== 'undefined') Auth.signOut();
                return { success: false, message: 'Session expired. Please sign in again.' };
            }

            if (err.status === 403) {
                return { success: false, message: 'Access denied: Insufficient privileges for this unit.' };
            }

            return { error: err, success: false, message };
        }
    }

    return {
        // ── Staff & Profiles ──
        async getBaseProfile(userId) {
            if (window.isDemoMode) return { data: { name: 'Demo Doctor', role: 'doctor' }, success: true };

            const { data, error } = await sb().from('users').select('name, role').eq('id', userId).maybeSingle();

            if (!error && data) {
                return { data, success: true };
            }

            const { data: { user }, error: authError } = await sb().auth.getUser();
            if (!authError && user && user.user_metadata) {
                console.info('Carenium API: Using auth metadata fallback for profile.');
                return {
                    data: {
                        name: user.user_metadata.full_name || user.email.split('@')[0],
                        role: user.user_metadata.role || 'doctor'
                    },
                    success: true
                };
            }

            return { success: false, message: error?.message || 'Profile not found' };
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

        async updateStaffProfile(role, userId, updates) {
            if (window.isDemoMode) {
                UI.showToast("Demo Mode: Profiles are simulated.", "info");
                return { data: updates, success: true };
            }
            const table = role === 'doctor' ? 'doctors' : 'nurses';
            return request(
                sb().from(table).update(updates).eq('id', userId),
                'Failed to update medical profile'
            );
        },

        async getAllStaff() {
            if (window.isDemoMode) return { data: DemoData?.getStaff?.() || [], success: true };
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

        // ── Doctor Profiles (Specialization) ──
        async getDoctorProfile(userId) {
            if (window.isDemoMode) {
                return {
                    data: {
                        specialization: 'Cardiologist',
                        experience_years: 12,
                        qualification: 'MD Cardiology',
                        license_number: 'MCI-DEMO-001',
                        department: 'Cardiology',
                        unit: 'Cardiac ICU',
                        bio: 'Demo cardiologist profile.'
                    },
                    success: true
                };
            }
            return request(
                sb().from('doctor_profiles').select('*').eq('user_id', userId).maybeSingle(),
                'Failed to fetch doctor profile'
            );
        },

        async saveDoctorProfile(profileData) {
            if (window.isDemoMode) {
                UI.showToast("Demo Mode: Profile simulated.", "info");
                return { data: profileData, success: true };
            }
            return request(
                sb().from('doctor_profiles').insert([profileData]).select().single(),
                'Failed to save doctor profile'
            );
        },

        async updateDoctorProfile(userId, updates) {
            if (window.isDemoMode) {
                UI.showToast("Demo Mode: Profile update simulated.", "info");
                return { data: updates, success: true };
            }
            return request(
                sb().from('doctor_profiles').update(updates).eq('user_id', userId),
                'Failed to update doctor profile'
            );
        },

        // ── Patients ──
        async getPatients(role, userId) {
            if (window.isDemoMode) return { data: DemoData?.getPatients?.() || [], success: true };
            let query = sb().from('patients').select('*');
            if (role === 'doctor') {
                query = query.eq('assigned_doctor', userId);
            } else if (role === 'nurse') {
                query = query.eq('assigned_nurse', userId);
            }
            return request(query, 'Failed to load patients');
        },

        async addPatient(patientData) {
            if (window.isDemoMode) {
                UI.showToast("Demo Mode: Patient simulations only.", "info");
                return { data: patientData, success: true };
            }
            return request(
                sb().from('patients').insert([patientData]),
                'Failed to register patient'
            );
        },

        async updatePatient(patientId, updates) {
            if (window.isDemoMode) {
                UI.showToast("Demo Mode: Changes are simulated only.", "info");
                return { data: updates, success: true };
            }
            return request(
                sb().from('patients').update(updates).eq('id', patientId),
                'Failed to update patient record'
            );
        },

        // ── Appointments ──
        async getAppointments(doctorId) {
            if (window.isDemoMode) return { data: [], success: true };
            return request(
                sb().from('appointments').select('*').eq('doctor_id', doctorId).order('scheduled_at', { ascending: true }),
                'Failed to load appointments'
            );
        },

        async createAppointment(data) {
            if (window.isDemoMode) {
                UI.showToast("Demo Mode: Appointment simulated.", "info");
                return { data, success: true };
            }
            return request(
                sb().from('appointments').insert([data]).select().single(),
                'Failed to create appointment'
            );
        },

        async updateAppointment(id, updates) {
            if (window.isDemoMode) {
                UI.showToast("Demo Mode: Update simulated.", "info");
                return { data: updates, success: true };
            }
            return request(
                sb().from('appointments').update(updates).eq('id', id),
                'Failed to update appointment'
            );
        },

        // ── Diagnoses ──
        async addDiagnosis(data) {
            if (window.isDemoMode) {
                UI.showToast("Demo Mode: Diagnosis simulated.", "info");
                return { data, success: true };
            }
            return request(
                sb().from('diagnoses').insert([data]).select().single(),
                'Failed to add diagnosis'
            );
        },

        // ── Prescriptions ──
        async addPrescription(data) {
            if (window.isDemoMode) {
                UI.showToast("Demo Mode: Prescription simulated.", "info");
                return { data, success: true };
            }
            return request(
                sb().from('prescriptions').insert([data]).select().single(),
                'Failed to add prescription'
            );
        },

        // ── Lab Requests ──
        async requestLabTest(data) {
            if (window.isDemoMode) {
                UI.showToast("Demo Mode: Lab request simulated.", "info");
                return { data, success: true };
            }
            return request(
                sb().from('lab_requests').insert([data]).select().single(),
                'Failed to submit lab request'
            );
        },

        // ── Treatment Plans ──
        async createTreatmentPlan(data) {
            if (window.isDemoMode) {
                UI.showToast("Demo Mode: Treatment plan simulated.", "info");
                return { data, success: true };
            }
            return request(
                sb().from('treatment_plans').insert([data]).select().single(),
                'Failed to create treatment plan'
            );
        },

        // ── Audit ──
        async logAction(actionData) {
            if (window.isDemoMode) return { success: true };
            return request(
                sb().from('audit_logs').insert([actionData]),
                'Failed to log audit action'
            );
        }
    };
})();

// Register globally
window.API = API;
