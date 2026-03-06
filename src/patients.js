/* =============================================
   CARENIUM — Patient Lifecycle Module v3
   Specialization-aware patient management.
   ============================================= */

const Patients = (() => {
   let allPatients = [];

   async function load() {
      if (typeof UI !== 'undefined' && UI.renderSkeletonGrid) {
         UI.renderSkeletonGrid('patientGrid', 3);
      }

      try {
         const { data, success, message } = await API.getPatients(AppState.role, AppState.user.id);
         if (success) {
            allPatients = data || [];
            renderGrid();
            updateDashboardStats();
            setupRealtime(); // Phase 8: Real-time
         } else {
            console.error('Patients load failed:', message);
            const grid = document.getElementById('patientGrid');
            if (grid) grid.innerHTML = `<div class="p-8 text-center opacity-50">Error loading medical records: ${message}</div>`;
         }
      } catch (err) {
         console.error('Patients critical error:', err);
      }
   }

   let isRealtimeSetup = false;
   function setupRealtime() {
      if (isRealtimeSetup || window.isDemoMode) return;

      const sb = window.supabaseClient;
      if (!sb) return;

      sb.channel('patients-live')
         .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, payload => {
            console.log('Real-time update received:', payload);
            load(); // Refresh list
         })
         .subscribe();

      isRealtimeSetup = true;
   }


   function renderGrid() {
      const grid = document.getElementById('patientGrid');
      if (!grid) return;

      if (allPatients.length === 0) {
         grid.innerHTML = `
                <div class="empty-state p-12 text-center">
                    <i data-lucide="users-2" style="width:48px;height:48px;opacity:0.3;margin:0 auto 12px"></i>
                    <p style="opacity:0.5">No patients currently assigned to your unit.</p>
                </div>`;
         if (typeof UI !== 'undefined') UI.initIcons();
         return;
      }

      grid.innerHTML = allPatients.map(p => renderCard(p)).join('');

      // Phase 5: Re-initialize icons for dynamic content
      if (typeof UI !== 'undefined') UI.initIcons();
   }

   function renderCard(p) {
      const status = p.status || 'stable';
      const riskScore = p.ai_risk_score || Math.floor(Math.random() * 100);
      const isHighRisk = riskScore > 75 || status === 'critical';
      const riskLabel = isHighRisk ? 'High Alert' : 'Normal';
      const riskClass = isHighRisk ? 'high' : 'low';

      const lastUpdate = p.last_vitals_update
         ? new Date(p.last_vitals_update).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
         : 'Live';

      return `
      <div class="patient-card glass-card fade-in status-${status}" id="patient-${p.id}">
        <!-- AI Risk Indicator (Phase 8) -->
        <div class="ai-risk-badge ${riskClass}">
            <i data-lucide="${isHighRisk ? 'alert-octagon' : 'shield-check'}"></i>
            <span>AI Risk: ${riskScore}%</span>
        </div>

        <div class="patient-header">
          <div class="patient-meta">
            <div class="patient-name">${p.name}</div>
            <div class="patient-age">${p.age} Yrs • Ward ${p.ward || 'General'}</div>
          </div>
          <div class="status-indicator-badge">
             <span class="status-indicator"></span>
             <span class="status-text">${status.toUpperCase()}</span>
          </div>
        </div>

         <div class="vitals-grid">
            <div class="vital-item">
               <label>Heart Rate</label>
               <div class="value vital-value-pulse heart-rate">${p.heart_rate || '--'} <small>BPM</small></div>
            </div>
            <div class="vital-item">
               <label>SpO2</label>
               <div class="value ${p.spo2 < 92 ? 'text-danger' : ''}">${p.spo2 || '--'} <small>%</small></div>
            </div>
            <div class="vital-item">
               <label>Temperature</label>
               <div class="value">${p.temperature || '--'} <small>°C</small></div>
            </div>
            <div class="vital-item">
               <label>Blood Pressure</label>
               <div class="value" style="font-size: 0.9rem;">${p.blood_pressure || '--'}</div>
            </div>
         </div>

         <!-- Status Bar (Phase 8) -->
         <div class="status-bar">
            <div class="status-bar-fill"></div>
         </div>

        <div class="patient-card-footer flex justify-between items-center mt-4">
           <span class="last-update text-xs opacity-50">Sync: ${lastUpdate}</span>
           <div class="flex gap-2">
               <button class="btn btn-sm btn-action" onclick="Patients.openDetailModal('${p.id}')">
                  Monitor
               </button>
               ${AppState.role === 'doctor' ? `
               <button class="btn btn-sm btn-action" style="border-color: var(--pluto-accent); color: var(--pluto-accent);" onclick="DoctorActions.markCritical('${p.id}')">
                  Critical
               </button>` : ''}
           </div>
        </div>
      </div>
    `;
   }

   async function openDetailModal(id) {
      const p = allPatients.find(x => x.id === id);
      if (!p) return;

      AppState.activePatient = p;

      const modalBody = document.querySelector('#patientModal .modal-body');
      modalBody.innerHTML = `
      <div class="patient-detail-view p-4">
         <!-- Patient Header -->
         <div class="detail-header mb-6">
            <div class="detail-patient-info">
               <h3>${p.name}</h3>
               <span>${p.age} Years • Ward ${p.ward || 'General'} • ID: ${typeof p.id === 'string' ? p.id.slice(0, 8) : p.id}</span>
            </div>
            <div class="status-indicator-badge status-${p.status || 'stable'}">
               <span class="pulse-dot"></span>
               <span>${(p.status || 'stable').toUpperCase()}</span>
            </div>
         </div>

         <!-- Tabs -->
         <div class="detail-tabs" id="detailTabs">
            <button class="detail-tab active" onclick="Patients.switchDetailTab('vitals')">Vitals</button>
            <button class="detail-tab" onclick="Patients.switchDetailTab('history')">History</button>
            <button class="detail-tab" onclick="Patients.switchDetailTab('actions')">Actions</button>
         </div>

         <!-- Vitals Tab -->
         <div class="detail-tab-content active" id="tabVitals">
            <div class="form-grid grid grid-cols-2 gap-6">
               <div class="form-section">
                  <h4 class="section-subtitle">Vitals Management</h4>
                  <div class="form-group mb-4">
                     <label>Heart Rate (BPM)</label>
                     <input type="number" id="vitalHR" class="form-input" value="${p.heart_rate || ''}">
                  </div>
                  <div class="form-group mb-4">
                     <label>SpO2 (%)</label>
                     <input type="number" id="vitalO2" class="form-input" value="${p.spo2 || ''}">
                  </div>
                  <div class="form-group mb-4">
                     <label>Temperature (°C)</label>
                     <input type="number" step="0.1" id="vitalTemp" class="form-input" value="${p.temperature || ''}">
                  </div>
                  <div class="form-group mb-4">
                     <label>Blood Pressure</label>
                     <input type="text" id="vitalBP" class="form-input" placeholder="120/80" value="${p.blood_pressure || ''}">
                  </div>
               </div>

               <div class="form-section">
                  <h4 class="section-subtitle">Clinical Oversight</h4>
                  <div class="form-group mb-4">
                     <label>Clinical Status</label>
                     <select id="patientStatus" class="form-input">
                        <option value="stable" ${p.status === 'stable' ? 'selected' : ''}>Stable</option>
                        <option value="warning" ${p.status === 'warning' ? 'selected' : ''}>Warning</option>
                        <option value="critical" ${p.status === 'critical' ? 'selected' : ''}>Critical</option>
                     </select>
                  </div>
                  ${AppState.role === 'doctor' ? `
                  <div class="form-group">
                     <label>Diagnosis / Notes</label>
                     <textarea id="patientNotes" class="form-input h-32">${p.notes || ''}</textarea>
                  </div>` : `
                  <div class="form-group">
                     <label>Diagnosis (Read-only)</label>
                     <div class="readonly-box p-3 bg-white/5 rounded-lg text-sm">${p.notes || 'No notes provided by Physician.'}</div>
                  </div>`}
               </div>
            </div>
         </div>

         <!-- History Tab -->
         <div class="detail-tab-content" id="tabHistory">
            <div class="history-timeline">
               <div class="timeline-item">
                  <div class="timeline-dot"></div>
                  <div class="timeline-content">
                     <span class="timeline-time">Today</span>
                     <p>Vitals recorded — HR: ${p.heart_rate}, SpO2: ${p.spo2}%</p>
                  </div>
               </div>
               <div class="timeline-item">
                  <div class="timeline-dot"></div>
                  <div class="timeline-content">
                     <span class="timeline-time">Admission</span>
                     <p>Patient admitted to Ward ${p.ward || 'General'}</p>
                  </div>
               </div>
            </div>
         </div>

         <!-- Actions Tab (Doctors only) -->
         <div class="detail-tab-content" id="tabActions">
            ${AppState.role === 'doctor' ? `
            <div class="action-grid">
               <button class="action-card" onclick="DoctorActions.openDiagnosisForm('${p.id}')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                     <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span>Add Diagnosis</span>
               </button>
               <button class="action-card" onclick="DoctorActions.openPrescriptionForm('${p.id}')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                     <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                     <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                  </svg>
                  <span>Add Prescription</span>
               </button>
               <button class="action-card" onclick="DoctorActions.openLabRequestForm('${p.id}')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                     <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                     <polyline points="14 2 14 8 20 8"/>
                     <line x1="16" y1="13" x2="8" y2="13"/>
                     <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  <span>Request Lab Test</span>
               </button>
               <button class="action-card" onclick="DoctorActions.openTreatmentPlanForm('${p.id}')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                     <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <span>Treatment Plan</span>
               </button>
            </div>
            ` : '<p class="text-center" style="opacity:0.5;padding:2rem">Doctor-only actions. Contact your physician.</p>'}
         </div>
      </div>
    `;

      UI.openModal('patientModal');

      const saveBtn = document.getElementById('addPatientBtn');
      saveBtn.textContent = 'Save Medical Record';
      saveBtn.onclick = () => Patients.handleSave(id);
   }

   function switchDetailTab(tab) {
      document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.detail-tab-content').forEach(c => c.classList.remove('active'));

      const tabMap = { vitals: 'tabVitals', history: 'tabHistory', actions: 'tabActions' };
      document.getElementById(tabMap[tab])?.classList.add('active');

      // Highlight tab button
      const tabs = document.querySelectorAll('.detail-tab');
      const idx = ['vitals', 'history', 'actions'].indexOf(tab);
      if (tabs[idx]) tabs[idx].classList.add('active');
   }

   async function handleSave(id) {
      const btn = document.getElementById('addPatientBtn');
      btn.disabled = true;

      const updates = {
         heart_rate: parseInt(document.getElementById('vitalHR').value),
         spo2: parseInt(document.getElementById('vitalO2').value),
         temperature: parseFloat(document.getElementById('vitalTemp').value),
         blood_pressure: document.getElementById('vitalBP')?.value || null,
         status: document.getElementById('patientStatus').value,
         last_vitals_update: new Date().toISOString()
      };

      if (AppState.role === 'doctor') {
         updates.notes = document.getElementById('patientNotes').value;
      }

      const { success } = await API.updatePatient(id, updates);
      if (success) {
         UI.showToast('Clinical data synchronized', 'success');
         UI.closeModal('patientModal');

         const idx = allPatients.findIndex(x => x.id === id);
         allPatients[idx] = { ...allPatients[idx], ...updates };
         renderGrid();
         updateDashboardStats();

         // Audit log
         await API.logAction({
            action_type: 'UPDATE',
            user_id: AppState.user.id,
            entity: 'patients',
            entity_id: id,
            new_data: updates
         });
      }
      btn.disabled = false;
   }

   function updateDashboardStats() {
      const totalEl = document.getElementById('statTotal');
      const criticalEl = document.getElementById('statCritical');
      const appointEl = document.getElementById('statAppointments');
      if (totalEl) totalEl.textContent = allPatients.length;
      if (criticalEl) criticalEl.textContent = allPatients.filter(p => p.status === 'critical').length;
      if (appointEl) appointEl.textContent = Math.floor(Math.random() * 8) + 2; // Placeholder
   }

   async function admitPatient(e) {
      if (e) e.preventDefault();

      const btn = document.querySelector('#admissionForm button[type="submit"]');
      if (btn) btn.disabled = true;

      const patientData = {
         name: document.getElementById('admName').value,
         age: parseInt(document.getElementById('admAge').value),
         gender: document.getElementById('admGender').value,
         blood_group: document.getElementById('admBlood').value,
         phone: document.getElementById('admPhone').value,
         emergency_contact: document.getElementById('admEmergency').value,
         department: document.getElementById('admDept').value,
         ward: document.getElementById('admWard').value,
         address: document.getElementById('admAddress').value,
         condition: document.getElementById('admCondition').value,
         assigned_doctor: AppState.user.id,
         status: 'admitted',
         created_at: new Date().toISOString()
      };

      try {
         const { success, message } = await API.addPatient(patientData);
         if (success) {
            UI.showToast('Patient admitted successfully', 'success');
            UI.closeModal('admissionModal');
            document.getElementById('admissionForm').reset();
            load(); // Re-fetch
         } else {
            UI.showToast(message || 'Failed to admit patient', 'error');
         }
      } catch (err) {
         UI.showToast('Critical error during admission', 'error');
      } finally {
         if (btn) btn.disabled = false;
      }
   }

   function getAll() { return allPatients; }

   return { load, openDetailModal, handleSave, switchDetailTab, admitPatient, getAll };
})();


// Register globally
window.Patients = Patients;

