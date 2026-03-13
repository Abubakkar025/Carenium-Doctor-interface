/* =============================================
   CARENIUM — Doctor Onboarding Module
   Multi-step wizard logic with Supabase integration.
   ============================================= */

const Onboarding = (() => {
    let currentStep = 1;
    const TOTAL_STEPS = 3;

    async function init() {
        // Check auth
        const session = await Auth.getSession();
        if (!session) {
            window.location.href = 'index.html';
            return;
        }

        // Check if already onboarded (via Supabase doctor_profiles)
        if (!window.isDemoMode && window.supabaseClient) {
            try {
                const { data, error } = await window.supabaseClient
                    .from('doctor_profiles')
                    .select('specialization')
                    .eq('user_id', session.user.id)
                    .single();

                if (!error && data && data.specialization) {
                    // Already onboarded, go to dashboard
                    window.location.href = 'dashboard.html';
                    return;
                }
                // If error (e.g. table not found), just continue to show the form
            } catch (err) {
                console.warn('Carenium: doctor_profiles check skipped — table may not exist yet.', err.message);
                // Continue to show the onboarding form regardless
            }
        }

        // Bind form submission
        document.getElementById('onboardingForm').addEventListener('submit', handleSubmit);

        // Bind logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to sign out? Your progress will not be saved.')) {
                    await Auth.signOut();
                }
            });
        }

        // Update preview when step 3 is shown
        updatePreview();
    }

    function nextStep(step) {
        // Validate current step
        if (!validateStep(currentStep)) return;

        // Mark current step as completed
        document.querySelector(`.step[data-step="${currentStep}"]`).classList.add('completed');
        document.querySelector(`.step[data-step="${currentStep}"]`).classList.remove('active');

        // Show new step
        currentStep = step;
        document.querySelector(`.step[data-step="${currentStep}"]`).classList.add('active');

        // Toggle form steps
        document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
        document.getElementById(`formStep${step}`).classList.add('active');

        // Update preview on last step
        if (step === 3) updatePreview();

        hideError();
    }

    function prevStep(step) {
        document.querySelector(`.step[data-step="${currentStep}"]`).classList.remove('active');
        currentStep = step;
        document.querySelector(`.step[data-step="${currentStep}"]`).classList.add('active');
        document.querySelector(`.step[data-step="${currentStep}"]`).classList.remove('completed');

        document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
        document.getElementById(`formStep${step}`).classList.add('active');

        hideError();
    }

    function validateStep(step) {
        if (step === 1) {
            const spec = document.getElementById('specialization').value;
            const exp = document.getElementById('experienceYears').value;
            const dept = document.getElementById('department').value;

            if (!spec) { showError('Please select a specialization.'); return false; }
            if (!exp || exp < 0) { showError('Please enter valid years of experience.'); return false; }
            if (!dept.trim()) { showError('Department is required.'); return false; }
        }

        if (step === 2) {
            const qual = document.getElementById('qualification').value;
            const license = document.getElementById('licenseNumber').value;

            if (!qual.trim()) { showError('Qualification is required.'); return false; }
            if (!license.trim()) { showError('Medical license number is required.'); return false; }
        }

        return true;
    }

    function updatePreview() {
        const grid = document.getElementById('previewGrid');
        if (!grid) return;

        const fields = [
            { label: 'Specialization', value: document.getElementById('specialization').value || '—' },
            { label: 'Experience', value: (document.getElementById('experienceYears').value || '0') + ' Years' },
            { label: 'Department', value: document.getElementById('department').value || '—' },
            { label: 'Qualification', value: document.getElementById('qualification').value || '—' },
            { label: 'License', value: document.getElementById('licenseNumber').value || '—' },
            { label: 'Unit', value: document.getElementById('unit').value || '—' }
        ];

        grid.innerHTML = fields.map(f => `
            <div class="preview-item">
                <div class="preview-label">${f.label}</div>
                <div class="preview-value">${f.value}</div>
            </div>
        `).join('');
    }

    function getAvailabilitySchedule() {
        const days = {};
        document.querySelectorAll('input[name="day"]').forEach(cb => {
            days[cb.value] = cb.checked;
        });
        days.shift = document.getElementById('shift').value;
        return JSON.stringify(days);
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!validateStep(3)) return;

        const btn = document.getElementById('submitBtn');
        btn.classList.add('loading');
        btn.disabled = true;

        const profileData = {
            specialization: document.getElementById('specialization').value,
            experience_years: parseInt(document.getElementById('experienceYears').value),
            qualification: document.getElementById('qualification').value,
            license_number: document.getElementById('licenseNumber').value,
            department: document.getElementById('department').value,
            unit: document.getElementById('unit').value || null,
            availability_schedule: getAvailabilitySchedule(),
            bio: document.getElementById('bio').value || null
        };

        try {
            if (window.isDemoMode) {
                UI.showToast('Demo Mode: Profile simulated successfully.', 'info');
                setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
                return;
            }

            const session = await Auth.getSession();
            if (!session) {
                showError('Session expired. Please log in again.');
                btn.classList.remove('loading');
                btn.disabled = false;
                return;
            }

            // Save to Supabase doctor_profiles
            const { data, error } = await window.supabaseClient
                .from('doctor_profiles')
                .insert([{
                    user_id: session.user.id,
                    specialization: profileData.specialization,
                    experience_years: profileData.experience_years,
                    qualification: profileData.qualification,
                    license_number: profileData.license_number,
                    department: profileData.department,
                    unit: profileData.unit,
                    availability_schedule: JSON.parse(profileData.availability_schedule),
                    bio: profileData.bio
                }])
                .select()
                .single();

            if (error) throw error;

            // Also update the doctors table with specialization
            await window.supabaseClient
                .from('doctors')
                .update({
                    specialization: profileData.specialization,
                    department: profileData.department,
                    years_experience: profileData.experience_years
                })
                .eq('id', session.user.id);

            // Log audit
            await API.logAction({
                action_type: 'ONBOARDING_COMPLETE',
                user_id: session.user.id,
                entity: 'doctor_profiles',
                entity_id: data?.id || session.user.id,
                new_data: profileData
            });

            UI.showToast('Profile created successfully! Redirecting...', 'success');
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);

        } catch (err) {
            console.error('Onboarding error:', err);
            let msg = err.message || 'Failed to save profile. Please try again.';

            // Handle Session Expiry (JWT expired)
            if (msg.toLowerCase().includes('jwt expired')) {
                msg = 'Your session has expired. Redirecting to login so you can refresh your session...';
                setTimeout(() => { window.location.href = 'index.html'; }, 3000);
            }

            showError(msg);
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    }

    function showError(msg) {
        const el = document.getElementById('onboardingError');
        document.getElementById('onboardingErrorText').textContent = msg;
        el.classList.add('show');
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function hideError() {
        document.getElementById('onboardingError').classList.remove('show');
    }

    return { init, nextStep, prevStep };
})();

document.addEventListener('DOMContentLoaded', Onboarding.init);
