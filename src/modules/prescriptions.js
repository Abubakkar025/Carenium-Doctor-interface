import { API } from '../core/api.js';
import { Modal } from '../ui/modal.js';
import { Notifications } from '../ui/notifications.js';
import { AppState } from './dashboard.js';

const Prescriptions = (() => {
    let currentPatientId = null;
    let medicineList = [];

    function openCreator(patientId) {
        currentPatientId = patientId;
        medicineList = [];

        const modalBody = document.querySelector('#prescriptionModal .modal-body');
        if (!modalBody) return;

        modalBody.innerHTML = `
            <form id="prescriptionForm" class="p-4">
                <div id="medicineEntries">
                    ${renderMedicineEntry(0)}
                </div>

                <button type="button" class="btn btn-sm btn-outline w-full mb-6" onclick="Prescriptions.addMedicineEntry()">
                    + Add Another Medicine
                </button>

                <div class="form-group mb-6">
                    <label class="block text-xs font-bold opacity-50 mb-1">CLINICAL NOTES</label>
                    <textarea id="prescNotes" class="form-input h-20" placeholder="Special instructions..."></textarea>
                </div>
                <button type="submit" class="btn btn-primary w-full">Issue Prescription</button>
            </form>
        `;

        Modal.open('prescriptionModal');
        document.getElementById('prescriptionForm')?.addEventListener('submit', handleIssue);
    }

    function renderMedicineEntry(index) {
        return `
            <div class="medicine-entry glass-card p-4 mb-4 border border-white/5 relative" data-index="${index}">
                ${index > 0 ? `<button type="button" class="absolute top-2 right-2 text-red-400 text-xs font-bold hover:text-red-300 bg-transparent border-none cursor-pointer" onclick="this.closest('.medicine-entry').remove()">✕ Remove</button>` : ''}
                <div class="form-group mb-3">
                    <label class="block text-xs font-bold opacity-50 mb-1">MEDICATION NAME</label>
                    <input type="text" class="form-input prescMed" placeholder="e.g. Paracetamol" required>
                </div>
                <div class="grid grid-cols-2 gap-3 mb-3">
                    <div class="form-group">
                        <label class="block text-xs font-bold opacity-50 mb-1">DOSAGE</label>
                        <input type="text" class="form-input prescDose" placeholder="e.g. 500mg" required>
                    </div>
                    <div class="form-group">
                        <label class="block text-xs font-bold opacity-50 mb-1">DURATION</label>
                        <input type="text" class="form-input prescDur" placeholder="e.g. 5 days" required>
                    </div>
                </div>
                <div class="form-group">
                    <label class="block text-xs font-bold opacity-50 mb-1">FREQUENCY</label>
                    <select class="form-input prescFreq">
                        <option value="Once daily">Once daily (QD)</option>
                        <option value="Twice daily">Twice daily (BID)</option>
                        <option value="Three times daily">Three times daily (TID)</option>
                        <option value="Four times daily">Four times daily (QID)</option>
                        <option value="As needed">As needed (PRN)</option>
                    </select>
                </div>
            </div>
        `;
    }

    let entryCounter = 1;
    function addMedicineEntry() {
        const container = document.getElementById('medicineEntries');
        if (!container) return;
        container.insertAdjacentHTML('beforeend', renderMedicineEntry(entryCounter++));
    }

    async function handleIssue(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;

        const entries = document.querySelectorAll('.medicine-entry');
        const notes = document.getElementById('prescNotes')?.value || '';

        try {
            let successCount = 0;
            for (const entry of entries) {
                const med = entry.querySelector('.prescMed')?.value?.trim();
                const dose = entry.querySelector('.prescDose')?.value?.trim();
                const dur = entry.querySelector('.prescDur')?.value?.trim();
                const freq = entry.querySelector('.prescFreq')?.value || 'Once daily';

                if (!med || !dose) continue;

                const prescriptionData = {
                    patient_id: currentPatientId,
                    doctor_id: AppState.user.id,
                    medicine: med,
                    dosage: dose,
                    duration: dur || 'As directed',
                    frequency: freq,
                    notes: notes,
                    created_at: new Date().toISOString()
                };

                const { success } = await API.addPrescription(prescriptionData);
                if (success) successCount++;
            }

            if (successCount > 0) {
                Notifications.success(`${successCount} prescription(s) issued and synced with pharmacy.`);
                Modal.close('prescriptionModal');

                if (window.Patients?.switchDetailTab) {
                    window.Patients.switchDetailTab('prescriptions');
                }

                await API.logAction({
                    action_type: 'ISSUE_PRESCRIPTION',
                    user_id: AppState.user.id,
                    entity: 'prescriptions',
                    entity_id: currentPatientId,
                    new_data: { count: successCount }
                });
            } else {
                Notifications.warning('No valid prescriptions to issue. Please fill the medicine fields.');
            }
        } catch (err) {
            console.error('Carenium Prescription Error:', err);
            Notifications.error('Failed to issue prescription.');
        }

        if (btn) btn.disabled = false;
    }

    async function printPrescription(data) {
        const printWindow = window.open('', '_blank');
        const patient = AppState.activePatient || { name: 'Patient' };
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>Prescription - ${patient.name}</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; }
                        .header { border-bottom: 2px solid #1dd1a1; padding-bottom: 20px; margin-bottom: 30px; }
                        .brand { color: #1dd1a1; font-weight: 900; font-size: 24px; }
                        .meta { display: flex; justify-content: space-between; margin-bottom: 40px; }
                        .medicine { margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 8px; }
                        .med-name { font-weight: bold; font-size: 18px; }
                        .footer { margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #999; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="brand">CARENIUM</div>
                        <div>Clinical Prescription Service</div>
                    </div>
                    <div class="meta">
                        <div>
                            <strong>Patient:</strong> ${patient.name}<br>
                            <strong>Age/Gender:</strong> ${patient.age} / ${patient.gender || 'N/A'}<br>
                            <strong>Ward:</strong> ${patient.ward || 'General'}
                        </div>
                        <div style="text-align: right;">
                            <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
                            <strong>Doctor:</strong> Dr. ${AppState.user?.email?.split('@')[0] || 'Medical Prefessional'}<br>
                            <strong>License:</strong> ${AppState.doctorProfile?.license_number || 'REG-PENDING'}
                        </div>
                    </div>
                    <h3>Medications</h3>
                    ${data.map(m => `
                        <div class="medicine">
                            <div class="med-name">${m.medicine}</div>
                            <div>Dosage: ${m.dosage} — ${m.frequency}</div>
                            <div>Duration: ${m.duration}</div>
                        </div>
                    `).join('')}
                    <div class="notes" style="margin-top: 30px;">
                        <strong>Clinical Notes:</strong><br>
                        ${data[0].notes || 'No additional instructions.'}
                    </div>
                    <div class="footer">
                        This is a digitally signed prescription from Carenium Health Intelligence Systems.
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    return { openCreator, addMedicineEntry, printPrescription };
})();

export { Prescriptions };
window.Prescriptions = Prescriptions;
