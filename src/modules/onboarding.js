import { Auth } from '../core/auth.js';
import { API } from '../core/api.js';
import { Notifications } from '../ui/notifications.js';
import { Router } from '../core/router.js';
import { supabaseClient } from '../core/supabase.js';

const Onboarding = (() => {
    let currentStep = 1;

    async function init() {
        console.log("Carenium Onboarding: Initializing clinical setup wizard...");

        try {
            const session = await Auth.getSession();
            if (!session) {
                console.warn("Carenium Onboarding: No active session. Redirecting to entry...");
                window.location.href = '/';
                return;
            }
        } catch (err) {
            console.error("Carenium Onboarding: Session validation failed:", err);
            window.location.href = '/';
            return;
        }

        const form = document.getElementById('onboardingForm');
        if (form) form.addEventListener('submit', handleSubmit);

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                const confirmed = await Notifications.confirm('Sign Out?', 'Your progress will not be saved.');
                if (confirmed) await Auth.signOut();
            });
        }

        // Load existing user data if available (e.g. name from Auth)
        const user = session.user;
        if (user && user.user_metadata) {
            const nameField = document.getElementById('fullName');
            if (nameField && !nameField.value) {
                nameField.value = user.user_metadata.full_name || '';
            }
        }
    }

    function nextStep(step) {
        if (!validateStep(currentStep)) return;

        console.log(`Carenium Onboarding: Advancing to step ${step}`);
        updateStepUI(step);
    }

    function prevStep(step) {
        console.log(`Carenium Onboarding: Returning to step ${step}`);
        updateStepUI(step, true);
    }

    function updateStepUI(step, isBack = false) {
        const currentEl = document.querySelector(`.step[data-step="${currentStep}"]`);
        if (currentEl) {
            if (!isBack) currentEl.classList.add('completed');
            currentEl.classList.remove('active');
        }

        currentStep = step;
        const nextEl = document.querySelector(`.step[data-step="${currentStep}"]`);
        if (nextEl) {
            nextEl.classList.add('active');
            if (isBack) nextEl.classList.remove('completed');
        }

        document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
        document.getElementById(`formStep${step}`)?.classList.add('active');

        hideError();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function validateStep(step) {
        if (step === 1) {
            const name = document.getElementById('fullName')?.value?.trim();
            const phone = document.getElementById('phone')?.value?.trim();
            const dept = document.getElementById('department')?.value?.trim();

            if (!name) { showError('Legal name is required for clinical credentials.'); return false; }
            if (!phone) { showError('Emergency contact number is required.'); return false; }
            if (!dept) { showError('Clinical department is required.'); return false; }
        }

        if (step === 2) {
            const spec = document.getElementById('specialization')?.value;
            if (!spec) { showError('Please select your primary medical specialization.'); return false; }
        }

        if (step === 3) {
            const exp = document.getElementById('experienceYears')?.value;
            const license = document.getElementById('licenseNumber')?.value?.trim();
            const qual = document.getElementById('qualification')?.value?.trim();

            if (!exp || exp < 0) { showError('Please enter valid years of experience.'); return false; }
            if (!license) { showError('Medical license number is required for verification.'); return false; }
            if (!qual) { showError('Primary medical qualification is required.'); return false; }
        }

        return true;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        console.log("Carenium Onboarding: Processing clinical profile submission...");

        const btn = document.getElementById('submitBtn');
        setLoading(btn, true);

        try {
            const session = await Auth.getSession();
            if (!session) throw new Error("Medical session expired. Please re-authenticate.");

            // Collect Availability
            const days = Array.from(document.querySelectorAll('input[name="day"]:checked')).map(el => el.value);
            const availability = {
                days,
                startTime: document.getElementById('startTime').value,
                endTime: document.getElementById('endTime').value,
                slotDuration: parseInt(document.getElementById('slotDuration').value)
            };

            const profileData = {
                fullName: document.getElementById('fullName').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                department: document.getElementById('department').value.trim(),
                specialization: document.getElementById('specialization').value,
                experienceYears: parseInt(document.getElementById('experienceYears').value),
                licenseNumber: document.getElementById('licenseNumber').value.trim(),
                qualification: document.getElementById('qualification').value.trim(),
                hospitalName: document.getElementById('hospitalName').value.trim(),
                availability
            };

            if (window.isDemoMode) {
                Notifications.success('Demo Mode: Clinical profile simulated successfully.');
                setTimeout(() => { Router.navigate('/dashboard'); }, 1200);
                return;
            }

            // 1. Sync public.doctors table
            const { error: doctorErr } = await supabaseClient
                .from('doctors')
                .upsert({
                    id: session.user.id,
                    full_name: profileData.fullName,
                    specialization: profileData.specialization,
                    department: profileData.department,
                    years_experience: profileData.experienceYears,
                    phone: profileData.phone,
                    email: session.user.email,
                    status: 'on-duty'
                });

            if (doctorErr) throw doctorErr;

            // 2. Sync public.doctor_profiles table
            const { error: profileErr } = await supabaseClient
                .from('doctor_profiles')
                .upsert({
                    user_id: session.user.id,
                    specialization: profileData.specialization,
                    experience_years: profileData.experienceYears,
                    qualification: profileData.qualification,
                    license_number: profileData.licenseNumber,
                    department: profileData.department,
                    unit: profileData.hospitalName,
                    availability_schedule: availability
                }, { onConflict: 'user_id' });

            if (profileErr) throw profileErr;

            await API.logAction({
                action_type: 'ONBOARDING_COMPLETED',
                user_id: session.user.id,
                details: { specialization: profileData.specialization }
            });

            Notifications.success('Profile established. Welcome to the Carenium Network.');
            setTimeout(() => { window.location.href = '/dashboard.html'; }, 1500);

        } catch (err) {
            console.error('Carenium Onboarding Error:', err);
            const msg = err.message || 'Verification failed. Please check your credentials.';
            showError(msg);

            // JWT/Session Timeout Handling
            if (msg.toLowerCase().includes('jwt') || msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('unauthorized')) {
                Notifications.error('Clinical session expired. Redirecting for re-authentication...');
                setTimeout(() => {
                    Auth.signOut();
                }, 2500);
            }
        } finally {
            setLoading(btn, false);
        }
    }

    function showError(msg) {
        const el = document.getElementById('onboardingError');
        const txt = document.getElementById('onboardingErrorText');
        if (txt) txt.textContent = msg;
        if (el) el.classList.add('show');
    }

    function hideError() {
        document.getElementById('onboardingError')?.classList.remove('show');
    }

    function setLoading(btn, loading) {
        if (!btn) return;
        btn.disabled = loading;
        btn.classList.toggle('loading', loading);
    }

    return { init, nextStep, prevStep };
})();

export { Onboarding };
window.Onboarding = Onboarding;

