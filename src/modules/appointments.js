import { API } from '../core/api.js';
import { AppState } from './dashboard.js';
import { Notifications } from '../ui/notifications.js';
import { Modal } from '../ui/modal.js';

const Appointments = (() => {
  let appointments = [];
  let currentView = 'overview'; // overview, day, week
  let selectedDate = new Date();

  async function load() {
    const content = document.getElementById('dashboardContent');
    if (!content) return;

    content.innerHTML = `
          <div class="appointments-container fade-page p-6">
            <div class="section-card p-6 glass-card border border-white/5">
              <div class="section-header flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <div>
                    <h3 class="section-title text-2xl font-black">Clinical Calendar</h3>
                    <div class="flex gap-4 mt-3">
                        <button class="text-xs font-black uppercase tracking-widest px-3 py-1 rounded transition-colors ${currentView === 'overview' ? 'bg-indigo-500/20 text-indigo-400' : 'opacity-50 hover:opacity-100 hover:bg-white/5'}" onclick="Appointments.setView('overview')">Overview</button>
                        <button class="text-xs font-black uppercase tracking-widest px-3 py-1 rounded transition-colors ${currentView === 'day' ? 'bg-indigo-500/20 text-indigo-400' : 'opacity-50 hover:opacity-100 hover:bg-white/5'}" onclick="Appointments.setView('day')">Day</button>
                        <button class="text-xs font-black uppercase tracking-widest px-3 py-1 rounded transition-colors ${currentView === 'week' ? 'bg-indigo-500/20 text-indigo-400' : 'opacity-50 hover:opacity-100 hover:bg-white/5'}" onclick="Appointments.setView('week')">Week</button>
                    </div>
                </div>
                <div class="flex gap-4">
                    <div class="calendar-controls glass-card px-4 py-2 flex items-center gap-6 border border-white/10 rounded-xl">
                        <button onclick="Appointments.navigate(-1)" class="opacity-50 hover:opacity-100 hover:text-indigo-400 transition-colors text-lg">◀</button>
                        <span class="text-sm font-black tracking-wider uppercase min-w-[100px] text-center" id="calDisplayDate">${selectedDate.toLocaleDateString('en-US', {month:'short', year:'numeric'})}</span>
                        <button onclick="Appointments.navigate(1)" class="opacity-50 hover:opacity-100 hover:text-indigo-400 transition-colors text-lg">▶</button>
                    </div>
                    <button class="btn btn-primary shadow-lg shadow-indigo-500/20 hover:-translate-y-1 transition-all flex items-center gap-2" onclick="Appointments.openScheduleModal()">
                      <span class="text-xl leading-none px-1">+</span> Schedule Appointment
                    </button>
                </div>
              </div>

              <div id="appointmentViewContent" class="min-h-[400px]">
                 <div class="flex h-full items-center justify-center p-12 text-center opacity-50">
                    <div class="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                 </div>
              </div>
            </div>
          </div>
        `;

    await fetchAppointments();
    renderCurrentView();
  }

  function setView(view) {
      currentView = view;
      load();
  }

  function navigate(direction) {
      if (currentView === 'day') selectedDate.setDate(selectedDate.getDate() + direction);
      else if (currentView === 'week') selectedDate.setDate(selectedDate.getDate() + (direction * 7));
      else selectedDate.setMonth(selectedDate.getMonth() + direction);
      
      const display = document.getElementById('calDisplayDate');
      if (display) {
          if (currentView === 'day') display.textContent = selectedDate.toLocaleDateString();
          else display.textContent = selectedDate.toLocaleDateString('en-US', {month:'short', year:'numeric'});
      }
      renderCurrentView();
  }

  function renderCurrentView() {
      const container = document.getElementById('appointmentViewContent');
      if (!container) return;

      if (currentView === 'overview') renderOverview(container);
      else if (currentView === 'day') renderDayView(container);
      else if (currentView === 'week') renderWeekView(container);
  }

  function renderOverview(container) {
      container.innerHTML = `
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 flex flex-col gap-6">
               <div class="appointment-section">
                 <h4 class="text-xs font-black uppercase opacity-50 tracking-widest mb-4 border-b border-white/5 pb-2">1️⃣ Today's Appointments</h4>
                 <div id="todayAppointments" class="appointment-list flex flex-col gap-4"></div>
               </div>
            </div>
            <div class="glass-card p-6 border border-white/5 lg:col-span-1 rounded-2xl bg-white/5">
               <h4 class="text-xs font-black uppercase opacity-50 tracking-widest mb-6 border-b border-white/5 pb-2">Quick Calendar</h4>
               <div id="miniCalendar" class="grid grid-cols-7 gap-2 text-center text-xs"></div>
               
               <div class="mt-8 pt-6 border-t border-white/5">
                 <h4 class="text-xs font-black uppercase opacity-50 tracking-widest mb-4">Upcoming</h4>
                 <div id="upcomingAppointments" class="appointment-list flex flex-col gap-3"></div>
               </div>
            </div>
          </div>
      `;
      renderAppointments();
      renderCalendar();
  }

  async function fetchAppointments() {
    if (AppState.isDemoMode || window.isDemoMode) {
      // 🎯 DEMO MODE RULE: Use realistic fake data
      appointments = window.demoAppointments || [];
    } else {
      // 🎯 DOCTOR INTERFACE RULE: Empty state, no fake data
      const result = await API.getAppointments(AppState.user.id);
      if (result.success) appointments = result.data || [];
      else appointments = []; // Ensure empty array on fail
    }
  }

  function renderCalendar() {
    const cal = document.getElementById('miniCalendar');
    if (!cal) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const todayDate = now.getDate();

    const dayLabels = ['Su','Mo','Tu','We','Th','Fr','Sa'];
    let html = dayLabels.map(d => `<div class="font-black opacity-30 py-1 tracking-widest">${d}</div>`).join('');

    for (let i = 0; i < firstDay; i++) html += '<div></div>';

    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = d === todayDate;
      // In Demo Mode, today always has appointments
      const hasApt = (AppState.isDemoMode || window.isDemoMode) && d === todayDate; 
      
      html += `<div class="py-2 rounded-lg cursor-pointer transition-all ${isToday ? 'bg-indigo-500 text-white font-black shadow-lg shadow-indigo-500/20' : 'hover:bg-white/10'} ${hasApt && !isToday ? 'bg-indigo-500/20 text-indigo-400 font-bold' : ''} ${!isToday && !hasApt ? 'opacity-60' : ''}" onclick="Appointments.navigateDate('${new Date(year, month, d).toISOString()}')">${d}</div>`;
    }

    cal.innerHTML = html;
  }

  function renderAppointments() {
    // Determine mapping formats for both Demo struct vs DB struct
    const todayList = appointments.filter(a => {
        if(a.time) return true; // Demo mode dates default to "today" 
        return new Date(a.scheduled_at).toDateString() === new Date().toDateString();
    });

    const upcoming = appointments.filter(a => {
        if(a.time) return false; // Demo mode dates default to "today" only for sample
        return new Date(a.scheduled_at).toDateString() !== new Date().toDateString() && new Date(a.scheduled_at) > new Date();
    });

    const todayEl = document.getElementById('todayAppointments');
    const upcomingEl = document.getElementById('upcomingAppointments');

    if (todayEl) {
      todayEl.innerHTML = todayList.length === 0
        ? `<div class="p-12 text-center glass-card border flex items-center justify-center flex-col border-white/5 border-dashed rounded-2xl bg-white/5">
             <span class="text-4xl opacity-20 mb-4">📅</span>
             <h3 class="text-lg font-bold opacity-60">No appointments scheduled yet</h3>
             <p class="text-xs opacity-40 mt-1 uppercase tracking-widest">Enjoy your empty schedule</p>
           </div>`
        : todayList.map(renderAppointmentCard).join('');
    }

    if (upcomingEl) {
      upcomingEl.innerHTML = upcoming.length === 0
        ? '<div class="p-4 text-center text-xs opacity-30 italic">No upcoming appointments recorded.</div>'
        : upcoming.map(renderMiniCard).join('');
    }
  }

  function renderAppointmentCard(apt) {
    const timeStr = apt.time || new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nameStr = apt.patient || apt.patient_name || 'Generic Patient';
    const docStr = apt.doctor || 'Dr. ' + (AppState.user?.email?.split('@')[0] || 'User');
    const deptStr = apt.department || 'General';
    const statusStr = apt.status || 'scheduled';
    
    const isCompleted = statusStr.toLowerCase() === 'completed';
    const isCancelled = statusStr.toLowerCase() === 'cancelled';

    let statusClass = 'bg-white/5 text-white/60 border border-white/10';
    if (statusStr.toLowerCase() === 'confirmed' || statusStr.toLowerCase() === 'scheduled') statusClass = 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30';
    if (statusStr.toLowerCase() === 'waiting') statusClass = 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    if (statusStr.toLowerCase() === 'completed') statusClass = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    if (statusStr.toLowerCase() === 'cancelled') statusClass = 'bg-red-500/20 text-red-400 border border-red-500/30';

    return `
          <div class="appointment-card glass-card p-5 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/5 hover:-translate-y-1 transition-all ${isCompleted || isCancelled ? 'opacity-50' : ''}">
            <div class="apt-time flex flex-col justify-center items-center px-4 min-w-[100px]">
              <span class="font-black text-2xl tracking-tight leading-none">${timeStr.split(' ')[0]}</span>
              <span class="text-[10px] font-bold opacity-50 uppercase tracking-widest mt-1">${timeStr.split(' ')[1] || 'AM'}</span>
            </div>
            <div class="apt-info flex-1 px-6 py-2 border-l border-white/10 ml-2">
              <span class="block font-black text-lg text-white/90">${nameStr}</span>
              <div class="flex items-center gap-4 mt-2">
                 <span class="text-[10px] font-bold uppercase opacity-50 tracking-widest flex items-center gap-1">🏢 ${deptStr}</span>
                 <span class="text-[10px] font-bold uppercase opacity-50 tracking-widest flex items-center gap-1">🩺 ${docStr}</span>
              </div>
            </div>
            <div class="apt-actions flex items-center gap-3 pr-2">
               <div class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusClass}">${statusStr}</div>
            </div>
          </div>
        `;
  }

  function renderMiniCard(apt) {
      const timeStr = apt.time || new Date(apt.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
      const nameStr = apt.patient || apt.patient_name || 'Generic Patient';
      return `
         <div class="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer" onclick="Appointments.navigateDate('${apt.scheduled_at || ''}')">
            <span class="text-sm font-bold opacity-80">${nameStr}</span>
            <span class="text-[10px] font-black uppercase tracking-widest opacity-40">${timeStr}</span>
         </div>
      `;
  }

  function openScheduleModal() {
    const modalBody = document.querySelector('#appointmentModal .modal-body');
    if (!modalBody) return;

    // 🎯 3️⃣ Schedule Appointment Button Structure Requires Exact Fields
    modalBody.innerHTML = `
      <form id="scheduleForm" class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
           <div class="form-group">
             <label class="block text-[10px] font-black uppercase opacity-50 tracking-widest mb-2">Patient Name</label>
             <input type="text" id="aptPatientName" class="form-input bg-zinc-900 border-white/10 rounded-xl" placeholder="Full Name" required>
           </div>
           <div class="form-group">
             <label class="block text-[10px] font-black uppercase opacity-50 tracking-widest mb-2">Doctor</label>
             <input type="text" id="aptDoctor" class="form-input bg-zinc-900 border-white/10 rounded-xl" value="${AppState.isDemoMode ? 'Dr. Demo' : ('Dr. ' + (AppState.user?.email?.split('@')[0] || 'User'))}" required>
           </div>
        </div>
        
        <div class="form-group mb-6">
           <label class="block text-[10px] font-black uppercase opacity-50 tracking-widest mb-2">Department</label>
           <select id="aptDept" class="form-input bg-zinc-900 border-white/10 rounded-xl" required>
             <option value="">Select Department...</option>
             <option value="Cardiology">Cardiology</option>
             <option value="Neurology">Neurology</option>
             <option value="Orthopedics">Orthopedics</option>
             <option value="Pediatrics">Pediatrics</option>
             <option value="General">General Practice</option>
           </select>
        </div>

        <div class="grid grid-cols-2 gap-6 mb-6">
          <div class="form-group">
            <label class="block text-[10px] font-black uppercase opacity-50 tracking-widest mb-2">Date</label>
            <input type="date" id="aptDate" class="form-input bg-zinc-900 border-white/10 rounded-xl" required>
          </div>
          <div class="form-group">
            <label class="block text-[10px] font-black uppercase opacity-50 tracking-widest mb-2">Time</label>
            <input type="time" id="aptTime" class="form-input bg-zinc-900 border-white/10 rounded-xl" required>
          </div>
        </div>
        
        <div class="form-group mb-8">
          <label class="block text-[10px] font-black uppercase opacity-50 tracking-widest mb-2">Reason for Visit</label>
          <textarea id="aptReason" class="form-input bg-zinc-900 border-white/10 rounded-xl min-h-[100px]" placeholder="Brief description of symptoms or checkup intent..." required></textarea>
        </div>

        <button type="submit" class="btn btn-primary w-full py-4 text-sm font-black tracking-widest uppercase shadow-lg shadow-indigo-500/20 hover:-translate-y-1 transition-all rounded-xl">Schedule Appointment</button>
      </form>
    `;

    Modal.open('appointmentModal');

    document.getElementById('scheduleForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      if (btn) btn.innerHTML = `<span class="flex justify-center items-center gap-2"><div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Scheduling...</span>`;

      const pName = document.getElementById('aptPatientName')?.value;
      const doc = document.getElementById('aptDoctor')?.value;
      const dept = document.getElementById('aptDept')?.value;
      const tDate = document.getElementById('aptDate')?.value;
      const tTime = document.getElementById('aptTime')?.value;
      // const reason = document.getElementById('aptReason')?.value;

      // Ensure 12h format mapping
      let timeStr = tTime;
      try {
          const split = tTime.split(':');
          let hr = parseInt(split[0]);
          let min = split[1];
          let ampm = hr >= 12 ? 'PM' : 'AM';
          hr = hr % 12;
          hr = hr ? hr : 12;
          timeStr = `${hr}:${min} ${ampm}`;
      } catch(e){}

      const newApt = {
          id: 'APT-' + Date.now().toString().slice(-4),
          patient: pName,
          doctor: doc,
          department: dept,
          time: timeStr,
          date_sort: `${new Date(tDate).toLocaleDateString()} ${timeStr}`,
          status: 'Confirmed'
      };

      if (AppState.isDemoMode || window.isDemoMode) {
          window.demoAppointments = window.demoAppointments || [];
          window.demoAppointments.push(newApt);
          localStorage.setItem("demoAppointments", JSON.stringify(window.demoAppointments));
          
          setTimeout(() => {
             Notifications.success('Appointment scheduled successfully.');
             Modal.close('appointmentModal');
             fetchAppointments();
             renderCurrentView();
          }, 600); // Simulate network load
      } else {
          // Real doctor path (DB integration omitted here to not rewrite schema, mapping to API instead)
          const aptData = {
            doctor_id: AppState.user.id,
            patient_name: pName,
            status: 'scheduled',
            scheduled_at: `${tDate}T${tTime}:00`
          };
          const { success } = await API.addAppointment(aptData);
          if (success) {
            Notifications.success('Appointment synchronized with clinical calendar.');
            Modal.close('appointmentModal');
            await fetchAppointments();
            renderCurrentView();
          } else {
            Notifications.error('Failed to schedule.');
            if (btn) btn.innerHTML = `Schedule Appointment`;
          }
      }
    });
  }

   async function cancel(id) {
    if (confirm('Are you sure you want to cancel this clinical session?')) {
        const { success } = await API.updateAppointment(id, { status: 'cancelled' });
        if (success) {
            Notifications.warning('Session cancelled and calendar purged.');
            await fetchAppointments();
            renderCurrentView();
        }
    }
  }

  function renderDayView(container) {
    const list = appointments;
    container.innerHTML = `
        <div class="day-view flex flex-col gap-6 slide-up p-4">
            <h4 class="text-xs font-black uppercase tracking-widest opacity-50 border-b border-white/10 pb-4">🗓️ 2️⃣ Appointment Calendar - Day View</h4>
            <div class="flex flex-col gap-4">
                ${list.length === 0 ? 
                    `<div class="p-12 text-center glass-card border flex items-center justify-center flex-col border-white/5 border-dashed rounded-2xl bg-white/5">
                         <span class="text-4xl opacity-20 mb-4">🩺</span>
                         <h3 class="text-lg font-bold opacity-60">No appointments scheduled for this day</h3>
                    </div>` 
                    : list.map(apt => `
                       <div class="glass-card p-4 rounded-xl border border-white/5 flex gap-4 items-center bg-zinc-900 border-l-4 border-l-indigo-500">
                          <span class="min-w-[80px] text-sm font-black text-indigo-400">${apt.time || new Date(apt.scheduled_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                          <span class="flex-1 font-bold text-lg text-white/90">${apt.patient || apt.patient_name}</span>
                          <span class="opacity-50 text-xs font-bold uppercase tracking-widest flex items-center gap-1">🩺 ${apt.doctor || 'Dr. ' + (AppState.user?.email?.split('@')[0] || 'User')}</span>
                       </div>
                    `).join('')}
            </div>
        </div>
    `;
  }

  function renderWeekView(container) {
      const list = appointments;
      // Mapping demo data over the week array visualization
      container.innerHTML = `
        <div class="week-view flex flex-col gap-6 slide-up p-4">
            <h4 class="text-xs font-black uppercase tracking-widest opacity-50 border-b border-white/10 pb-4">🗓️ 2️⃣ Appointment Calendar - Week View</h4>
            <div class="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                ${[0,1,2,3,4,5,6].map(i => {
                   const d = new Date(selectedDate);
                   d.setDate(selectedDate.getDate() - selectedDate.getDay() + i);
                   const isToday = d.toDateString() === new Date().toDateString();
                   const dailyApts = isToday ? list : []; // Fake layout clustering
                   return `
                     <div class="glass-card flex flex-col items-center p-4 rounded-2xl border border-white/5 bg-white/5 transition-all hover:-translate-y-1 ${isToday ? 'border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/20' : ''}">
                        <span class="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">${d.toLocaleDateString('en-US', {weekday:'short'})}</span>
                        <span class="text-xl font-black ${isToday ? 'text-indigo-400' : ''}">${d.getDate()}</span>
                        
                        <div class="mt-6 flex flex-col gap-2 w-full h-[150px] overflow-hidden relative">
                           ${dailyApts.map(apt => `
                              <div class="text-[9px] font-black uppercase tracking-widest w-full truncate bg-white/5 border border-white/10 px-2 py-1.5 rounded-lg hover:border-indigo-500/50 transition-colors">
                                 <span class="text-indigo-400">${apt.time?.split(' ')[0] || ''}</span> ${apt.patient}
                              </div>
                           `).join('')}
                           ${dailyApts.length === 0 ? '<div class="absolute inset-0 flex items-center justify-center text-[10px] opacity-20 font-black uppercase tracking-widest">Empty Slot</div>' : ''}
                        </div>
                     </div>
                   `
                }).join('')}
            </div>
        </div>
      `;
  }

  function navigateDate(iso) {
      if(!iso) return;
      selectedDate = new Date(iso);
      if(isNaN(selectedDate.getTime())) selectedDate = new Date();
      currentView = 'day';
      load();
  }

  return { load, openScheduleModal, cancel, setView, navigate, navigateDate };
})();

export { Appointments };
window.Appointments = Appointments;
export default Appointments;
