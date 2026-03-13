import{N as h,s as L,a as w,A as S}from"./api-DAyZ9kHC.js";const k=(()=>{function s(){return L}let o=null;function p(d){if(!window.isDemoMode){if(!s()){console.warn("Carenium Real-time: Supabase not ready.");return}if(o&&o.state==="joined"){console.log("Carenium Real-time: Live sync already active.");return}try{console.log("Carenium Real-time: Initializing hospital-live channel..."),o&&s().removeChannel(o),o=s().channel("hospital-live").on("postgres_changes",{event:"*",schema:"public",table:"patients"},l=>{console.log("Carenium Real-time: [EVENT] Clinical records update."),d("patients",l)}).on("postgres_changes",{event:"*",schema:"public",table:"appointments"},l=>{console.log("Carenium Real-time: [EVENT] Clinical schedule update."),d("appointments",l)}).on("postgres_changes",{event:"*",schema:"public",table:"prescriptions"},l=>{console.log("Carenium Real-time: [EVENT] Pharmacy records update."),d("prescriptions",l)}).on("postgres_changes",{event:"*",schema:"public",table:"vitals_history"},l=>{d("vitals",l)}).on("postgres_changes",{event:"UPDATE",schema:"public",table:"doctors"},l=>{d("staff",l)}).on("postgres_changes",{event:"UPDATE",schema:"public",table:"nurses"},l=>{d("staff",l)}).subscribe((l,y)=>{l==="SUBSCRIBED"?console.log("Carenium Real-time: [CONNECTED] Monitoring live updates."):l==="CLOSED"?console.warn("Carenium Real-time: [CLOSED] Connection lost."):l==="CHANNEL_ERROR"&&(console.error("Carenium Real-time: [ERROR] Subscription failed:",y),h.warning("Live sync interrupted. Reconnecting..."),o=null)})}catch(l){console.error("Carenium Real-time: [CRITICAL] Init failure:",l)}}}function m(){o&&o.unsubscribe()}return{init:p,stop:m}})();window.Realtime=k;const D={init(){console.log("Modal system initialized"),document.addEventListener("click",s=>{if(s.target.classList.contains("modal-overlay")){const o=s.target.id;o&&this.close(o)}})},open(s){const o=document.getElementById(s);o&&(o.style.display="flex",o.offsetWidth,o.classList.add("modal-active"),document.body.style.overflow="hidden",window.dispatchEvent(new CustomEvent("modalOpened",{detail:{modalId:s}})))},close(s){const o=document.getElementById(s);o&&(o.classList.remove("modal-active"),document.body.style.overflow="",setTimeout(()=>{o.classList.contains("modal-active")||(o.style.display="none")},400),window.dispatchEvent(new CustomEvent("modalClosed",{detail:{modalId:s}})))},confirm(s,o,p){const m="confirmDialog";let d=document.getElementById(m);return d||(d=document.createElement("div"),d.id=m,d.className="modal-overlay",document.body.appendChild(d)),d.style.display="flex",d.innerHTML=`
            <div class="modal-content glass-card" style="max-width: 420px; padding: 32px; border-radius: 24px; text-align: center;">
                <h3 style="font-size: 1.25rem; font-weight: 800; color: #fff; margin-bottom: 12px;">${s}</h3>
                <p style="color: var(--text-secondary); margin-bottom: 24px; font-size: 0.95rem;">${o}</p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button class="btn btn-secondary" id="confirmCancel">Cancel</button>
                    <button class="btn btn-primary" id="confirmOk">Confirm</button>
                </div>
            </div>
        `,d.offsetWidth,d.classList.add("modal-active"),new Promise(l=>{document.getElementById("confirmCancel").onclick=()=>{this.close(m),l(!1)},document.getElementById("confirmOk").onclick=async()=>{this.close(m),p&&await p(),l(!0)}})}},A={render(s,o=3,p="card"){const m=document.getElementById(s);if(!m)return;const d={card:'<div class="glass-card skeleton-card"></div>',list:'<div class="skeleton-list-item"></div>',circle:'<div class="skeleton-avatar"></div>',text:'<div class="skeleton-text"></div>'},l=Array(o).fill(d[p]||d.card).join("");m.innerHTML=`
            <div class="skeleton-container skeleton-${p}">
                ${l}
            </div>
        `}},R=(()=>{let s=[{id:"p1",name:"John Doe",age:45,status:"stable",heart_rate:72,spo2:98,temperature:36.6,ward:"Cardiology",notes:"Recovering from minor arrhythmia."},{id:"p2",name:"Jane Smith",age:32,status:"warning",heart_rate:105,spo2:94,temperature:38.2,ward:"ICU",notes:"Observing post-surgery fever."},{id:"p3",name:"Robert Brown",age:67,status:"critical",heart_rate:120,spo2:88,temperature:37.5,ward:"ICU",notes:"Respiratory distress. Ventilator support."},{id:"p4",name:"Sarah Wilson",age:28,status:"stable",heart_rate:68,spo2:99,temperature:36.4,ward:"Maternity",notes:"Routine obstetric observation."},{id:"p5",name:"Michael Chen",age:54,status:"stable",heart_rate:80,spo2:97,temperature:36.8,ward:"Neurology",notes:"Stable following concussion."},{id:"p6",name:"Emily Davis",age:71,status:"warning",heart_rate:92,spo2:92,temperature:37.9,ward:"General",notes:"Chronic obstructive pulmonary disease."},{id:"p7",name:"David Miller",age:39,status:"stable",heart_rate:75,spo2:98,temperature:36.7,ward:"Orthopedics",notes:"Post-op physical therapy."},{id:"p8",name:"Lisa Garcia",age:48,status:"stable",heart_rate:78,spo2:96,temperature:37,ward:"General",notes:"Diabetes management."}],o=[{id:"demo-u-001",full_name:"Dr. Demo",role:"doctor",department:"Cardiology",status:"on-duty"},{id:"demo-u-002",full_name:"Nurse Demo",role:"nurse",department:"ICU",status:"on-duty"}],p=null;function m(d){p&&clearInterval(p),d&&d(s),p=setInterval(()=>{s=s.map(l=>{const y=Math.floor(Math.random()*5)-2,x=Math.random()>.8?Math.random()>.5?1:-1:0;let f=l.heart_rate+y,g=l.spo2+x;f=Math.max(40,Math.min(180,f)),g=Math.max(80,Math.min(100,g));let b=l.status;return g<90?b="critical":g<94||f>110?b="warning":b="stable",{...l,heart_rate:f,spo2:g,status:b}}),d&&d(s)},5e3)}return{getPatients:()=>s,getStaff:()=>o,init:m}})();window.DemoData=R;const C=(()=>{let s=[];async function o(){A.render("patientGrid",3);try{const{data:t,success:e,message:n}=await w.getPatients(i.role,i.user.id);if(e)s=t||[],m(),P();else{console.error("Patients load failed:",n);const r=document.getElementById("patientGrid");r&&(r.innerHTML=`<div class="p-8 text-center opacity-50">Error loading medical records: ${n}</div>`)}}catch(t){console.error("Patients critical error:",t)}}function p(){}function m(){console.log(`Carenium Patients: Rendering grid with ${s.length} records.`);const t=document.getElementById("patientGrid");if(!t)return;if(s.length===0){t.innerHTML=`
                <div class="empty-state p-12 text-center opacity-50">
                    <p>No patients currently assigned to your unit.</p>
                </div>`;return}const e=s.map(n=>d(n)).join("");t.innerHTML=e}function d(t){const e=t.status||"stable",n=t.ai_risk_score||Math.floor(Math.random()*100),u=n>75||e==="critical"?"high":"low",v=t.last_vitals_update?new Date(t.last_vitals_update).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"Live";return`
      <div class="patient-card glass-card fade-in status-${e}" id="patient-${t.id}">
        <div class="ai-risk-badge ${u}">
            <span>AI Risk: ${n}%</span>
        </div>

        <div class="patient-header">
          <div class="patient-meta">
            <div class="patient-name">${t.name}</div>
            <div class="patient-age">${t.age} Yrs • Ward ${t.ward||"General"}</div>
          </div>
          <div class="status-indicator-badge">
             <span class="status-indicator"></span>
             <span class="status-text">${e.toUpperCase()}</span>
          </div>
        </div>

         <div class="vitals-grid">
            <div class="vital-item">
               <label>Heart Rate</label>
               <div class="value heart-rate">${t.heart_rate||"--"} <small>BPM</small></div>
            </div>
            <div class="vital-item">
               <label>SpO2</label>
               <div class="value ${t.spo2<92?"text-danger":""}">${t.spo2||"--"} <small>%</small></div>
            </div>
            <div class="vital-item">
               <label>Temperature</label>
               <div class="value">${t.temperature||"--"} <small>°C</small></div>
            </div>
            <div class="vital-item">
               <label>BP</label>
               <div class="value" style="font-size: 0.9rem;">${t.blood_pressure||"--"}</div>
            </div>
         </div>

        <div class="patient-card-footer flex justify-between items-center mt-4 pt-4 border-t border-white/5">
           <span class="last-update text-xs opacity-50">Sync: ${v}</span>
           <div class="flex gap-2">
               <button class="btn btn-sm btn-action" onclick="Patients.openDetailModal('${t.id}')">
                  Monitor
               </button>
               ${i.role==="doctor"?`
               <button class="btn btn-sm btn-action critical-action" onclick="window.DoctorActions?.markCritical('${t.id}')">
                  Alert
               </button>`:""}
           </div>
        </div>
      </div>
    `}async function l(t){const e=s.find(u=>u.id===t);if(!e)return;i.activePatient=e;const n=document.querySelector("#patientModal .modal-body");if(!n)return;n.innerHTML=`
      <div class="patient-detail-view p-4">
         <div class="detail-header mb-6">
            <div class="detail-patient-info">
               <h3>${e.name}</h3>
               <span>${e.age} Years • Ward ${e.ward||"General"}</span>
            </div>
         </div>

         <div class="detail-tabs" id="detailTabs">
            <button class="detail-tab active" onclick="Patients.switchDetailTab('vitals')">Vitals</button>
            <button class="detail-tab" onclick="Patients.switchDetailTab('timeline')">Timeline</button>
            <button class="detail-tab" onclick="Patients.switchDetailTab('prescriptions')">Prescriptions</button>
            <button class="detail-tab" onclick="Patients.switchDetailTab('reports')">Reports</button>
         </div>

         <div class="detail-tab-content active" id="tabVitals">
            <div class="ai-risk-panel mb-6 glass-card p-4">
               <div class="flex justify-between items-center">
                  <span class="text-sm font-bold opacity-70">AI CLINICAL RISK ASSESSMENT</span>
                  <span class="badge ${e.ai_risk_score>70?"bg-red-500":"bg-green-500"} text-white px-2 py-0.5 rounded text-[10px] font-black">${e.ai_risk_score>70?"HIGH RISK":"STABLE"}</span>
               </div>
               <div class="risk-score-display flex items-baseline gap-2 mt-2">
                  <span class="text-3xl font-black">${e.ai_risk_score||0}%</span>
                  <span class="text-xs opacity-50">Score generated by Carenium AI Engine</span>
               </div>
            </div>

            <div class="form-grid">
               <div class="form-section">
                  <h4 class="section-subtitle">Real-time Vitals</h4>
                  <div class="form-group mb-4">
                     <label>Heart Rate (BPM)</label>
                     <input type="number" id="vitalHR" class="form-input" value="${e.heart_rate||""}">
                  </div>
                  <div class="form-group mb-4">
                     <label>SpO2 (%)</label>
                     <input type="number" id="vitalO2" class="form-input" value="${e.spo2||""}">
                  </div>
                   <div class="form-group mb-4">
                     <label>BP (mmHg)</label>
                     <input type="text" id="vitalBP" class="form-input" value="${e.blood_pressure||""}" placeholder="120/80">
                  </div>
               </div>

               <div class="form-section">
                  <h4 class="section-subtitle">Environment & State</h4>
                  <div class="form-group mb-4">
                     <label>Clinical Status</label>
                     <select id="patientStatus" class="form-input">
                        <option value="stable" ${e.status==="stable"?"selected":""}>Stable</option>
                        <option value="warning" ${e.status==="warning"?"selected":""}>Warning</option>
                        <option value="critical" ${e.status==="critical"?"selected":""}>Critical</option>
                     </select>
                  </div>
                  <div class="form-group mb-4">
                     <label>Temperature (°C)</label>
                     <input type="number" id="vitalTemp" class="form-input" step="0.1" value="${e.temperature||""}">
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
                  <button class="btn btn-sm btn-primary" onclick="window.Prescriptions?.openCreator('${e.id}')">New Script</button>
               </div>
               <div id="prescriptionsList"></div>
            </div>
         </div>

         <div class="detail-tab-content" id="tabReports">
            <div id="reportsList" class="p-4"></div>
         </div>
      </div>
    `,D.open("patientModal");const r=document.getElementById("addPatientBtn");r&&(r.textContent="Save Medical Record",r.onclick=()=>C.handleSave(t))}function y(t){document.querySelectorAll(".detail-tab").forEach(r=>{var u;r.classList.toggle("active",(u=r.getAttribute("onclick"))==null?void 0:u.includes(`'${t}'`))}),document.querySelectorAll(".detail-tab-content").forEach(r=>r.classList.remove("active"));const e={vitals:"tabVitals",timeline:"tabTimeline",prescriptions:"tabPrescriptions",reports:"tabReports"},n=document.getElementById(e[t]);n&&(n.classList.add("active"),t==="timeline"&&x(i.activePatient.id),t==="prescriptions"&&f(i.activePatient.id),t==="reports"&&g(i.activePatient.id))}async function x(t){const e=document.getElementById("timelineContainer");if(!e)return;const{data:n,success:r}=await w.logAction({action:"view_timeline",entity_id:t});e.innerHTML='<div class="p-8 text-center opacity-30 italic">No historical events recorded yet.</div>'}async function f(t){const e=document.getElementById("prescriptionsList");if(!e)return;const{data:n,success:r}=await w.getPrescriptions(t);r&&n&&n.length>0?e.innerHTML=n.map(u=>`
            <div class="p-3 bg-white/5 border border-white/5 rounded-lg mb-2">
               <div class="flex justify-between font-bold text-sm">
                  <span>${u.medicine}</span>
                  <span class="opacity-50">${u.dosage}</span>
               </div>
               <div class="text-xs opacity-50 mt-1">${u.frequency} • ${u.duration}</div>
            </div>
         `).join(""):e.innerHTML='<div class="p-6 text-center opacity-30">No active medication records.</div>'}async function g(t){const e=document.getElementById("reportsList");e&&(e.innerHTML='<div class="p-8 text-center opacity-30">No digital lab results available.</div>')}async function b(t){var u,v,E,B,I;const e=document.getElementById("addPatientBtn");e&&(e.disabled=!0);const n={heart_rate:parseInt(((u=document.getElementById("vitalHR"))==null?void 0:u.value)||0),spo2:parseInt(((v=document.getElementById("vitalO2"))==null?void 0:v.value)||0),temperature:parseFloat(((E=document.getElementById("vitalTemp"))==null?void 0:E.value)||0),blood_pressure:((B=document.getElementById("vitalBP"))==null?void 0:B.value)||"",status:((I=document.getElementById("patientStatus"))==null?void 0:I.value)||"stable",updated_at:new Date().toISOString()},{success:r}=await w.updatePatient(t,n);if(r){h.success("Clinical data synchronized"),D.close("patientModal");const M=s.findIndex(_=>_.id===t);M!==-1&&(s[M]={...s[M],...n}),m(),P(),await w.logAction({action_type:"UPDATE",user_id:i.user.id,entity:"patients",entity_id:t,new_data:n})}e&&(e.disabled=!1)}function P(){const t=document.getElementById("statTotal"),e=document.getElementById("statCritical");t&&(t.textContent=s.length),e&&(e.textContent=s.filter(n=>n.status==="critical").length)}async function a(t){var v;t&&t.preventDefault();const e=t.target.id==="slideAdmissionForm",n=e?"slideAdm":"adm",r={name:document.getElementById(`${n}Name`).value,age:parseInt(document.getElementById(`${n}Age`).value),gender:document.getElementById(`${n}Gender`).value,blood_group:e?"Unknown":document.getElementById("admBlood").value,phone:e?document.getElementById("slideAdmEmergency").value:document.getElementById("admPhone").value,department:document.getElementById(`${n}Dept`).value,ward:e?document.getElementById("slideAdmRoom").value:document.getElementById("admWard").value,condition:e?document.getElementById("slideAdmDisease").value:document.getElementById("admCondition").value,doctor_id:i.user.id,status:"stable",created_at:new Date().toISOString()};if(!r.name||!r.age||!r.department||!r.ward){h.warning("Please fill in all required admission fields (Name, Age, Department, Ward).");return}if(r.age<=0||r.age>150){h.warning("Please enter a valid age.");return}const u=document.querySelector(`#${e?"slideAdmissionForm":"admissionForm"} button[type="submit"]`);u&&(u.disabled=!0);try{const{success:E,message:B}=await w.addPatient(r);E?(h.success("Patient admitted to clinical unit."),e?(v=window.Dashboard)==null||v.closeAdmission():D.close("admissionModal"),await fetchPatients()):h.error(B||"Failed to admit patient")}catch{h.error("Critical error during admission")}finally{u&&(u.disabled=!1)}}function c(){return s}return console.log("Carenium Patients: Module loaded."),{load:o,openDetailModal:l,handleSave:b,switchDetailTab:y,admitPatient:a,getAll:c}})();window.Patients=C;const N=Object.freeze(Object.defineProperty({__proto__:null,Patients:C},Symbol.toStringTag,{value:"Module"})),i={user:null,role:null,specialization:null,doctorProfile:null,activeSection:"overview",activePatient:null,isDemoMode:!1},$=(()=>{const s={doctor:[{id:"overview",label:"Dashboard",icon:"grid",action:()=>b()},{id:"patients",label:"My Patients",icon:"users",action:()=>{window.Patients&&window.Patients.load()}},{id:"appointments",label:"Appointments",icon:"calendar",action:()=>{window.Appointments&&window.Appointments.load()}},{id:"reports",label:"Reports",icon:"clipboard",action:()=>{window.Reports&&window.Reports.load()}},{id:"profile",label:"My Profile",icon:"user",action:()=>{window.Profile&&window.Profile.load()}}],nurse:[{id:"overview",label:"Dashboard",icon:"grid",action:()=>b()},{id:"patients",label:"Assigned Duties",icon:"activity",action:()=>{window.Patients&&window.Patients.load()}},{id:"directory",label:"Staff Directory",icon:"shield",action:()=>{window.Staff&&window.Staff.load()}},{id:"profile",label:"My Profile",icon:"user",action:()=>{window.Profile&&window.Profile.load()}}]},o={grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',calendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',clipboard:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>',user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',activity:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',logout:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>'};async function p(){try{if(sessionStorage.getItem("demoMode")==="true"||window.isDemoMode)m();else{const c=await S.getSession();if(!c){window.Router?window.Router.navigate("/"):window.location.href="/";return}i.user=c.user;const t=await w.getBaseProfile(i.user.id);if(t.success?(i.role=t.data.role||"doctor",i.displayName=t.data.name):i.role="doctor",i.role==="doctor")try{const e=await w.getDoctorProfile(i.user.id);if(e.success&&e.data&&e.data.specialization)i.doctorProfile=e.data,i.specialization=e.data.specialization;else if(!window.isDemoMode&&(console.warn("Carenium: Clinical profile is incomplete. Launching onboarding wizard..."),window.Router)){await window.Router.navigate("/onboarding");return}}catch(e){console.error("Carenium: Error loading doctor profile:",e)}k.init((e,n)=>{e==="patients"&&window.Patients&&window.Patients.load(),e==="staff"&&window.Staff&&window.Staff.load(),e==="vital_alert"&&window.Alerts&&window.Alerts.handleIncoming(n)})}g(),d(),x(),f("overview")}catch(a){console.error("Carenium: Dashboard critical init failure:",a),h.error("System initialization failed. Please refresh.")}}function m(){i.isDemoMode=!0,i.role="doctor",i.specialization="Cardiologist",i.displayName="Dr. Demo",i.user={email:"demo@carenium.com",id:"demo-u-001"},R.init(a=>{(i.activeSection==="overview"||i.activeSection==="patients")&&C.load()})}function d(){console.log("Carenium Dashboard: Rendering sidebar...");const a=document.querySelector(".sidebar-nav"),c=document.getElementById("sidebarFooter"),t=s[i.role]||[];a&&(a.innerHTML=t.map(v=>`
        <div class="nav-item p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all hover:bg-white/5 ${i.activeSection===v.id?"bg-indigo-500/10 text-indigo-400":"text-slate-400"}" 
             data-section="${v.id}">
          <span class="w-5 h-5 pointer-events-none">${o[v.icon]||""}</span>
          <span class="font-bold text-sm pointer-events-none">${v.label}</span>
        </div>
      `).join("")),c&&(c.innerHTML=`
        <div class="nav-item p-3 rounded-xl flex items-center gap-3 cursor-pointer text-slate-500 hover:text-red-400 transition-all hover:bg-red-500/5 mt-auto" id="logoutBtn">
          <span class="w-5 h-5 pointer-events-none">${o.logout}</span>
          <span class="font-bold text-sm pointer-events-none">Logout</span>
        </div>
      `);const e=i.displayName||"Demo User",n=document.getElementById("userName"),r=document.getElementById("userRoleText"),u=document.getElementById("userAvatar");n&&(n.textContent=e),r&&(r.textContent=i.specialization||i.role.toUpperCase()),u&&(u.textContent=e[0].toUpperCase())}function l(){const a=document.getElementById("admissionPanel");a&&a.classList.add("open")}function y(){const a=document.getElementById("admissionPanel");a&&a.classList.remove("open")}function x(){var e,n,r;const a=i.isDemoMode?"Dr. Demo Workspace":"Dr. "+(((n=(e=i.user)==null?void 0:e.email)==null?void 0:n.split("@")[0])||"User"),c=document.getElementById("topUserName");c&&(c.textContent=a);const t=document.getElementById("specBadgeContainer");t&&i.specialization&&(t.innerHTML=`
        <span class="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">${i.specialization}</span>
        ${(r=i.doctorProfile)!=null&&r.unit?`<span class="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-500/20 ml-2">${i.doctorProfile.unit}</span>`:""}
      `)}function f(a){i.activeSection=a,d(),A.render("dashboardContent",1);const c=s[i.role].find(t=>t.id===a);c&&setTimeout(()=>c.action(),100)}function g(){let a=document.getElementById("dashboardRoot");const c=document.querySelector(".login-wrapper");c&&(c.style.display="none"),a?a.style.display="flex":(a=document.createElement("div"),a.id="dashboardRoot",a.className="dashboard-layout flex min-h-screen",document.body.appendChild(a),a.innerHTML=`
              <aside class="sidebar fixed left-0 top-0 h-screen w-[260px] glass-card border-r border-white/5 flex flex-col z-50">
                  <div class="p-6 border-b border-white/5">
                      <div class="flex items-center gap-3">
                          <div class="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-black text-white text-xl">C</div>
                          <h2 class="font-black text-white text-xl tracking-tighter">Carenium</h2>
                      </div>
                  </div>

                  <div class="p-6 flex items-center gap-4">
                      <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white text-sm" id="userAvatar">?</div>
                      <div class="flex flex-col overflow-hidden">
                          <span class="text-white font-bold text-sm truncate" id="userName">User</span>
                          <span class="text-xs text-slate-500 truncate" id="userRoleText">Loading...</span>
                      </div>
                  </div>

                  <nav class="sidebar-nav flex-1 px-4 flex flex-col gap-1 overflow-y-auto">
                      <!-- Items -->
                  </nav>

                  <div class="p-4 border-t border-white/5" id="sidebarFooter">
                      <!-- Logout -->
                  </div>
              </aside>

              <main class="main-content flex-1 ml-[260px] p-8 min-h-screen bg-slate-950/20">
                  <header class="flex items-center justify-between mb-8">
                      <div class="flex flex-col">
                          <h1 class="text-2xl font-black text-white tracking-tight" id="topUserName">Loading...</h1>
                          <div id="specBadgeContainer" class="flex gap-2 mt-1"></div>
                      </div>

                      <div class="header-right flex items-center gap-4">
                          <button class="md:hidden w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 lg:hidden" id="mobileMenuBtn">
                              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                          </button>
                          <button class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400" id="notificationBell">
                              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                          </button>
                      </div>
                  </header>

                  <div id="dashboardContent" class="fade-in">
                      <div class="p-12 text-center opacity-50">Loading Medical OS...</div>
                  </div>
              </main>
          `)}function b(){var t,e;const a=document.getElementById("dashboardContent"),c=i.specialization||"Medical";a.innerHTML=`
      <div class="overview-container fade-in">
        <div class="welcome-banner glass-card">
          <div class="welcome-text">
            <h2>Good ${P()}, Dr. ${((e=(t=i.user)==null?void 0:t.email)==null?void 0:e.split("@")[0])||"Doctor"}</h2>
            <p>${c} Department — ${new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
          </div>
          <div class="welcome-status">
            <span class="online-status-dot"></span>
            <span>Online</span>
          </div>
        </div>

        <div class="dashboard-grid mt-6">
          <div class="stat-card glass-card">
            <div class="stat-icon">🚨</div>
            <div class="stat-info">
              <label>Critical Alerts</label>
              <div class="stat-value" id="statCritical">--</div>
            </div>
          </div>
          <div class="stat-card glass-card">
            <div class="stat-icon">📅</div>
            <div class="stat-info">
              <label>Today's Appointments</label>
              <div class="stat-value" id="statAppointments">--</div>
            </div>
          </div>
          <div class="stat-card glass-card highlighting">
            <div class="stat-icon">🧠</div>
            <div class="stat-info">
              <label>AI Risk Alerts</label>
              <div class="stat-value">Low Risk</div>
            </div>
          </div>
          <div class="stat-card glass-card">
            <div class="stat-icon">🏥</div>
            <div class="stat-info">
              <label>Active Patients</label>
              <div class="stat-value" id="statTotal">--</div>
            </div>
          </div>
        </div>

        <div class="section-card glass-card mt-8">
            <div class="section-header flex justify-between items-center mb-6">
              <h3 class="section-title">Active Unit Monitor</h3>
              <div class="dashboard-actions">
                <button class="new-admission-btn" id="newAdmissionBtn">
                  New Admission
                </button>
              </div>
            </div>
            <div id="patientGrid"></div>
        </div>
      </div>
    `,C&&C.load()}document.addEventListener("click",a=>{const c=a.target,t=c.closest(".nav-item[data-section]");if(t){const e=t.dataset.section;console.log(`Carenium Dashboard: Switching to section: ${e}`),f(e);return}if(c.closest("#logoutBtn")){console.log("Carenium Dashboard: Logout requested."),S.signOut();return}if(c.closest("#newAdmissionBtn")&&(console.log("Carenium Dashboard: Opening Admission Panel."),l()),c.closest("#mobileMenuBtn")){const e=document.querySelector(".sidebar");e&&(e.classList.toggle("open"),console.log("Carenium Dashboard: Toggling mobile menu."))}}),document.addEventListener("submit",a=>{(a.target.id==="admissionForm"||a.target.id==="slideAdmissionForm")&&(console.log("Carenium Dashboard: Admission form submitted."),window.Patients?window.Patients.admitPatient(a):console.error("Carenium: Patients module not loaded for admission."))});function P(){const a=new Date().getHours();return a<12?"Morning":a<17?"Afternoon":"Evening"}return console.log("Carenium Dashboard: Module loaded."),{init:p,switchSection:f,updateHeader:x,openAdmission:l,closeAdmission:y}})();window.Dashboard=$;const H=Object.freeze(Object.defineProperty({__proto__:null,AppState:i,Dashboard:$},Symbol.toStringTag,{value:"Module"}));export{i as A,$ as D,D as M,C as P,A as S,H as d,N as p};
//# sourceMappingURL=dashboard-DsR46vqT.js.map
