/* =============================================
   CARENIUM — Doctor Actions Module
   Diagnosis, prescriptions, lab tests, treatment plans.
   ============================================= */

const DoctorActions = (() => {

  function openDiagnosisForm(patientId) {
    const modalBody = document.querySelector('#patientModal .modal-body');
    modalBody.innerHTML = `
          <div class="action-form p-6 fade-in">
            <h3 class="action-title">Add Diagnosis</h3>
            <div class="form-group mb-4">
              <label>Diagnosis</label>
              <input type="text" id="diagnosisText" class="form-input" placeholder="e.g. Acute Myocardial Infarction">
            </div>
            <div class="form-group mb-4">
              <label>Severity</label>
              <select id="diagnosisSeverity" class="form-input">
                <option value="mild">Mild</option>
                <option value="moderate" selected>Moderate</option>
                <option value="severe">Severe</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div class="form-group mb-4">
              <label>Notes</label>
              <textarea id="diagnosisNotes" class="form-input" rows="3" placeholder="Additional clinical notes..."></textarea>
            </div>
          </div>
        `;

    const saveBtn = document.getElementById('addPatientBtn');
    saveBtn.textContent = 'Save Diagnosis';
    saveBtn.onclick = () => saveDiagnosis(patientId);
  }

  async function saveDiagnosis(patientId) {
    const diagnosis = document.getElementById('diagnosisText').value;
    const severity = document.getElementById('diagnosisSeverity').value;
    const notes = document.getElementById('diagnosisNotes').value;

    if (!diagnosis.trim()) {
      UI.showToast('Diagnosis text is required.', 'error');
      return;
    }

    const data = {
      patient_id: patientId,
      doctor_id: AppState.user.id,
      diagnosis, severity, notes
    };

    const { success } = await API.addDiagnosis(data);
    if (success) {
      UI.showToast('Diagnosis recorded successfully.', 'success');
      UI.closeModal('patientModal');
      await API.logAction({
        action_type: 'DIAGNOSIS_ADDED',
        user_id: AppState.user.id,
        entity: 'diagnoses',
        entity_id: patientId,
        new_data: data
      });
    }
  }

  function openPrescriptionForm(patientId) {
    const modalBody = document.querySelector('#patientModal .modal-body');
    modalBody.innerHTML = `
          <div class="action-form p-6 fade-in">
            <h3 class="action-title">Add Prescription</h3>
            <div class="form-group mb-4">
              <label>Medication</label>
              <input type="text" id="rxMedication" class="form-input" placeholder="e.g. Atorvastatin 10mg">
            </div>
            <div class="form-row">
              <div class="form-group mb-4">
                <label>Dosage</label>
                <input type="text" id="rxDosage" class="form-input" placeholder="e.g. 1 tablet">
              </div>
              <div class="form-group mb-4">
                <label>Frequency</label>
                <select id="rxFrequency" class="form-input">
                  <option value="once_daily">Once Daily</option>
                  <option value="twice_daily">Twice Daily</option>
                  <option value="thrice_daily">Thrice Daily</option>
                  <option value="as_needed">As Needed</option>
                  <option value="every_6h">Every 6 Hours</option>
                  <option value="every_8h">Every 8 Hours</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group mb-4">
                <label>Duration</label>
                <input type="text" id="rxDuration" class="form-input" placeholder="e.g. 7 days">
              </div>
              <div class="form-group mb-4">
                <label>Notes</label>
                <input type="text" id="rxNotes" class="form-input" placeholder="Take after meals">
              </div>
            </div>
          </div>
        `;

    const saveBtn = document.getElementById('addPatientBtn');
    saveBtn.textContent = 'Save Prescription';
    saveBtn.onclick = () => savePrescription(patientId);
  }

  async function savePrescription(patientId) {
    const medication = document.getElementById('rxMedication').value;
    const dosage = document.getElementById('rxDosage').value;
    const frequency = document.getElementById('rxFrequency').value;
    const duration = document.getElementById('rxDuration').value;
    const notes = document.getElementById('rxNotes').value;

    if (!medication.trim() || !dosage.trim()) {
      UI.showToast('Medication and dosage are required.', 'error');
      return;
    }

    const data = {
      patient_id: patientId,
      doctor_id: AppState.user.id,
      medication, dosage, frequency, duration, notes
    };

    const { success } = await API.addPrescription(data);
    if (success) {
      UI.showToast('Prescription saved successfully.', 'success');
      UI.closeModal('patientModal');
      await API.logAction({
        action_type: 'PRESCRIPTION_CREATED',
        user_id: AppState.user.id,
        entity: 'prescriptions',
        entity_id: patientId,
        new_data: data
      });
    }
  }

  function openLabRequestForm(patientId) {
    const modalBody = document.querySelector('#patientModal .modal-body');
    modalBody.innerHTML = `
          <div class="action-form p-6 fade-in">
            <h3 class="action-title">Request Lab Test</h3>
            <div class="form-group mb-4">
              <label>Test Name</label>
              <input type="text" id="labTestName" class="form-input" placeholder="e.g. Complete Blood Count (CBC)">
            </div>
            <div class="form-group mb-4">
              <label>Urgency</label>
              <select id="labUrgency" class="form-input">
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="stat">STAT (Immediate)</option>
              </select>
            </div>
          </div>
        `;

    const saveBtn = document.getElementById('addPatientBtn');
    saveBtn.textContent = 'Submit Lab Request';
    saveBtn.onclick = () => saveLabRequest(patientId);
  }

  async function saveLabRequest(patientId) {
    const testName = document.getElementById('labTestName').value;
    const urgency = document.getElementById('labUrgency').value;

    if (!testName.trim()) {
      UI.showToast('Test name is required.', 'error');
      return;
    }

    const data = {
      patient_id: patientId,
      doctor_id: AppState.user.id,
      test_name: testName,
      urgency
    };

    const { success } = await API.requestLabTest(data);
    if (success) {
      UI.showToast('Lab test requested.', 'success');
      UI.closeModal('patientModal');
    }
  }

  function openTreatmentPlanForm(patientId) {
    const modalBody = document.querySelector('#patientModal .modal-body');
    modalBody.innerHTML = `
          <div class="action-form p-6 fade-in">
            <h3 class="action-title">Create Treatment Plan</h3>
            <div class="form-group mb-4">
              <label>Title</label>
              <input type="text" id="txTitle" class="form-input" placeholder="e.g. Cardiac Rehabilitation Plan">
            </div>
            <div class="form-group mb-4">
              <label>Description</label>
              <textarea id="txDescription" class="form-input" rows="4" placeholder="Detailed treatment protocol..."></textarea>
            </div>
          </div>
        `;

    const saveBtn = document.getElementById('addPatientBtn');
    saveBtn.textContent = 'Save Treatment Plan';
    saveBtn.onclick = () => saveTreatmentPlan(patientId);
  }

  async function saveTreatmentPlan(patientId) {
    const title = document.getElementById('txTitle').value;
    const description = document.getElementById('txDescription').value;

    if (!title.trim() || !description.trim()) {
      UI.showToast('Title and description are required.', 'error');
      return;
    }

    const data = {
      patient_id: patientId,
      doctor_id: AppState.user.id,
      title, description
    };

    if (AppState.isDemoMode) {
      UI.showToast('Demo Mode: Treatment plan simulated.', 'info');
      UI.closeModal('patientModal');
      return;
    }

    const { success } = await API.createTreatmentPlan(data);
    if (success) {
      UI.showToast('Treatment plan created.', 'success');
      UI.closeModal('patientModal');
    }
  }

  async function markCritical(patientId) {
    UI.confirmAction('Mark as Critical', 'This will escalate the patient to critical status and trigger alerts. Continue?', async () => {
      const { success } = await API.updatePatient(patientId, { status: 'critical' });
      if (success) {
        UI.showToast('Patient marked as CRITICAL. Alerts dispatched.', 'success');
        Patients.load();
        await API.logAction({
          action_type: 'MARK_CRITICAL',
          user_id: AppState.user.id,
          entity: 'patients',
          entity_id: patientId,
          new_data: { status: 'critical' }
        });
      }
    });
  }

  return {
    openDiagnosisForm,
    openPrescriptionForm,
    openLabRequestForm,
    openTreatmentPlanForm,
    markCritical
  };
})();

// Register globally
window.DoctorActions = DoctorActions;

