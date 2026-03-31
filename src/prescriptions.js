/* =============================================
   CARENIUM — Prescription Writer Module
   Generates, saves, and prints prescriptions.
   ============================================= */

const Prescriptions = (() => {
    let currentPatientId = null;

    const MEDICATIONS_DB = [
        "Paracetamol", "Ibuprofen", "Amoxicillin", "Ciprofloxacin", "Metformin", 
        "Atorvastatin", "Omeprazole", "Lisinopril", "Amlodipine", "Levothyroxine",
        "Azithromycin", "Sertraline", "Cetirizine", "Loratadine", "Aspirin"
    ];

    function openCreator(patientId) {
        currentPatientId = patientId;

        const modalBody = document.querySelector('#prescriptionModal .modal-body');
        if (!modalBody) return;

        // Make sure data list exists in body
        ensureDatalist();

        modalBody.innerHTML = `
            <div style="padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <h3 style="margin: 0; font-size: 1.2rem; font-weight: 800; color: #fff;">New Prescription</h3>
                    <p style="margin: 4px 0 0 0; font-size: 11px; opacity: 0.5;">Add medications to issue a digital prescription</p>
                </div>
                
                <form id="prescriptionForm">
                    <div id="medicineEntries">
                        ${renderMedicineEntry(0)}
                    </div>
                    
                    <button type="button" onclick="Prescriptions.addMedicineEntry()" style="width: 100%; background: rgba(255,255,255,0.05); border: 1px dashed rgba(255,255,255,0.2); color: #fff; padding: 12px; border-radius: 12px; font-size: 12px; font-weight: 800; cursor: pointer; margin-bottom: 20px; transition: all 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                        + Add Another Medication
                    </button>
                    
                    <div style="margin-bottom: 24px;">
                        <label style="display: block; font-size: 10px; font-weight: 800; opacity: 0.5; margin-bottom: 8px; text-transform: uppercase;">Clinical Instructions (Optional)</label>
                        <textarea id="prescNotes" placeholder="Special dietary or clinical instructions for the pharmacy/patient..." style="width: 100%; height: 80px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px; color: #fff; font-size: 13px; outline: none; resize: vertical;"></textarea>
                    </div>
                    
                    <button type="submit" style="width: 100%; background: linear-gradient(135deg, #10b981, #059669); border: none; color: #fff; padding: 14px; border-radius: 12px; font-size: 13px; font-weight: 800; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(16,185,129,0.3);">
                        Finalize & Issue Prescription
                    </button>
                </form>
            </div>
        `;

        UI.openModal('prescriptionModal');
        document.getElementById('prescriptionForm')?.addEventListener('submit', handleIssue);
    }

    function ensureDatalist() {
        if (!document.getElementById('medicationList')) {
            const dl = document.createElement('datalist');
            dl.id = 'medicationList';
            MEDICATIONS_DB.forEach(med => {
                const opt = document.createElement('option');
                opt.value = med;
                dl.appendChild(opt);
            });
            document.body.appendChild(dl);
        }
    }

    function renderMedicineEntry(index) {
        return `
            <div class="medicine-entry" data-index="${index}" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px; margin-bottom: 16px; position: relative;">
                ${index > 0 ? `<button type="button" onclick="this.closest('.medicine-entry').remove()" style="position: absolute; top: 12px; right: 12px; background: transparent; border: none; color: #ef4444; font-size: 18px; cursor: pointer; opacity: 0.7; hover: opacity: 1;">&times;</button>` : ''}
                
                <div style="margin-bottom: 12px;">
                    <label style="display: block; font-size: 10px; font-weight: 800; opacity: 0.5; margin-bottom: 6px; text-transform: uppercase;">Medication Name</label>
                    <input type="text" class="prescMed" list="medicationList" placeholder="Start typing medication name..." required style="width: 100%; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; outline: none;">
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                    <div>
                        <label style="display: block; font-size: 10px; font-weight: 800; opacity: 0.5; margin-bottom: 6px; text-transform: uppercase;">Dosage</label>
                        <input type="text" class="prescDose" placeholder="e.g. 500mg" required style="width: 100%; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; outline: none;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 10px; font-weight: 800; opacity: 0.5; margin-bottom: 6px; text-transform: uppercase;">Duration</label>
                        <input type="text" class="prescDur" placeholder="e.g. 5 days" required style="width: 100%; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; outline: none;">
                    </div>
                </div>
                
                <div>
                    <label style="display: block; font-size: 10px; font-weight: 800; opacity: 0.5; margin-bottom: 6px; text-transform: uppercase;">Frequency</label>
                    <select class="prescFreq" style="width: 100%; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; outline: none; appearance: none;">
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
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = 'Saving...';
        }

        const entries = document.querySelectorAll('.medicine-entry');
        const notes = document.getElementById('prescNotes')?.value || '';
        const issuedRX = [];

        try {
            let successCount = 0;
            for (const entry of entries) {
                const med = entry.querySelector('.prescMed')?.value?.trim();
                const dose = entry.querySelector('.prescDose')?.value?.trim();
                const dur = entry.querySelector('.prescDur')?.value?.trim();
                const freq = entry.querySelector('.prescFreq')?.value || 'Once daily';

                if (!med || !dose) continue;

                const rxData = {
                    patient_id: currentPatientId,
                    doctor_id: AppState.user?.id || 'demo',
                    medicine: med,
                    dosage: dose,
                    duration: dur || 'As directed',
                    frequency: freq,
                    notes: notes,
                    created_at: new Date().toISOString()
                };

                const { success, data } = await API.addPrescription(rxData);
                if (success) {
                    successCount++;
                    issuedRX.push(data || rxData);
                }
            }

            if (successCount > 0) {
                UI.showToast(`${successCount} prescription(s) finalized.`, 'success');
                UI.closeModal('prescriptionModal');

                // Refresh the tab if open
                if (window.Patients && window.Patients.loadPrescriptionsList) {
                    window.Patients.loadPrescriptionsList(currentPatientId);
                }

                // Show print prompt
                setTimeout(() => {
                    if (confirm('Would you like to print/export this prescription to PDF?')) {
                        printPrescription(issuedRX);
                    }
                }, 400);

            } else {
                UI.showToast('No valid medications filled.', 'warning');
            }
        } catch (err) {
            UI.showToast('Failed to issue prescription', 'error');
        }

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Finalize & Issue Prescription';
        }
    }

    function printPrescription(rxList) {
        if (!rxList || rxList.length === 0) return;
        
        const printWindow = window.open('', '_blank');
        const p = AppState.activePatient || { name: 'Patient' };
        const docName = AppState.user?.email?.split('@')[0] || 'Medical Professional';
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>Prescription - ${p.name}</title>
                    <style>
                        body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #111; max-width: 800px; margin: 0 auto; line-height: 1.6; }
                        .header { border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
                        .brand { font-weight: 900; font-size: 32px; letter-spacing: -1px; }
                        .sub-brand { font-size: 14px; color: #555; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; }
                        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; background: #f9f9f9; padding: 20px; border-radius: 8px; }
                        .meta-label { font-size: 10px; color: #666; text-transform: uppercase; font-weight: bold; margin-bottom: 4px; }
                        .meta-value { font-size: 14px; font-weight: bold; margin-bottom: 12px; }
                        .rx-symbol { font-size: 48px; font-family: serif; font-weight: bold; margin-bottom: 20px; color: #000; }
                        .medicine { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px dashed #ccc; }
                        .med-name { font-weight: 900; font-size: 18px; display: flex; align-items: baseline; }
                        .med-name span { font-size: 13px; font-weight: normal; color: #666; margin-left: 12px; }
                        .instructions { margin-top: 8px; font-size: 14px; }
                        .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
                        .signature { margin-top: 40px; text-align: right; }
                        .signature div { border-top: 1px solid #000; display: inline-block; padding-top: 8px; width: 200px; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <div class="brand">CARENIUM</div>
                            <div class="sub-brand">Clinical Prescription Service</div>
                        </div>
                        <div style="text-align: right; font-size: 12px;">
                            Date: ${new Date().toLocaleDateString()}<br>
                            Ref: RX-${Math.floor(Math.random() * 90000) + 10000}
                        </div>
                    </div>
                    
                    <div class="meta-grid">
                        <div>
                            <div class="meta-label">Patient Name</div>
                            <div class="meta-value">${p.name}</div>
                            <div class="meta-label">Age / Gender</div>
                            <div class="meta-value">${p.age || '--'} Yrs / ${p.gender || '--'}</div>
                            <div class="meta-label">Ward / ID</div>
                            <div class="meta-value">${p.ward || 'General'} / ${p.patient_id || p.id}</div>
                        </div>
                        <div style="text-align: right;">
                            <div class="meta-label">Attending Physician</div>
                            <div class="meta-value">Dr. ${docName}</div>
                            <div class="meta-label">License Registration</div>
                            <div class="meta-value">REG-2026-X8</div>
                            <div class="meta-label">Hospital Contact</div>
                            <div class="meta-value">+1 800 CARENIUM</div>
                        </div>
                    </div>
                    
                    <div class="rx-symbol">Rx</div>
                    
                    ${rxList.map(m => `
                        <div class="medicine">
                            <div class="med-name">${m.medicine} <span>${m.dosage}</span></div>
                            <div class="instructions">Take <strong>${m.dosage}</strong>, <strong>${m.frequency}</strong> for <strong>${m.duration}</strong>.</div>
                        </div>
                    `).join('')}
                    
                    ${rxList[0]?.notes ? `
                    <div style="margin-top: 30px; background: #fff8e1; padding: 15px; border-left: 4px solid #ffb300;">
                        <div class="meta-label">Clinical Notes / Special Instructions</div>
                        <div>${rxList[0].notes}</div>
                    </div>
                    ` : ''}
                    
                    <div class="signature">
                        <div>
                            Dr. ${docName}<br>
                            <span style="font-size: 10px; color: #666;">Electronically Signed</span>
                        </div>
                    </div>
                    
                    <div class="footer">
                        This is a computer-generated document from Carenium Health Intelligence Systems.<br>
                        Valid for 30 days from date of issue. Avoid self-medication.
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        
        // Wait for styles to load then print
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }

    return { openCreator, addMedicineEntry };
})();

window.Prescriptions = Prescriptions;
