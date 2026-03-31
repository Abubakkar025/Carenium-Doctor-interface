/* =============================================
   CARENIUM — Clinical Handoff Module
   Manages shift changes and patient handoffs.
   ============================================= */

const Handoff = (() => {

    function render() {
        const content = document.getElementById('dashboardContent');
        if (!content) return;

        content.innerHTML = `
            <div class="fade-in" style="padding: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                   <div>
                      <h2 style="font-size: 1.5rem; font-weight: 900; color: #fff; margin: 0;">Clinical Handoff</h2>
                      <p style="font-size: 10px; opacity: 0.4; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">Shift Transition Management</p>
                   </div>
                   <button onclick="Handoff.openNewHandoff()" style="background: linear-gradient(135deg, #10b981, #059669); border: none; color: #fff; padding: 10px 20px; border-radius: 12px; font-size: 11px; font-weight: 800; cursor: pointer; text-transform: uppercase;">
                       + Initiate Handoff
                   </button>
                </div>

                <div class="section-card p-6" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px;">
                    <h3 style="font-size: 12px; opacity: 0.6; text-transform: uppercase; margin-bottom: 16px; font-weight: 800;">Pending Handoffs</h3>
                    <div id="handoffList" style="display: grid; gap: 12px;">
                        <div style="text-align: center; opacity: 0.3; padding: 32px; font-size: 12px;">Loading handoff reports...</div>
                    </div>
                </div>
            </div>
        `;

        loadHandoffs();
    }

    async function loadHandoffs() {
        const container = document.getElementById('handoffList');
        if (!container) return;

        try {
            // Demo mode fallback
            let data = [];
            if (window.isDemoMode || !window.sb || !window.sb()) {
                data = JSON.parse(localStorage.getItem('demoHandoffs') || '[]');
                if (data.length === 0) {
                    data = [
                        { id: 'h1', patient_name: 'John Carter', from_staff: 'Nurse Sarah', to_staff: 'Dr. Demo', status: 'pending', notes: 'Patient had mild fever during night shift.', timestamp: new Date().toISOString() }
                    ];
                    localStorage.setItem('demoHandoffs', JSON.stringify(data));
                }
            } else {
                const res = await window.API?.request?.(window.sb().from('handoffs').select('*').order('created_at', { ascending: false }));
                data = res?.data || [];
            }

            if (data.length > 0) {
                container.innerHTML = data.map(h => `
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid ${h.status === 'pending' ? '#f59e0b' : '#10b981'}">
                        <div>
                            <div style="font-size: 14px; font-weight: 800; color: #fff; margin-bottom: 4px;">Patient: ${h.patient_name || h.patient_id}</div>
                            <div style="font-size: 11px; opacity: 0.6; margin-bottom: 8px;">From: ${h.from_staff} &rarr; To: ${h.to_staff}</div>
                            <div style="font-size: 12px; color: rgba(255,255,255,0.8);">${h.notes}</div>
                        </div>
                        <div>
                            <span style="font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 12px; text-transform: uppercase; background: ${h.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)'}; color: ${h.status === 'pending' ? '#f59e0b' : '#10b981'}; border: 1px solid ${h.status === 'pending' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}">${h.status}</span>
                            ${h.status === 'pending' ? `<button onclick="Handoff.acknowledge('${h.id}')" style="margin-left: 12px; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); color: #10b981; padding: 4px 12px; border-radius: 8px; font-size: 10px; font-weight: 800; cursor: pointer;">Acknowledge</button>` : ''}
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = `<div style="text-align: center; opacity: 0.3; padding: 32px; font-size: 12px;">No active handoffs.</div>`;
            }
        } catch (err) {
            container.innerHTML = `<div style="text-align: center; opacity: 0.3; padding: 32px; font-size: 12px;">Error loading data.</div>`;
        }
    }

    function openNewHandoff() {
        if (typeof window.UI !== 'undefined') {
            window.UI.showToast("Opening handoff creator...", "info");
        }
        // Basic prompter for demo
        const pt = prompt("Enter Patient Name/ID:");
        if (!pt) return;
        const notes = prompt("Enter Clinical Notes:");
        if (!notes) return;

        const newH = {
            id: 'h-' + Date.now(),
            patient_name: pt,
            from_staff: AppState.user?.email || 'Current User',
            to_staff: 'Next Shift',
            status: 'pending',
            notes: notes,
            timestamp: new Date().toISOString()
        };

        if (window.isDemoMode || !window.sb || !window.sb()) {
            const data = JSON.parse(localStorage.getItem('demoHandoffs') || '[]');
            data.unshift(newH);
            localStorage.setItem('demoHandoffs', JSON.stringify(data));
            loadHandoffs();
            window.UI.showToast("Handoff submitted.", "success");
        }
    }

    function acknowledge(id) {
        if (window.isDemoMode || !window.sb || !window.sb()) {
            const data = JSON.parse(localStorage.getItem('demoHandoffs') || '[]');
            const idx = data.findIndex(h => h.id === id);
            if (idx > -1) {
                data[idx].status = 'completed';
                localStorage.setItem('demoHandoffs', JSON.stringify(data));
                loadHandoffs();
                window.UI.showToast("Handoff acknowledged.", "success");
            }
        }
    }

    return { render, openNewHandoff, acknowledge };
})();

window.Handoff = Handoff;
