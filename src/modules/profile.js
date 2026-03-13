import { Auth } from '../core/auth.js';
import { API } from '../core/api.js';
import { AppState } from './dashboard.js';
import { Notifications } from '../ui/notifications.js';
import { Skeletons } from '../ui/skeletons.js';
import { Dashboard } from './dashboard.js';

const Profile = (() => {
   let isEditMode = false;
   let localProfile = null;
   let doctorProfile = null;

   async function load() {
      const { user } = AppState;
      if (!user) return;

      Skeletons.render('dashboardContent', 1);

      const { data, success } = await API.getStaffProfile(AppState.role, user.id);
      if (success) localProfile = { ...data };

      if (AppState.role === 'doctor') {
         const dp = await API.getDoctorProfile(user.id);
         if (dp.success) doctorProfile = dp.data;
      }

      renderMain();
   }

   function renderMain() {
      const content = document.getElementById('dashboardContent');
      if (!content) return;

      const profileName = localProfile?.full_name || AppState.user?.email?.split('@')[0] || 'Doctor';
      const department = doctorProfile?.department || localProfile?.department || '--';
      const spec = doctorProfile?.specialization || localProfile?.specialization || 'General Practice';

      content.innerHTML = `
      <div class="profile-container fade-page">
        <div class="profile-header-card glass-card p-8 mb-6" style="border-radius:28px">
          <div class="flex items-center gap-8">
            <div class="profile-avatar-large rounded-full flex items-center justify-center font-black text-white" style="background:linear-gradient(135deg,#6366f1,#9333ea);border:3px solid rgba(255,255,255,0.1)">
                ${profileName[0]}
            </div>
            <div class="profile-title flex-1">
               <h2 class="text-2xl font-black text-white tracking-tighter mb-2">${profileName}</h2>
               <div class="flex gap-3" style="flex-wrap:wrap">
                 <span class="px-4 rounded-full text-xs font-bold border" style="padding-top:6px;padding-bottom:6px;background:rgba(29,209,161,0.1);color:#1dd1a1;border-color:rgba(29,209,161,0.2)">${spec}</span>
                 <span class="px-4 rounded-full text-xs font-bold border" style="padding-top:6px;padding-bottom:6px;background:rgba(255,255,255,0.05);color:#94a3b8;border-color:rgba(255,255,255,0.1)">${department}</span>
               </div>
               <div class="mt-3 text-xs" style="color:#64748b">Clinical ID: ${AppState.user?.id.slice(0, 8)}... · ${AppState.user?.email || ''}</div>
            </div>
            <div class="profile-actions-header">
               <button class="btn btn-secondary px-6 py-3 rounded-xl font-bold" onclick="Profile.toggleEdit()">
                  ${isEditMode ? '✕ Cancel' : '✎ Edit Profile'}
               </button>
               ${isEditMode ? '<button class="btn btn-primary px-6 py-3 rounded-xl font-bold" onclick="Profile.handleSave()">Save Changes</button>' : ''}
               <button class="logout-btn px-6 py-3 rounded-xl font-bold" onclick="Profile.logout()">Sign Out</button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Doctor Information -->
          <div class="glass-card p-8" style="border-radius:20px">
            <h3 class="text-xl font-black text-white mb-6" style="letter-spacing:-0.3px">Doctor Information</h3>
            <div class="flex flex-col gap-6">
               <div class="grid grid-cols-2 gap-4">
                   <div class="col-span-2">
                      <label class="block text-xs font-bold uppercase tracking-widest mb-2" style="color:#64748b">Full Name</label>
                      <input type="text" id="profileName" class="form-input" style="padding-left:16px" value="${profileName}" ${!isEditMode ? 'disabled' : ''}>
                   </div>
                   <div class="col-span-2">
                      <label class="block text-xs font-bold uppercase tracking-widest mb-2" style="color:#64748b">License Number</label>
                      <input type="text" id="profileLicense" class="form-input" style="padding-left:16px" value="${doctorProfile?.license_number || ''}" ${!isEditMode ? 'disabled' : ''}>
                   </div>
               </div>
            </div>
          </div>

          <!-- Specialization -->
          <div class="glass-card p-8" style="border-radius:20px">
            <h3 class="text-xl font-black text-white mb-6" style="letter-spacing:-0.3px">Specialization</h3>
            <div class="flex flex-col gap-6">
               <div class="grid grid-cols-2 gap-4">
                   <div class="col-span-2">
                      <label class="block text-xs font-bold uppercase tracking-widest mb-2" style="color:#64748b">Primary Specialization</label>
                      <input type="text" id="profileSpecialization" class="form-input" style="padding-left:16px" value="${spec}" ${!isEditMode ? 'disabled' : ''}>
                   </div>
                   <div>
                      <label class="block text-xs font-bold uppercase tracking-widest mb-2" style="color:#64748b">Department</label>
                      <input type="text" id="profileDepartment" class="form-input" style="padding-left:16px" value="${department}" ${!isEditMode ? 'disabled' : ''}>
                   </div>
                   <div>
                      <label class="block text-xs font-bold uppercase tracking-widest mb-2" style="color:#64748b">Qualification</label>
                      <input type="text" id="profileQualification" class="form-input" style="padding-left:16px" value="${doctorProfile?.qualification || ''}" ${!isEditMode ? 'disabled' : ''}>
                   </div>
               </div>
            </div>
          </div>

          <!-- Experience -->
          <div class="glass-card p-8" style="border-radius:20px">
            <h3 class="text-xl font-black text-white mb-6" style="letter-spacing:-0.3px">Experience</h3>
            <div class="flex flex-col gap-6">
               <div class="grid grid-cols-2 gap-4">
                   <div>
                      <label class="block text-xs font-bold uppercase tracking-widest mb-2" style="color:#64748b">Years Active</label>
                      <input type="number" id="profileExperience" class="form-input" style="padding-left:16px" value="${doctorProfile?.experience_years || 0}" ${!isEditMode ? 'disabled' : ''}>
                   </div>
                   <div>
                      <label class="block text-xs font-bold uppercase tracking-widest mb-2" style="color:#64748b">Hospital / Unit</label>
                      <input type="text" id="profileUnit" class="form-input" style="padding-left:16px" value="${doctorProfile?.unit || ''}" ${!isEditMode ? 'disabled' : ''}>
                   </div>
               </div>
            </div>
          </div>

          <!-- Contact -->
          <div class="glass-card p-8" style="border-radius:20px">
            <h3 class="text-xl font-black text-white mb-6" style="letter-spacing:-0.3px">Contact</h3>
            <div class="flex flex-col gap-6">
               <div class="grid grid-cols-2 gap-4">
                   <div class="col-span-2">
                      <label class="block text-xs font-bold uppercase tracking-widest mb-2" style="color:#64748b">Professional Email</label>
                      <input type="email" class="form-input" style="padding-left:16px; opacity:0.6" value="${AppState.user?.email || ''}" disabled>
                   </div>
                   <div class="col-span-2">
                      <label class="block text-xs font-bold uppercase tracking-widest mb-2" style="color:#64748b">Contact Phone</label>
                      <input type="text" id="profilePhone" class="form-input" style="padding-left:16px" value="${localProfile?.phone || ''}" ${!isEditMode ? 'disabled' : ''}>
                   </div>
               </div>
            </div>
          </div>

          <!-- Schedule -->
          <div class="glass-card p-8 lg:col-span-2" style="border-radius:20px">
            <h3 class="text-xl font-black text-white mb-6" style="letter-spacing:-0.3px">Schedule</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                    <span class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Mon - Fri</span>
                    <span class="text-white font-bold">09:00 AM - 05:00 PM</span>
                </div>
                <div class="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                    <span class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Saturday</span>
                    <span class="text-white font-bold">On Call / Rotational</span>
                </div>
                <div class="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                    <span class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Sunday</span>
                    <span class="text-status-critical font-bold">Offline / Urgent Only</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    `;
   }

   function toggleEdit() {
      isEditMode = !isEditMode;
      renderMain();
   }

   async function handleSave() {
      const staffUpdates = {
         full_name: document.getElementById('profileName').value.trim(),
         phone: document.getElementById('profilePhone').value.trim(),
         department: document.getElementById('profileDepartment').value.trim(),
         specialization: document.getElementById('profileSpecialization').value.trim()
      };

      const doctorUpdates = {
         specialization: staffUpdates.specialization,
         experience_years: parseInt(document.getElementById('profileExperience').value || 0),
         qualification: document.getElementById('profileQualification').value.trim(),
         license_number: document.getElementById('profileLicense').value.trim(),
         department: staffUpdates.department,
         unit: document.getElementById('profileUnit').value.trim(),
         bio: document.getElementById('editBio')?.value?.trim() || ''
      };

      Notifications.info('Clinical credentials being synchronized...');

      const { success: staffSuccess } = await API.updateStaffProfile(AppState.role, AppState.user.id, staffUpdates);

      if (AppState.role === 'doctor') {
         const { success: doctorSuccess } = await API.updateDoctorProfile(AppState.user.id, doctorUpdates);
         if (doctorSuccess) doctorProfile = { ...doctorProfile, ...doctorUpdates };
      }

      if (staffSuccess) {
         localProfile = { ...localProfile, ...staffUpdates };
         isEditMode = false;
         renderMain();
         Notifications.success('Clinical profile updated successfully.');
         if (window.Dashboard) Dashboard.updateHeader();
      }
   }

   async function toggleStatus() {
      const newStatus = localProfile?.status === 'on-duty' ? 'off-duty' : 'on-duty';
      const { success } = await API.updateStaffProfile(AppState.role, AppState.user.id, { status: newStatus });
      if (success) {
         localProfile.status = newStatus;
         renderMain();
         Dashboard.updateHeader();
      }
   }

   async function logout() {
      try {
         Notifications.info('Terminating secure clinical session...');
         await Auth.signOut();
         sessionStorage.removeItem("demoMode");
         window.location.href = "/index.html";
      } catch (err) {
         console.error('Logout failed:', err);
         sessionStorage.removeItem("demoMode");
         window.location.href = "/index.html";
      }
   }

   return { load, toggleEdit, handleSave, toggleStatus, logout };
})();

export { Profile };
window.Profile = Profile;


