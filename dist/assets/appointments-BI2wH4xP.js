import{a as c,N as r}from"./api-DAyZ9kHC.js";import{M as b,A as p}from"./dashboard-DsR46vqT.js";const S=(()=>{let o=[];async function h(){const t=document.getElementById("dashboardContent");t&&(t.innerHTML=`
          <div class="appointments-container fade-in">
            <div class="section-card p-6 glass-card">
              <div class="section-header flex justify-between items-center mb-6">
                <h3 class="section-title">Appointments</h3>
                <button class="btn btn-sm btn-primary" onclick="Appointments.openScheduleModal()">
                  Schedule New
                </button>
              </div>

              <div class="appointment-section mb-8">
                <h4 class="subsection-title mb-4 opacity-50 text-sm">Today's Appointments</h4>
                <div id="todayAppointments" class="appointment-list flex flex-col gap-3">
                   <div class="p-4 opacity-50">Loading appointments...</div>
                </div>
              </div>

              <div class="appointment-section">
                <h4 class="subsection-title mb-4 opacity-50 text-sm">Upcoming</h4>
                <div id="upcomingAppointments" class="appointment-list flex flex-col gap-3">
                   <div class="p-4 opacity-50">Loading appointments...</div>
                </div>
              </div>
            </div>
          </div>
        `,await d())}async function d(){if(p.isDemoMode)o=x();else{const t=await c.getAppointments(p.user.id);t.success&&(o=t.data||[])}w()}function x(){const t=["Sarah Johnson","Michael Chen","Lisa Patel","James Wilson","Emma Garcia"],n=new Date;return t.map((i,s)=>({id:`demo-apt-${s}`,patient_name:i,scheduled_at:new Date(n.getTime()+(s-1)*36e5).toISOString(),duration_minutes:30,status:s===1?"completed":"scheduled"}))}function w(){const t=new Date().toDateString(),n=o.filter(a=>new Date(a.scheduled_at).toDateString()===t),i=o.filter(a=>new Date(a.scheduled_at).toDateString()!==t&&new Date(a.scheduled_at)>new Date),s=document.getElementById("todayAppointments"),e=document.getElementById("upcomingAppointments");s&&(s.innerHTML=n.length===0?'<div class="p-4 text-center opacity-30">No appointments today.</div>':n.map(f).join("")),e&&(e.innerHTML=i.length===0?'<div class="p-4 text-center opacity-30">No upcoming appointments.</div>':i.map(f).join(""))}function f(t){const n=new Date(t.scheduled_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),i=t.status==="completed",s=t.status==="cancelled";let e="bg-white/5";return t.status==="scheduled"&&(e="bg-blue-500/20 text-blue-400"),t.status==="completed"&&(e="bg-green-500/20 text-green-400"),t.status==="cancelled"&&(e="bg-red-500/20 text-red-400"),`
          <div class="appointment-card glass-card p-4 rounded-xl border border-white/5 flex items-center justify-between ${i||s?"opacity-40":""}">
            <div class="apt-time flex flex-col min-w-[80px]">
              <span class="font-black text-xl">${n}</span>
              <span class="text-[10px] font-bold opacity-50 uppercase tracking-widest">${t.duration_minutes} MIN</span>
            </div>
            <div class="apt-info flex-1 px-6 border-l border-white/5 ml-4">
              <span class="block font-bold text-base">${t.patient_name||"Generic Patient"}</span>
              <div class="flex items-center gap-2 mt-1">
                 <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded ${e}">${t.status}</span>
                 <span class="text-[10px] opacity-40 italic">${new Date(t.scheduled_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div class="apt-actions flex gap-2">
              ${t.status==="scheduled"?`
                <button class="btn btn-xs btn-action" onclick="Appointments.openRescheduleModal('${t.id}')">Reschedule</button>
                <button class="btn btn-xs btn-outline-danger" onclick="Appointments.cancel('${t.id}')">Cancel</button>
                <button class="btn btn-xs btn-primary" onclick="Appointments.markComplete('${t.id}')">Complete</button>
              `:""}
            </div>
          </div>
        `}function g(){var i,s;const t=((i=window.Patients)==null?void 0:i.getAll())||[],n=document.querySelector("#appointmentModal .modal-body");n&&(n.innerHTML=`
      <form id="scheduleForm" class="p-4">
        <div class="form-group mb-4">
          <label class="block text-xs font-bold opacity-50 mb-1">SELECT PATIENT</label>
          <select id="aptPatient" class="form-input" required>
            <option value="">Choose Patient...</option>
            ${t.map(e=>`<option value="${e.id}">${e.name}</option>`).join("")}
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="form-group">
            <label class="block text-xs font-bold opacity-50 mb-1">DATE</label>
            <input type="date" id="aptDate" class="form-input" required>
          </div>
          <div class="form-group">
            <label class="block text-xs font-bold opacity-50 mb-1">TIME</label>
            <input type="time" id="aptTime" class="form-input" required>
          </div>
        </div>
        <div class="form-group mb-6">
          <label class="block text-xs font-bold opacity-50 mb-1">DURATION (MINUTES)</label>
          <select id="aptDuration" class="form-input">
            <option value="15">15 Minutes</option>
            <option value="30" selected>30 Minutes</option>
            <option value="45">45 Minutes</option>
            <option value="60">1 Hour</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary w-full">Confirm Appointment</button>
      </form>
    `,b.open("appointmentModal"),(s=document.getElementById("scheduleForm"))==null||s.addEventListener("submit",async e=>{var y;e.preventDefault();const a=e.target.querySelector('button[type="submit"]');a&&(a.disabled=!0);const m=document.getElementById("aptDate").value,u=document.getElementById("aptTime").value,l=document.getElementById("aptPatient").value,E=(y=t.find(M=>M.id===l))==null?void 0:y.name,v={doctor_id:p.user.id,patient_id:l,patient_name:E,scheduled_at:`${m}T${u}:00`,duration_minutes:parseInt(document.getElementById("aptDuration").value),status:"scheduled",created_at:new Date().toISOString()},{success:I}=await c.addAppointment(v);I&&(r.success("Appointment synchronized with clinical calendar."),b.close("appointmentModal"),await d(),await c.logAction({action_type:"SCHEDULE_APPOINTMENT",user_id:p.user.id,entity:"appointments",new_data:v})),a&&(a.disabled=!1)}))}async function A(t){const{success:n}=await c.updateAppointment(t,{status:"completed"});n&&(r.success("Appointment marked as completed."),await d())}function D(t){const n=o.find(e=>e.id===t);if(!n)return;g();const i=document.getElementById("scheduleForm"),s=i.querySelector('button[type="submit"]');s&&(s.textContent="Confirm Rescheduling"),document.getElementById("aptPatient").value=n.patient_id||"",document.getElementById("aptPatient").disabled=!0,i.onsubmit=async e=>{e.preventDefault();const a=document.getElementById("aptDate").value,m=document.getElementById("aptTime").value,u={scheduled_at:`${a}T${m}:00`,status:"rescheduled",updated_at:new Date().toISOString()},{success:l}=await c.updateAppointment(t,u);l&&(r.success("Clinical session rescheduled."),b.close("appointmentModal"),await d())}}return{load:h,openScheduleModal:g,cancel,markComplete:A,openRescheduleModal:D}})();window.Appointments=S;export{S as Appointments};
//# sourceMappingURL=appointments-BI2wH4xP.js.map
