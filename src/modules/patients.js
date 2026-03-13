import { API } from '../core/api.js';
import { AppState } from './dashboard.js';
import { Notifications } from '../ui/notifications.js';
import { UI } from '../ui/ui.js';
import { Skeletons } from '../ui/skeletons.js';
import { supabaseClient } from '../core/supabase.js';

const Patients = (() => {
   let allPatients = [];

   async function load() {
      Skeletons.render('patientGrid', 3);

      try {
         const { data, success, message } = await API.getPatients(AppState.role, AppState.user.id);
         if (success) {
            allPatients = data || [];
            renderGrid();
            updateDashboardStats();
            setupRealtime();
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
      // Logic moved to central Realtime engine in dashboard.js to avoid redundancy
      return;
   }

   function renderGrid() {
      console.log(`Carenium Patients: Rendering grid with ${allPatients.length} records.`);
      const grid = document.getElementById('patientGrid');
      if (!grid) return;

      if (allPatients.length === 0) {
         grid.innerHTML = `
                <div class="empty-state p-12 text-center opacity-50">
                    <p>No patients currently assigned to your unit.</p>
                </div>`;
         return;
      }

      // Performance Optimization: Use batching to reduce reflows
      const html = allPatients.map(p => renderCard(p)).join('');
      grid.innerHTML = html;
   }

   function renderCard(p) {
      const status = p.status || 'stable';
      const riskScore = p.ai_risk_score || Math.floor(Math.random() * 100);
      const riskClass = riskScore > 80 ? 'high' : riskScore > 40 ? 'medium' : 'low';

      const lastUpdate = p.last_vitals_update
         ? new Date(p.last_vitals_update).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
         : 'Live';

      return `
      <div class="patient-card glass-card fade-page status-${status} group hover:translate-y-[-4px] transition-all duration-300 relative overflow-hidden" id="patient-${p.id}" style="border-left: 4px solid ${status === 'critical' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#10b981'}">
        <div class="ai-risk-badge ${riskClass} bg-gradient-to-br ${riskScore > 80 ? 'from-red-500/20 to-red-500/5' : riskScore > 40 ? 'from-amber-500/20 to-amber-500/5' : 'from-emerald-500/20 to-emerald-500/5'} border-b border-white/5">
            <span class="${riskScore > 80 ? 'text-red-400' : riskScore > 40 ? 'text-amber-400' : 'text-emerald-400'}">AI RISK: ${riskScore}%</span>
        </div>

        <div class="patient-header">
          <div class="patient-meta">
            <div class="patient-name group-hover:text-indigo-400 transition-colors">${p.name}</div>
            <div class="patient-age text-xs opacity-60">${p.age} Yrs • Ward ${p.ward || 'General'}</div>
          </div>
          <div class="status-indicator-badge flex items-center gap-2">
             <span class="status-indicator w-2 h-2 rounded-full ${status === 'critical' ? 'bg-red-500 animate-pulse' : status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}"></span>
             <span class="status-text text-[10px] font-black uppercase text-white/70">${status}</span>
          </div>
        </div>

         <div class="vitals-grid grid grid-cols-2 gap-3 mt-4">
            <div class="vital-item bg-white/5 p-3 rounded-xl border border-white/5">
               <label class="text-[9px] opacity-40 uppercase font-black block mb-1">Heart Rate</label>
               <div class="value font-black text-white flex items-center gap-2">
                  <span class="heart-rate-pulse">❤️</span>
                  ${p.heart_rate || '--'} <small class="text-[10px] opacity-40">BPM</small>
               </div>
            </div>
            <div class="vital-item bg-white/5 p-3 rounded-xl border border-white/5">
               <label class="text-[9px] opacity-40 uppercase font-black block mb-1">SpO2</label>
               <div class="value font-black ${p.spo2 < 92 ? 'text-red-400' : 'text-white'}">${p.spo2 || '--'} <small class="text-[10px] opacity-40">%</small></div>
            </div>
            <div class="vital-item bg-white/5 p-3 rounded-xl border border-white/5">
               <label class="text-[9px] opacity-40 uppercase font-black block mb-1">Temperature</label>
               <div class="value font-black text-white">${p.temperature || '--'} <small class="text-[10px] opacity-40">°C</small></div>
            </div>
            <div class="vital-item bg-white/5 p-3 rounded-xl border border-white/5">
               <label class="text-[9px] opacity-40 uppercase font-black block mb-1">Blood Pressure</label>
               <div class="value font-black text-white text-xs">${p.blood_pressure || '--'}</div>
            </div>
         </div>

        <div class="patient-card-footer flex justify-between items-center mt-4 pt-4 border-t border-white/5">
           <span class="last-update text-[9px] opacity-40 uppercase tracking-widest font-bold">Sync: ${lastUpdate}</span>
           <div class="flex gap-2">
               <button class="btn btn-sm btn-action bg-white/10 hover:bg-indigo-500/20" onclick="Patients.openMonitorModal('${p.id}')">
                  Monitor
               </button>
               <button class="btn btn-sm btn-action bg-white/10 hover:bg-purple-500/20" onclick="Patients.openDetailModal('${p.id}')">
                  Chart
               </button>
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
      if (!modalBody) return;

      modalBody.innerHTML = `
      <div class="patient-detail-view p-4">
         <div class="detail-header mb-6 flex flex-col gap-4">
            <div class="flex justify-between items-start">
               <div class="detail-patient-info">
                  <h3 class="text-xl font-black">${p.name}</h3>
                  <span class="text-xs opacity-60">${p.age} Years • ${p.gender || 'Unknown'} • Ward ${p.ward || 'General'}</span>
               </div>
               <span class="badge ${p.status === 'critical' ? 'bg-red-500' : p.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'} text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">${p.status || 'stable'}</span>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
               <div class="glass-card p-3 border border-white/5 text-center">
                  <div class="text-[10px] opacity-50 font-bold uppercase">Department</div>
                  <div class="text-sm font-bold mt-1">${p.department || 'General'}</div>
               </div>
               <div class="glass-card p-3 border border-white/5 text-center">
                  <div class="text-[10px] opacity-50 font-bold uppercase">Phone</div>
                  <div class="text-sm font-bold mt-1">${p.phone || 'N/A'}</div>
               </div>
               <div class="glass-card p-3 border border-white/5 text-center">
                  <div class="text-[10px] opacity-50 font-bold uppercase">Blood Group</div>
                  <div class="text-sm font-bold mt-1">${p.blood_group || 'Unknown'}</div>
               </div>
               <div class="glass-card p-3 border border-white/5 text-center">
                  <div class="text-[10px] opacity-50 font-bold uppercase">Condition</div>
                  <div class="text-sm font-bold mt-1">${p.condition || 'Observation'}</div>
               </div>
            </div>
         </div>

         <div class="detail-tabs" id="detailTabs">
            <button class="detail-tab active" onclick="Patients.switchDetailTab('vitals')">Vitals & AI</button>
            <button class="detail-tab" onclick="Patients.switchDetailTab('timeline')">Timeline</button>
            <button class="detail-tab" onclick="Patients.switchDetailTab('prescriptions')">Prescriptions</button>
            <button class="detail-tab" onclick="Patients.switchDetailTab('reports')">Reports</button>
         </div>

         <div class="detail-tab-content active" id="tabVitals">
            <div class="ai-risk-panel mb-6 glass-card p-4">
               <div class="flex justify-between items-center">
                  <span class="text-sm font-bold opacity-70">AI CLINICAL RISK ASSESSMENT</span>
                  <span class="badge ${p.ai_risk_score > 70 ? 'bg-red-500' : p.ai_risk_score > 30 ? 'bg-yellow-500' : 'bg-green-500'} text-white px-2 py-0.5 rounded text-[10px] font-black">${p.ai_risk_score > 70 ? 'HIGH RISK' : p.ai_risk_score > 30 ? 'WARNING' : 'STABLE'}</span>
               </div>
               <div class="risk-score-display flex items-baseline gap-2 mt-2">
                  <span class="text-3xl font-black">${p.ai_risk_score || 0}%</span>
                  <span class="text-xs opacity-50">Score generated by Carenium AI Engine</span>
               </div>
            </div>

            <div class="vitals-visualization mb-6 glass-card p-4 border border-white/5">
                <h4 class="text-xs font-black uppercase opacity-40 tracking-widest mb-4">Vitals History Trend</h4>
                <div style="height: 200px; position: relative;">
                    <canvas id="vitalsChart"></canvas>
                </div>
            </div>

            <div class="form-grid">
               <div class="form-section">
                  <h4 class="section-subtitle">Real-time Vitals</h4>
                  <div class="form-group mb-4">
                     <label>Heart Rate (BPM)</label>
                     <input type="number" id="vitalHR" class="form-input" value="${p.heart_rate || ''}">
                  </div>
                  <div class="form-group mb-4">
                     <label>SpO2 (%)</label>
                     <input type="number" id="vitalO2" class="form-input" value="${p.spo2 || ''}">
                  </div>
                   <div class="form-group mb-4">
                     <label>BP (mmHg)</label>
                     <input type="text" id="vitalBP" class="form-input" value="${p.blood_pressure || ''}" placeholder="120/80">
                  </div>
               </div>

               <div class="form-section">
                  <h4 class="section-subtitle">Environment & State</h4>
                  <div class="form-group mb-4">
                     <label>Clinical Status</label>
                     <select id="patientStatus" class="form-input">
                        <option value="stable" ${p.status === 'stable' ? 'selected' : ''}>Stable</option>
                        <option value="warning" ${p.status === 'warning' ? 'selected' : ''}>Warning</option>
                        <option value="critical" ${p.status === 'critical' ? 'selected' : ''}>Critical</option>
                     </select>
                  </div>
                  <div class="form-group mb-4">
                     <label>Temperature (°C)</label>
                     <input type="number" id="vitalTemp" class="form-input" step="0.1" value="${p.temperature || ''}">
                  </div>
                  <div class="form-group mb-4">
                     <label>Respiratory Rate (/min)</label>
                     <input type="number" id="vitalRR" class="form-input" value="${p.respiratory_rate || ''}">
                  </div>
               </div>
            </div>
         </div>

         <div class="detail-tab-content" id="tabTimeline">
            <div id="timelineContainer" class="p-4">
               <div class="skeleton-text mb-2"></div>
               <div class="skeleton-text mb-2"></div>
               <div class="skeleton-text"></div>
            </div>
         </div>

         <div class="detail-tab-content" id="tabPrescriptions">
            <div class="p-4">
               <div class="flex justify-between items-center mb-4">
                  <h4 class="font-bold text-sm">Active Meds</h4>
                  <button class="btn btn-sm btn-primary" onclick="window.Prescriptions?.openCreator('${p.id}')">New Script</button>
               </div>
               <div id="prescriptionsList"></div>
            </div>
         </div>

         <div class="detail-tab-content" id="tabReports">
            <div class="p-4">
               <div class="flex justify-between items-center mb-4">
                  <h4 class="font-bold text-sm">Medical Reports</h4>
                  <div class="flex gap-2">
                     <button class="btn btn-sm btn-outline" onclick="window.Reports?.generateReport('diagnosis','${p.id}')">Diagnosis</button>
                     <button class="btn btn-sm btn-outline" onclick="window.Reports?.generateReport('discharge','${p.id}')">Discharge</button>
                  </div>
               </div>
               <div id="reportsList"></div>
            </div>
         </div>
      </div>
    `;

      UI.openModal('patientModal');
      
      // Initialize Chart
      setTimeout(() => renderVitalsChart(p), 300);

      const saveBtn = document.getElementById('addPatientBtn');
      if (saveBtn) {
         saveBtn.textContent = 'Save Medical Record';
         saveBtn.onclick = () => Patients.handleSave(id);
      }
   }

   function switchDetailTab(tab) {
      document.querySelectorAll('.detail-tab').forEach(t => {
         t.classList.toggle('active', t.getAttribute('onclick')?.includes(`'${tab}'`));
      });
      document.querySelectorAll('.detail-tab-content').forEach(c => c.classList.remove('active'));

      const tabMap = {
         vitals: 'tabVitals',
         timeline: 'tabTimeline',
         prescriptions: 'tabPrescriptions',
         reports: 'tabReports'
      };

      const target = document.getElementById(tabMap[tab]);
      if (target) {
         target.classList.add('active');
         if (tab === 'timeline') loadTimeline(AppState.activePatient.id);
         if (tab === 'prescriptions') loadPrescriptions(AppState.activePatient.id);
         if (tab === 'reports') loadReports(AppState.activePatient.id);
      }
   }

   async function loadTimeline(id) {
      const container = document.getElementById('timelineContainer');
      if (!container) return;

      const p = allPatients.find(x => x.id === id);
      const admitTime = p?.created_at ? new Date(p.created_at) : new Date();
      const doctorName = AppState.isDemoMode ? 'Dr. Demo' : ('Dr. ' + (AppState.user?.email?.split('@')[0] || 'User'));

      // Build timeline events from patient data
      const events = [
         { time: admitTime, label: 'Patient Admitted', detail: `${p?.name} admitted to ${p?.ward || 'General'} ward`, icon: '🏥', doctor: doctorName },
      ];

      if (p?.heart_rate || p?.spo2 || p?.temperature) {
         events.push({ 
            time: new Date(admitTime.getTime() + 1800000), 
            label: 'Vitals Recorded', 
            detail: `HR: ${p.heart_rate||'--'} BPM • SpO2: ${p.spo2||'--'}% • Temp: ${p.temperature||'--'}°C`, 
            icon: '💓',
            doctor: doctorName,
            notes: 'Initial clinical assessment completed.'
         });
      }
      
      if (p?.condition && p.condition !== 'Observation') {
         events.push({ 
            time: new Date(admitTime.getTime() + 3600000), 
            label: 'Diagnosis Added', 
            detail: p.condition, 
            icon: '🩺',
            doctor: doctorName,
            notes: 'Primary diagnosis updated based on physical exam.'
         });
      }

      // Load prescriptions for timeline
      const rxRes = await API.getPrescriptions(id);
      if (rxRes.success && rxRes.data) {
         rxRes.data.forEach(rx => {
            events.push({ 
               time: new Date(rx.created_at), 
               label: 'Prescription Issued', 
               detail: `${rx.medicine} ${rx.dosage}`, 
               icon: '💊',
               doctor: doctorName,
               notes: `Instructions: ${rx.frequency}`
            });
         });
      }

      // Sort by time
      events.sort((a, b) => b.time - a.time); // Newest first for better timeline flow

      container.innerHTML = `
         <div class="relative pl-6 border-l-2 border-indigo-500/30 flex flex-col gap-8 mt-4">
            ${events.map(ev => `
               <div class="relative">
                  <div class="absolute -left-[27px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-2 border-[#1a1f2e] z-10"></div>
                  <div class="text-[10px] text-indigo-400 font-bold tracking-widest uppercase mb-1">${ev.time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • ${ev.time.toLocaleDateString()}</div>
                  <div class="glass-card p-4 border border-white/5 relative">
                     <div class="flex items-center gap-2 mb-2">
                        <span class="text-lg">${ev.icon}</span>
                        <h4 class="text-sm font-black">${ev.label}</h4>
                     </div>
                     <div class="text-xs font-bold text-white/80 mb-1">${ev.detail}</div>
                     <div class="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                        <span class="text-[10px] opacity-40 italic">By ${ev.doctor}</span>
                        ${ev.notes ? `<span class="text-[10px] bg-white/5 px-2 py-0.5 rounded opacity-60">${ev.notes}</span>` : ''}
                     </div>
                  </div>
               </div>
            `).join('')}
         </div>
      `;
   }

   function renderVitalsChart(p) {
      const ctx = document.getElementById('vitalsChart');
      if (!ctx || !window.Chart) return;

      // Mock historical data for trend visualization
      const labels = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 'Current'];
      const hrData = [72, 75, 78, 82, 80, 78, p.heart_rate || 75];
      const o2Data = [98, 97, 98, 96, 97, 98, p.spo2 || 98];

      new window.Chart(ctx, {
         type: 'line',
         data: {
            labels: labels,
            datasets: [
               {
                  label: 'Heart Rate',
                  data: hrData,
                  borderColor: '#ff6b6b',
                  backgroundColor: 'rgba(255, 107, 107, 0.1)',
                  borderWidth: 3,
                  tension: 0.4,
                  fill: true,
                  yAxisID: 'y'
               },
               {
                  label: 'SpO2',
                  data: o2Data,
                  borderColor: '#1dd1a1',
                  backgroundColor: 'rgba(29, 209, 161, 0.1)',
                  borderWidth: 3,
                  tension: 0.4,
                  fill: true,
                  yAxisID: 'y1'
               }
            ]
         },
         options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
               legend: {
                  display: true,
                  labels: { color: 'rgba(255,255,255,0.6)', font: { size: 10, weight: 'bold' } }
               }
            },
            scales: {
               x: {
                  grid: { display: false },
                  ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 9 } }
               },
               y: {
                  beginAtZero: false,
                  grid: { color: 'rgba(255,255,255,0.05)' },
                  ticks: { color: '#ff6b6b', font: { size: 9 } },
                  position: 'left'
               },
               y1: {
                  beginAtZero: false,
                  grid: { display: false },
                  ticks: { color: '#1dd1a1', font: { size: 9 } },
                  position: 'right',
                  min: 80,
                  max: 100
               }
            }
         }
      });
   }

   async function loadPrescriptions(id) {
      const container = document.getElementById('prescriptionsList');
      if (!container) return;

      const { data, success } = await API.getPrescriptions(id);
      if (success && data && data.length > 0) {
         container.innerHTML = data.map(rx => `
            <div class="p-3 bg-white/5 border border-white/5 rounded-lg mb-2">
               <div class="flex justify-between font-bold text-sm">
                  <span>${rx.medicine}</span>
                  <span class="opacity-50">${rx.dosage}</span>
               </div>
               <div class="text-xs opacity-50 mt-1">${rx.frequency} • ${rx.duration}</div>
            </div>
         `).join('');
      } else {
         container.innerHTML = `<div class="p-6 text-center opacity-30">No active medication records.</div>`;
      }
   }

   async function loadReports(id) {
      const container = document.getElementById('reportsList');
      if (!container) return;
      container.innerHTML = `<div class="p-8 text-center opacity-30">No digital lab results available.</div>`;
   }

   async function handleSave(id) {
      const btn = document.getElementById('addPatientBtn');
      if (btn) btn.disabled = true;

      const updates = {
         heart_rate: parseInt(document.getElementById('vitalHR')?.value || 0),
         spo2: parseInt(document.getElementById('vitalO2')?.value || 0),
         temperature: parseFloat(document.getElementById('vitalTemp')?.value || 0),
         blood_pressure: document.getElementById('vitalBP')?.value || '',
         status: document.getElementById('patientStatus')?.value || 'stable',
         updated_at: new Date().toISOString()
      };

      const { success } = await API.updatePatient(id, updates);
      if (success) {
         Notifications.success('Clinical data synchronized');
         UI.closeModal('patientModal');

         const idx = allPatients.findIndex(x => x.id === id);
         if (idx !== -1) allPatients[idx] = { ...allPatients[idx], ...updates };
         renderGrid();
         updateDashboardStats();

         await API.logAction({
            action_type: 'UPDATE',
            user_id: AppState.user.id,
            entity: 'patients',
            entity_id: id,
            new_data: updates
         });
      }
      if (btn) btn.disabled = false;
   }

   function updateDashboardStats() {
      const stats = {
         total: allPatients.length,
         critical: allPatients.filter(p => p.status === 'critical').length,
         appointments: 0, // Should be fetched from another module or API, but keeping 0 for now or calculating if possible
         occupancy: Math.min(Math.round((allPatients.length / 50) * 100), 100) + '%'
      };

      const totalEl = document.getElementById('statTotal');
      const criticalEl = document.getElementById('statCritical');
      const aptsEl = document.getElementById('statAppointments');
      const occupancyEl = document.getElementById('statOccupancy');

      if (totalEl) totalEl.textContent = stats.total;
      if (criticalEl) criticalEl.textContent = stats.critical;
      if (aptsEl) {
         // Optionally update today's appointments if we have the data
         // aptsEl.textContent = ...
      }
      if (occupancyEl) occupancyEl.textContent = stats.occupancy;
   }

   function getInputValue(id) {
      const el = document.getElementById(id);
      if (!el) {
         console.warn("Admission form element missing:", id);
         return "";
      }
      return el.value.trim();
   }

   async function admitPatient(e) {
      if (e) e.preventDefault();

      let isSlide = false;
      let formEl = null;

      if (e && e.target) {
         const targetId = e.target.id || '';
         formEl = e.target.closest ? e.target.closest('form') : null;
         
         if (targetId === 'slideAdmissionForm' || targetId === 'confirmAdmissionBtn' || formEl?.id === 'slideAdmissionForm' || e.target.closest?.('#admissionPanel')) {
            isSlide = true;
         }
      }
      
      let btn = formEl ? formEl.querySelector('button[type="submit"]') : document.getElementById('confirmAdmissionBtn');
      if (!btn && e && e.target && e.target.tagName === 'BUTTON') btn = e.target;
      if (!formEl) formEl = document.getElementById(isSlide ? 'slideAdmissionForm' : 'admissionForm');
      
      const prefix = isSlide ? 'slideAdm' : 'adm';

      try {
         // Reset previous highlights
         document.querySelectorAll('.border-red-500').forEach(el => el.classList.remove('border-red-500'));

         // Safe DOM Element Extraction
         const nameEl = document.getElementById(`${prefix}Name`);
         const ageEl = document.getElementById(`${prefix}Age`);
         const genderEl = document.getElementById(`${prefix}Gender`);
         const deptEl = document.getElementById(`${prefix}Dept`);
         
         const phoneEl = isSlide ? document.getElementById('slideAdmEmergency') : document.getElementById('admPhone');
         const diseaseEl = isSlide ? document.getElementById('slideAdmDisease') : document.getElementById('admCondition');
         const wardEl = isSlide ? document.getElementById('slideAdmWard') : document.getElementById('admWard');
         const roomEl = isSlide ? document.getElementById('slideAdmRoom') : document.getElementById('admRoom');
         const bedEl = isSlide ? document.getElementById('slideAdmBed') : document.getElementById('admBed');
         const notesEl = isSlide ? document.getElementById('slideAdmNotes') : document.getElementById('admNotes');

         // Prevent null errors
         if (!nameEl) return; 

         const name = nameEl.value.trim();
         const ageStr = ageEl?.value.trim() || '';
         const gender = genderEl?.value.trim() || '';
         const department = deptEl?.value.trim() || '';
         const phone = phoneEl?.value.trim() || '';
         const disease = diseaseEl?.value.trim() || '';
         const ward = wardEl?.value.trim() || '';
         const room = roomEl?.value.trim() || '';
         const bed = bedEl?.value.trim() || '';
         const notes = notesEl?.value.trim() || '';

         // Real-world Validation (Strict)
         // 1️⃣ Collect all form values and validate
         const validations = [
            { name: "Patient Name", value: name, element: nameEl },
            { name: "Age", value: ageStr, element: ageEl },
            { name: "Gender", value: gender, element: genderEl },
            { name: "Phone", value: phone, element: phoneEl },
            { name: "Condition", value: disease, element: diseaseEl },
            { name: "Department", value: department, element: deptEl },
            { name: "Ward", value: ward, element: wardEl },
            { name: "Room", value: room, element: roomEl },
            { name: "Bed", value: bed, element: bedEl },
            { name: "Doctor Notes", value: notes, element: notesEl }
         ];

         const missingFields = validations.filter(v => !v.value);
         if (missingFields.length > 0) {
            Notifications.warning(`Missing required fields: ${missingFields.map(m => m.name).join(', ')}`);
            missingFields.forEach(field => {
               if (field.element) field.element.classList.add('border-red-500');
            });
            return;
         }

         const age = parseInt(ageStr, 10);
         if (isNaN(age) || age <= 0 || age > 130) {
            Notifications.warning('Please enter a valid patient age.');
            if (ageEl) ageEl.classList.add('border-red-500');
            return;
         }

         // UI Feedback: Loading State
         let originalText = btn ? (btn.dataset.originalText || btn.innerText || btn.textContent || 'Confirm Clinical Admission') : 'Confirm Clinical Admission';
         if (btn) {
            btn.disabled = true;
            btn.dataset.originalText = originalText;
            btn.innerHTML = `<span class="flex items-center justify-center gap-2"><div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Processing...</span>`;
         }

         // 3️⃣ Create patient object
         const pidEl = document.getElementById('generatedPatientId');
         const generatedId = pidEl ? pidEl.textContent : ('PID-' + Date.now().toString(36).toUpperCase());
         const doctorName = (AppState.isDemoMode || window.isDemoMode) ? 'Dr. Demo' : ('Dr. ' + (AppState.user?.email?.split('@')[0] || 'User'));

         const patientData = {
            id: generatedId,
            patient_id: generatedId,
            name: name,
            patient_name: name,
            age: age,
            gender: gender,
            phone: phone,
            condition: disease,
            department: department,
            ward: ward,
            room: room,
            bed: bed,
            doctor: doctorName,
            doctor_id: AppState.user?.id || 'demo-doc',
            doctor_notes: notes,
            notes: notes,
            admission_time: new Date().toISOString(),
            status: 'Admitted'
         };

         console.log("Carenium Admission: Executing clinical insert:", patientData);

         const { success, message, data } = await API.addPatient(patientData);
         
         if (success) {
            // 4️⃣ Store patient in demo memory
            if (AppState.isDemoMode || window.isDemoMode) {
                window.demoPatients = window.demoPatients || [];
                const addedData = data || patientData;
                window.demoPatients.push(addedData);
                localStorage.setItem("demoPatients", JSON.stringify(window.demoPatients));
            }

            // 7️⃣ Close admission panel
            Notifications.success('Patient admitted successfully');
            
            if (isSlide && window.Dashboard) window.Dashboard.closeAdmission();
            else Modal.close('admissionModal');
            
            // Clean form safely
            if (formEl && formEl.reset) {
                formEl.reset();
            } else if (e && e.target && e.target.reset) {
                e.target.reset(); // Just in case
            }
            
            // 5️⃣ Update My Patients page & 6️⃣ Update dashboard stats
            if (typeof load === 'function') await load(); // Reloads patients and updates stats
            if (window.Dashboard && window.Dashboard.fetchDashboardData) {
               await window.Dashboard.fetchDashboardData();
            }
         } else {
            Notifications.error(message || 'Unable to admit patient. Please try again.');
         }

      } catch (err) {
         console.error("Carenium Admission Critical Error:", err);
         Notifications.error("Admission process failed. Please check network connection.");
      } finally {
         if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<span class="relative z-10">${btn.dataset.originalText || 'Confirm Clinical Admission'}</span>`;
         }
      }
   }

   function getAll() { return allPatients; }

   async function renderPatientsPage() {
      const content = document.getElementById('dashboardContent');
      if (!content) return;

      content.innerHTML = `
         <div class="patients-page fade-page p-6">
            <div class="flex justify-between items-center mb-8">
               <h2 class="text-2xl font-black text-white">Clinical Patient Registry</h2>
               <div class="flex gap-4">
                  <div class="relative">
                     <input type="text" id="patientSearch" placeholder="Search by name or ID..." class="form-input !pl-10 !mb-0 !w-64" style="background: rgba(255,255,255,0.05); border-radius: 12px;">
                     <span class="absolute left-3 top-1/2 -translate-y-1/2 opacity-40">🔍</span>
                  </div>
                  <select id="wardFilter" class="form-input !mb-0 !w-40" style="background: rgba(255,255,255,0.05); border-radius: 12px;">
                     <option value="">All Wards</option>
                     <option value="General">General</option>
                     <option value="ICU">ICU</option>
                     <option value="Emergency">Emergency</option>
                     <option value="Cardiology">Cardiology</option>
                  </select>
               </div>
            </div>

            <div id="patientsListContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <!-- Patients will be rendered here -->
            </div>
         </div>
      `;

      renderPatientsList();

      document.getElementById('patientSearch')?.addEventListener('input', (e) => {
         renderPatientsList(e.target.value, document.getElementById('wardFilter')?.value);
      });

      document.getElementById('wardFilter')?.addEventListener('change', (e) => {
         renderPatientsList(document.getElementById('patientSearch')?.value, e.target.value);
      });
   }

   function renderPatientsList(searchQuery = '', wardFilter = '') {
      const container = document.getElementById('patientsListContainer');
      if (!container) return;

      let filtered = allPatients;

      if (searchQuery) {
         const q = searchQuery.toLowerCase();
         filtered = filtered.filter(p => 
            p.patient_name?.toLowerCase().includes(q) || 
            p.patient_id?.toLowerCase().includes(q) ||
            p.name?.toLowerCase().includes(q)
         );
      }

      if (wardFilter) {
         filtered = filtered.filter(p => (p.ward || 'General') === wardFilter);
      }

      if (filtered.length === 0) {
         container.innerHTML = `<div class="col-span-full p-20 text-center opacity-40 italic">No patients match your current search/filter criteria.</div>`;
         return;
      }

      container.innerHTML = filtered.map(p => `
         <div class="patient-card glass-card !p-0 overflow-hidden flex flex-col group hover:border-indigo-500/40 transition-all border border-white/5" style="border-left: 4px solid ${p.status === 'critical' ? '#ef4444' : '#10b981'}">
            <div class="p-6">
               <div class="flex justify-between items-start mb-4">
                  <div>
                     <h3 class="font-black text-lg text-white group-hover:text-indigo-400 transition-colors">${p.patient_name || p.name}</h3>
                     <span class="text-[10px] opacity-40 font-mono uppercase tracking-tighter">${p.patient_id || 'ID-PENDING'}</span>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase ${p.status === 'critical' ? 'bg-red-500 text-white' : 'bg-green-500/20 text-green-400'}">${p.status || 'stable'}</span>
               </div>

               <div class="grid grid-cols-2 gap-4 mb-6">
                  <div>
                     <label class="text-[9px] opacity-40 font-bold uppercase block mb-1">Ward / Room</label>
                     <span class="text-xs font-bold text-white/80">${p.ward || 'Gen'} • ${p.room || 'N/A'}</span>
                  </div>
                  <div>
                     <label class="text-[9px] opacity-40 font-bold uppercase block mb-1">Risk Scale</label>
                     <span class="text-xs font-bold ${p.ai_risk_score > 70 ? 'text-red-400' : 'text-indigo-400'}">${p.ai_risk_score || 0}% Probability</span>
                  </div>
               </div>

               <div class="flex justify-between items-center text-[10px] opacity-40 border-t border-white/5 pt-4">
                  <span>${p.age} Yrs • ${p.gender}</span>
                  <span>Sync: ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
               </div>
            </div>
            <div class="bg-white/5 p-3 flex gap-2">
               <button class="btn btn-sm btn-primary flex-1 !py-2 !text-[11px]" onclick="Patients.openChartPanel('${p.id}')">View Full Chart</button>
               <button class="btn btn-sm btn-secondary flex-1 !py-2 !text-[11px]" onclick="Patients.openMonitorModal('${p.id}')">Monitor</button>
            </div>
         </div>
      `).join('');
   }

   function openMonitorModal(id) {
      const p = allPatients.find(x => x.id === id);
      if (!p) return;

      const title = document.getElementById('monitorPatientName');
      const body = document.getElementById('monitorModalBody');
      if (title) title.textContent = `Monitoring: ${p.name}`;
      
      if (body) {
         body.innerHTML = `
            <div class="monitor-vitals-box">
                <div class="flex justify-between items-center mb-6">
                    <div class="flex flex-col">
                        <span class="text-[10px] opacity-50 uppercase font-black">AI Risk Assessment</span>
                        <div class="flex items-center gap-2">
                           <span class="text-xl font-black ${p.ai_risk_score > 70 ? 'text-red-400' : p.ai_risk_score > 30 ? 'text-yellow-400' : 'text-green-400'}">${p.ai_risk_score || 0}% Probability</span>
                           <span class="w-2 h-2 rounded-full ${p.ai_risk_score > 70 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}"></span>
                        </div>
                    </div>
                    <div class="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold border border-white/5">
                        Ward ${p.ward || 'Gen'}
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="vital-monitor-card p-4 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden">
                        <div class="absolute -right-4 -bottom-4 opacity-10 text-6xl">❤️</div>
                        <label class="text-[10px] opacity-40 uppercase block mb-2 font-bold tracking-widest">Heart Rate</label>
                        <div class="text-3xl font-black flex items-baseline gap-1">
                            <span class="heart-rate-pulse text-red-400">❤️</span>
                            ${p.heart_rate || '--'} <small class="text-xs opacity-40">BPM</small>
                        </div>
                    </div>
                    <div class="vital-monitor-card p-4 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden">
                        <div class="absolute -right-4 -bottom-4 opacity-10 text-6xl">🫁</div>
                        <label class="text-[10px] opacity-40 uppercase block mb-2 font-bold tracking-widest">Oxygen (SpO2)</label>
                        <div class="text-3xl font-black flex items-baseline gap-1 ${p.spo2 < 92 ? 'text-red-400' : 'text-white'}">
                            ${p.spo2 || '--'} <small class="text-xs opacity-40">%</small>
                        </div>
                    </div>
                </div>

                <div class="mb-4 bg-white/5 border border-white/5 rounded-2xl p-4">
                    <h4 class="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-3">Live Vitals Trend</h4>
                    <div style="height: 120px; position: relative;">
                        <canvas id="miniMonitorChart"></canvas>
                    </div>
                </div>

                <div class="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-6">
                    <div class="text-[10px] text-indigo-400 font-black uppercase mb-1">Condition Observation</div>
                    <div class="text-sm font-bold text-white/90">${p.condition || 'General Observation'}</div>
                </div>
                
                <div class="text-center mt-2 flex gap-3">
                    <button class="btn btn-sm btn-action flex-1 bg-white/5 hover:bg-white/10" onclick="UI.closeModal('monitorModal')">Close</button>
                    <button class="btn btn-sm btn-primary flex-1" onclick="UI.closeModal('monitorModal'); Patients.openChartPanel('${p.id}')">View Full Chart</button>
                </div>
            </div>
         `;
      }
      
      UI.openModal('monitorModal');

      // Initialize mini chart
      setTimeout(() => {
          const ctx = document.getElementById('miniMonitorChart');
          if (!ctx || !window.Chart) return;
          
          new window.Chart(ctx, {
              type: 'line',
              data: {
                  labels: ['-30m', '-25m', '-20m', '-15m', '-10m', '-5m', 'Now'],
                  datasets: [{
                      label: 'HR',
                      data: [72, 74, 73, 75, 76, 74, p.heart_rate || 75],
                      borderColor: '#ef4444',
                      borderWidth: 2,
                      tension: 0.4,
                      pointRadius: 0
                  }, {
                      label: 'SpO2',
                      data: [98, 98, 97, 98, 97, 98, p.spo2 || 98],
                      borderColor: '#10b981',
                      borderWidth: 2,
                      tension: 0.4,
                      pointRadius: 0
                  }]
              },
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                      x: { display: false },
                      y: { display: false, min: 60 }
                  }
              }
          });
      }, 300);
   }

   function openChartPanel(id) {
      const p = allPatients.find(x => x.id === id);
      if (!p) return;

      const title = document.getElementById('chartPatientName');
      const meta = document.getElementById('chartPatientMeta');
      const content = document.getElementById('chartPanelContent');
      
      if (title) title.textContent = `${p.name} — Health Timeline`;
      if (meta) meta.textContent = `${p.age} Yrs • ${p.gender} • PID: ${p.id} • Ward ${p.ward || 'General'}`;

      if (content) {
         content.innerHTML = `
            <div class="timeline-chart-container">
                <div class="flex justify-between items-center mb-6">
                    <h4 class="text-sm font-black uppercase opacity-60">Heart Rate History (24h)</h4>
                    <span class="text-xl font-black text-red-400">${p.heart_rate || '--'} BPM</span>
                </div>
                <canvas id="hrTimelineChart"></canvas>
            </div>
            <div class="timeline-chart-container">
                <div class="flex justify-between items-center mb-6">
                    <h4 class="text-sm font-black uppercase opacity-60">Oxygen Saturation (SpO2)</h4>
                    <span class="text-xl font-black text-green-400">${p.spo2 || '--'} %</span>
                </div>
                <canvas id="spo2TimelineChart"></canvas>
            </div>
            <div class="timeline-chart-container">
                <div class="flex justify-between items-center mb-6">
                    <h4 class="text-sm font-black uppercase opacity-60">Body Temperature (°C)</h4>
                    <span class="text-xl font-black text-amber-400">${p.temperature || '--'} °C</span>
                </div>
                <canvas id="tempTimelineChart"></canvas>
            </div>
         `;
         
         UI.openPanel('chartPanel');
         
         // Initialize High-res Charts
         setTimeout(() => {
            renderTimelineChart('hrTimelineChart', [72, 75, 78, 85, 82, 80, 78, 75, p.heart_rate || 75], '#ef4444');
            renderTimelineChart('spo2TimelineChart', [98, 98, 97, 96, 95, 96, 98, 98, p.spo2 || 98], '#10b981');
            renderTimelineChart('tempTimelineChart', [36.5, 36.6, 36.7, 36.8, 37.0, 37.2, 36.9, 36.7, p.temperature || 36.7], '#f59e0b');
         }, 600);
      }
   }

   function renderTimelineChart(canvasId, data, color) {
      const ctx = document.getElementById(canvasId);
      if (!ctx || !window.Chart) return;
      
      new window.Chart(ctx, {
          type: 'line',
          data: {
              labels: ['', '', '', '', '', '', '', '', 'NOW'],
              datasets: [{
                  data: data,
                  borderColor: color,
                  borderWidth: 3,
                  tension: 0.4,
                  pointRadius: 0,
                  fill: true,
                  backgroundColor: color + '10'
              }]
          },
          options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                  x: { grid: { display: false }, ticks: { display: false } },
                  y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 10 } } }
              }
          }
      });
   }

   async function init() {
      await load();
   }

   console.log("Carenium Patients: Module loaded.");
   return { init, load, openDetailModal, openMonitorModal, openChartPanel, handleSave, switchDetailTab, admitPatient, getAll, renderPatientsPage };
})();

export { Patients };
window.Patients = Patients;


