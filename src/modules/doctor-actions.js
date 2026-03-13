import { API } from '../core/api.js';
import { AppState } from './dashboard.js';
import { Notifications } from '../ui/notifications.js';
import { Modal } from '../ui/modal.js';
import { Patients } from './patients.js';

const DoctorActions = (() => {

  function openDiagnosisForm(patientId) {
    const modalBody = document.querySelector('#patientModal .modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = `
          <div class="action-form p-6 fade-page">
            <h3 class="action-title mb-4">Add Diagnosis</h3>
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
    if (saveBtn) {
      saveBtn.textContent = 'Save Diagnosis';
      saveBtn.onclick = () => saveDiagnosis(patientId);
    }
  }

  async function saveDiagnosis(patientId) {
    const diagnosis = document.getElementById('diagnosisText')?.value;
    const severity = document.getElementById('diagnosisSeverity')?.value;
    const notes = document.getElementById('diagnosisNotes')?.value;

    if (!diagnosis?.trim()) {
      Notifications.error('Diagnosis text is required.');
      return;
    }

    const data = {
      patient_id: patientId,
      doctor_id: AppState.user.id,
      diagnosis, severity, notes
    };

    const { success } = await API.addDiagnosis(data);
    if (success) {
      Notifications.success('Diagnosis recorded successfully.');
      Modal.close('patientModal');
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
    if (!modalBody) return;

    modalBody.innerHTML = `
          <div class="action-form p-6 fade-page">
            <h3 class="action-title mb-4">Add Prescription</h3>
            <div class="form-group mb-4">
              <label>Medication</label>
              <input type="text" id="rxMedication" class="form-input" placeholder="e.g. Atorvastatin 10mg">
            </div>
            <div class="form-row flex gap-4">
              <div class="form-group mb-4 flex-1">
                <label>Dosage</label>
                <input type="text" id="rxDosage" class="form-input" placeholder="e.g. 1 tablet">
              </div>
              <div class="form-group mb-4 flex-1">
                <label>Frequency</label>
                <select id="rxFrequency" class="form-input">
                  <option value="once_daily">Once Daily</option>
                  <option value="twice_daily">Twice Daily</option>
                  <option value="thrice_daily">Thrice Daily</option>
                  <option value="as_needed">As Needed</option>
                </select>
              </div>
            </div>
          </div>
        `;

    const saveBtn = document.getElementById('addPatientBtn');
    if (saveBtn) {
      saveBtn.textContent = 'Save Prescription';
      saveBtn.onclick = () => savePrescription(patientId);
    }
  }

  async function savePrescription(patientId) {
    const medication = document.getElementById('rxMedication')?.value;
    const dosage = document.getElementById('rxDosage')?.value;
    const frequency = document.getElementById('rxFrequency')?.value;

    if (!medication?.trim() || !dosage?.trim()) {
      Notifications.error('Medication and dosage are required.');
      return;
    }

    const data = {
      patient_id: patientId,
      doctor_id: AppState.user.id,
      medication, dosage, frequency
    };

    const { success } = await API.addPrescription(data);
    if (success) {
      Notifications.success('Prescription saved successfully.');
      Modal.close('patientModal');
    }
  }

  function openLabRequestForm(patientId) {
    const modalBody = document.querySelector('#patientModal .modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = `
          <div class="action-form p-6 fade-page">
            <h3 class="action-title mb-4">Request Lab Test</h3>
            <div class="form-group mb-4">
              <label>Test Name</label>
              <input type="text" id="labTestName" class="form-input" placeholder="e.g. Complete Blood Count (CBC)">
            </div>
            <div class="form-group mb-4">
              <label>Urgency</label>
              <select id="labUrgency" class="form-input">
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="stat">STAT</option>
              </select>
            </div>
          </div>
        `;

    const saveBtn = document.getElementById('addPatientBtn');
    if (saveBtn) {
      saveBtn.textContent = 'Submit Lab Request';
      saveBtn.onclick = () => saveLabRequest(patientId);
    }
  }

  async function saveLabRequest(patientId) {
    const testName = document.getElementById('labTestName')?.value;
    const urgency = document.getElementById('labUrgency')?.value;

    if (!testName?.trim()) {
      Notifications.error('Test name is required.');
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
      Notifications.success('Lab test requested.');
      Modal.close('patientModal');
    }
  }

  async function markCritical(patientId) {
    Modal.confirm('Mark as Critical', 'This will escalate the patient to critical status. Continue?', async () => {
      const { success } = await API.updatePatient(patientId, { status: 'critical' });
      if (success) {
        Notifications.success('Patient marked as CRITICAL.');
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
    markCritical
  };
})();

export { DoctorActions };
window.DoctorActions = DoctorActions; // Legacy


