import { API } from '../core/api.js';
import { AppState } from './dashboard.js';
import { Notifications } from '../ui/notifications.js';

const Staff = (() => {
  let allStaff = [];

  async function load() {
    const content = document.getElementById('dashboardContent');
    if (!content) return;

    content.innerHTML = `
         <div class="staff-directory fade-page p-6">
            <div class="glass-card p-6">
               <div class="flex justify-between items-center mb-8">
                  <h3 class="text-xl font-bold">Clinical Staff Directory</h3>
                  <div class="flex gap-4">
                     <div class="search-box relative">
                         <input type="text" id="staffSearch" class="form-input pl-10 h-10 w-64" placeholder="Search by name or specialty...">
                         <i class="absolute left-3 top-2.5 opacity-30">🔍</i>
                     </div>
                     <select id="roleFilter" class="form-input h-10 w-40">
                        <option value="all">All Roles</option>
                        <option value="doctor">Doctors</option>
                        <option value="nurse">Nurses</option>
                     </select>
                  </div>
               </div>
               
               <div id="staffGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div class="p-12 text-center opacity-30 col-span-full">Querying hospital personnel records...</div>
               </div>
            </div>
         </div>
      `;

    await fetchStaff();

    document.getElementById('staffSearch')?.addEventListener('input', renderGrid);
    document.getElementById('roleFilter')?.addEventListener('change', renderGrid);
  }

  async function fetchStaff() {
    const { data, success } = await API.getAllStaff();
    if (success) {
      allStaff = data || [];
      renderGrid();
    }
  }

  function renderGrid() {
    const term = document.getElementById('staffSearch')?.value.toLowerCase() || '';
    const role = document.getElementById('roleFilter')?.value || 'all';
    const grid = document.getElementById('staffGrid');
    if (!grid) return;

    const filtered = allStaff.filter(s => {
      const matchesSearch = s.full_name.toLowerCase().includes(term) || (s.specialization || '').toLowerCase().includes(term);
      const matchesRole = role === 'all' || s.role === role;
      return matchesSearch && matchesRole;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="p-12 text-center opacity-30 col-span-full">No clinical staff matched your criteria.</div>`;
      return;
    }

    grid.innerHTML = filtered.map(s => renderStaffCard(s)).join('');
  }

  function renderStaffCard(s) {
    const isDoctor = s.role === 'doctor';
    const statusClass = s.status === 'on-duty' ? 'bg-green-500' : 'bg-gray-500';

    return `
         <div class="staff-card glass-card p-5 border border-white/5 relative overflow-hidden flex flex-col items-center text-center hover:-translate-y-1 transition-all">
            <div class="absolute top-3 right-3 flex items-center gap-1.5">
               <span class="w-1.5 h-1.5 rounded-full ${statusClass}"></span>
               <span class="text-[9px] font-black uppercase opacity-60">${s.status || 'offline'}</span>
            </div>
            
            <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-2xl font-black mb-4 border border-white/10">
               ${s.full_name.split(' ').map(n => n[0]).join('')}
            </div>
            
            <h4 class="font-bold text-lg leading-tight mb-1">${s.full_name}</h4>
            <div class="text-xs font-black uppercase tracking-widest text-primary mb-3">${isDoctor ? (s.specialization || 'Attending Physician') : 'Registered Nurse'}</div>
            
            <div class="w-full pt-4 border-t border-white/5 flex flex-col gap-2 text-left">
               <div class="flex justify-between items-center text-[10px] font-bold">
                  <span class="opacity-50">DEPARTMENT</span>
                  <span>${s.department || 'General'}</span>
               </div>
               <div class="flex justify-between items-center text-[10px] font-bold">
                  <span class="opacity-50">PHONE</span>
                  <span>${s.phone || 'N/A'}</span>
               </div>
               <div class="flex justify-between items-center text-[10px] font-bold">
                  <span class="opacity-50">EMAIL</span>
                  <span class="truncate max-w-[140px]">${s.email || 'N/A'}</span>
               </div>
               <button class="btn btn-sm btn-outline mt-2 w-full" onclick="Staff.viewProfile('${s.id}')">View Credentials</button>
            </div>
         </div>
      `;
  }

  function viewProfile(id) {
    Notifications.info('Detailed staff credentials view coming in Phase 21.');
  }

  return { load, viewProfile };
})();

export { Staff };
window.Staff = Staff;
