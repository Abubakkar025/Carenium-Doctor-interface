/* =============================================
   CARENIUM — Patient Portal Module
   Personal health dashboard for patients.
   ============================================= */

const PatientPortal = (() => {

    function render() {
        const content = document.getElementById('dashboardContent');
        if (!content) return;

        const pName = AppState.displayName || AppState.user?.email || 'Patient';

        content.innerHTML = `
            <div class="fade-in" style="padding: 12px; max-width: 800px; margin: 0 auto;">
                <div class="welcome-banner glass-panel" style="margin-bottom: 24px; text-align: center; padding: 32px;">
                    <h2 style="font-size: 2rem; color: #fff; margin-bottom: 8px;">Hello, ${pName}</h2>
                    <p style="opacity: 0.7;">Welcome to your Carenium Health Space</p>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
                    <!-- Vitals Card -->
                    <div class="section-card" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 24px;">
                        <h3 style="font-size: 14px; font-weight: 800; color: #00bcd4; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                            Latest Vitals
                        </h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div>
                                <div style="font-size: 11px; opacity: 0.6; text-transform: uppercase;">Heart Rate</div>
                                <div style="font-size: 24px; font-weight: 800; color: #fff;">-- <span style="font-size: 12px; opacity: 0.5;">BPM</span></div>
                            </div>
                            <div>
                                <div style="font-size: 11px; opacity: 0.6; text-transform: uppercase;">SpO2</div>
                                <div style="font-size: 24px; font-weight: 800; color: #fff;">-- <span style="font-size: 12px; opacity: 0.5;">%</span></div>
                            </div>
                            <div>
                                <div style="font-size: 11px; opacity: 0.6; text-transform: uppercase;">Blood Pressure</div>
                                <div style="font-size: 20px; font-weight: 800; color: #fff;">--/--</div>
                            </div>
                            <div>
                                <div style="font-size: 11px; opacity: 0.6; text-transform: uppercase;">Temperature</div>
                                <div style="font-size: 24px; font-weight: 800; color: #fff;">-- <span style="font-size: 12px; opacity: 0.5;">°C</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- Prescriptions Card -->
                    <div class="section-card" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 24px;">
                        <h3 style="font-size: 14px; font-weight: 800; color: #10b981; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            Active Prescriptions
                        </h3>
                        <div id="patientPrescriptions">
                            <div style="opacity: 0.5; font-size: 13px;">Loading prescriptions...</div>
                        </div>
                    </div>
                </div>

                <!-- Messages / Care Team -->
                <div class="section-card mt-4" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 24px;">
                    <h3 style="font-size: 14px; font-weight: 800; color: #fff; margin-bottom: 16px;">Your Care Team</h3>
                    <div style="display: flex; align-items: center; gap: 16px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 12px;">
                        <div style="width: 40px; height: 40px; border-radius: 20px; background: #00bcd4; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #000;">D</div>
                        <div>
                            <div style="font-size: 14px; font-weight: 800;">Dr. Assigned</div>
                            <div style="font-size: 12px; opacity: 0.6;">Primary Physician</div>
                        </div>
                        <button onclick="UI.showToast('Messaging features coming soon.', 'info')" style="margin-left: auto; background: none; border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 6px 12px; border-radius: 8px; font-size: 11px; cursor: pointer;">Message</button>
                    </div>
                </div>

            </div>
        `;

        loadPrescriptions();
    }

    async function loadPrescriptions() {
        const container = document.getElementById('patientPrescriptions');
        if (!container) return;

        try {
            const { data, success } = await API.getPrescriptions(AppState.user.id);
            if (success && data && data.length > 0) {
                container.innerHTML = data.map(rx => `
                    <div style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); last-child { border-bottom: none; }">
                        <div style="font-size: 14px; font-weight: bold; color: #fff;">${rx.medicines && rx.medicines.length > 0 ? rx.medicines[0].drugName : 'Prescription'}</div>
                        <div style="font-size: 12px; opacity: 0.7; margin-top: 4px;">Dr. ${rx.doctor_name || 'Unknown'} • ${new Date(rx.created_at).toLocaleDateString()}</div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<div style="opacity: 0.5; font-size: 13px;">No active prescriptions found.</div>';
            }
        } catch (e) {
            container.innerHTML = '<div style="color: #ef4444; font-size: 13px;">Could not load prescriptions.</div>';
        }
    }

    return { render };
})();

window.PatientPortal = PatientPortal;
