/* =============================================
   CARENIUM — Profile Management Module v3
   Specialization-aware editable profiles.
   ============================================= */

const Profile = (() => {
   let isEditMode = false;
   let localProfile = null;
   let doctorProfile = null;

   async function load() {
      const { user } = AppState;
      if (!user) return;

      UI.renderSkeletonGrid('dashboardContent', 1);

      // Load base staff profile
      const { data, success } = await API.getStaffProfile(AppState.role, user.id);
      if (success) {
         localProfile = { ...data };
      }

      // Load doctor specialization profile
      if (AppState.role === 'doctor') {
         const dp = await API.getDoctorProfile(user.id);
         if (dp.success) {
            doctorProfile = dp.data;
         }
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
      <div class="profile-container fade-in">
        <!-- Profile Header Card -->
        <div class="profile-header-card glass-panel p-8 mb-6" style="background: var(--glass-bg); backdrop-filter: blur(30px); border: 1px solid var(--glass-border); border-radius: 32px;">
          <div class="profile-header" style="display: flex; align-items: center; gap: 32px;">
            <div class="profile-avatar-large" style="width: 120px; height: 120px; background: var(--gradient-saturn); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3.5rem; font-weight: 800; color: #fff; box-shadow: var(--shadow-xl); border: 4px solid rgba(255,255,255,0.1); position: relative; overflow: hidden;">
                ${profileName[0]}
                <div style="position: absolute; inset: 0; background: linear-gradient(0deg, rgba(0,0,0,0.3) 0%, transparent 100%);"></div>
            </div>
            <div class="profile-title">
               <h2 style="font-size: 2.5rem; font-weight: 900; color: #fff; letter-spacing: -1.5px; margin-bottom: 8px;">${profileName}</h2>
               <div class="profile-badges" style="display: flex; gap: 12px;">
                 <span class="spec-badge" style="background: var(--gradient-uranus); color: #fff; padding: 6px 16px; border-radius: 20px; font-size: 0.8rem; font-weight: 800;">${spec}</span>
                 <span class="dept-badge" style="background: rgba(255,255,255,0.05); color: var(--text-secondary); border: 1px solid var(--glass-border); padding: 6px 16px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">${department}</span>
                 ${doctorProfile?.unit ? `<span class="unit-badge" style="background: var(--gradient-saturn); color: #fff; padding: 6px 16px; border-radius: 20px; font-size: 0.8rem; font-weight: 800;">${doctorProfile.unit}</span>` : ''}
               </div>
               <div class="last-updated" style="margin-top: 12px; font-size: 0.75rem; color: var(--text-tertiary);">Member since ${new Date(localProfile?.created_at || Date.now()).toLocaleDateString()}</div>
            </div>
            <div class="profile-actions-header" style="margin-left: auto;">
               <button class="btn btn-secondary" style="background: rgba(255,255,255,0.05); color: #fff; border: 1px solid var(--glass-border); padding: 12px 24px; border-radius: 14px; font-weight: 700;" onclick="Profile.toggleEdit()">
                  ${isEditMode ? 'Cancel' : 'Edit Profile'}
               </button>
               ${isEditMode ? `<button class="btn btn-primary ml-2" id="saveProfileBtn" style="background: var(--gradient-uranus); color: #fff; padding: 12px 24px; border-radius: 14px; font-weight: 800; box-shadow: var(--neon-glow-uranus);" onclick="Profile.handleSave()">Save Changes</button>` : ''}
            </div>
          </div>
        </div>

        <!-- Profile Details -->
        <div class="profile-details-container">
          <div class="profile-section glass-panel p-6 mb-6" style="background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 28px; padding: 32px;">
            <h3 class="section-subtitle mb-4" style="font-size: 1.25rem; font-weight: 800; color: #fff; margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20" style="color: #F7F4B7;">
                    <path d="M12 2v20M2 12h20"/>
                </svg>
                Professional Information
            </h3>
            <div class="profile-details-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px;">
               <div class="detail-item">
                  <label style="display: block; font-size: 0.7rem; font-weight: 800; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Specialization</label>
                  <div class="spec-display" style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); padding: 16px; border-radius: 16px; border: 1px solid var(--glass-border);">
                    <span style="font-size: 1rem; font-weight: 650; color: #fff;">${spec}</span>
                    ${!isEditMode && AppState.role === 'doctor' ? `
                    <button class="btn btn-xs btn-outline-secondary" onclick="Profile.requestSpecChange()">
                      Request Change
                    </button>` : ''}
                  </div>
               </div>
               <div class="detail-item">
                  <label style="display: block; font-size: 0.7rem; font-weight: 800; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Years of Experience</label>
                  ${isEditMode ?
            `<input type="number" id="editExp" class="form-input" style="width: 100%; background: var(--bg-input); border: 1px solid var(--glass-border); color: #fff; padding: 16px; border-radius: 16px;" value="${doctorProfile?.experience_years || localProfile?.years_experience || 0}">` :
            `<div style="font-size: 1.1rem; font-weight: 700; color: #fff; padding: 16px; background: rgba(255,255,255,0.03); border-radius: 16px; border: 1px solid transparent;">${doctorProfile?.experience_years || localProfile?.years_experience || 0} Years</div>`}
               </div>
               <div class="detail-item">
                  <label style="display: block; font-size: 0.7rem; font-weight: 800; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Qualification</label>
                  ${isEditMode ?
            `<input type="text" id="editQual" class="form-input" style="width: 100%; background: var(--bg-input); border: 1px solid var(--glass-border); color: #fff; padding: 16px; border-radius: 16px;" value="${doctorProfile?.qualification || ''}">` :
            `<div style="font-size: 1.1rem; font-weight: 700; color: #fff; padding: 16px;">${doctorProfile?.qualification || '--'}</div>`}
               </div>
               <div class="detail-item">
                  <label style="display: block; font-size: 0.7rem; font-weight: 800; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">License Number</label>
                  ${isEditMode ?
            `<input type="text" id="editLicense" class="form-input" style="width: 100%; background: var(--bg-input); border: 1px solid var(--glass-border); color: #fff; padding: 16px; border-radius: 16px;" value="${doctorProfile?.license_number || ''}">` :
            `<div style="font-size: 1.1rem; font-weight: 750; color: #F7F4B7; font-family: monospace; padding: 16px; letter-spacing: 1px;">${doctorProfile?.license_number || '--'}</div>`}
               </div>
            </div>
          </div>

          <div class="profile-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
            <!-- Contact Info -->
            <div class="profile-section glass-panel p-6" style="background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 28px; padding: 32px;">
              <h3 class="section-subtitle mb-4" style="font-size: 1.1rem; font-weight: 800; color: #fff; margin-bottom: 24px;">Contact</h3>
              <div class="profile-details-grid single-col" style="display: flex; flex-direction: column; gap: 24px;">
                <div class="detail-item">
                   <label style="display: block; font-size: 0.7rem; font-weight: 800; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Phone</label>
                   ${isEditMode ?
            `<input type="text" id="editPhone" class="form-input" style="width: 100%; background: var(--bg-input); border: 1px solid var(--glass-border); color: #fff; padding: 16px; border-radius: 16px;" value="${localProfile?.phone || ''}">` :
            `<div style="font-size: 1rem; font-weight: 650; color: #fff; padding: 8px 0;">${localProfile?.phone || '--'}</div>`}
                </div>
                <div class="detail-item">
                   <label style="display: block; font-size: 0.7rem; font-weight: 800; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Email</label>
                   <div style="font-size: 1rem; font-weight: 650; color: #fff; padding: 8px 0;">${localProfile?.email || AppState.user?.email}</div>
                </div>
                <div class="detail-item">
                   <label style="display: block; font-size: 0.7rem; font-weight: 800; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Availability Status</label>
                   <button class="btn-status-toggle ${localProfile?.status || 'off-duty'}" style="width: 100%; padding: 16px; border-radius: 16px; border: 1px solid ${localProfile?.status === 'on-duty' ? 'var(--neon-cyan)' : 'var(--glass-border)'}; background: ${localProfile?.status === 'on-duty' ? 'rgba(31, 244, 208, 0.1)' : 'rgba(255,255,255,0.03)'}; color: ${localProfile?.status === 'on-duty' ? 'var(--neon-cyan)' : '#fff'}; font-weight: 750; transition: all 0.3s ease;" onclick="Profile.toggleStatus()">
                      ${localProfile?.status === 'on-duty' ? 'On Duty' : 'Off Duty'}
                   </button>
                </div>
              </div>
            </div>

            <!-- Performance Stats -->
            <div class="profile-section glass-panel p-6" style="background: var(--gradient-saturn); border: 1px solid rgba(255,255,255,0.1); border-radius: 28px; padding: 32px; color: #fff; position: relative; overflow: hidden;">
              <div style="position: absolute; top: -20%; right: -10%; width: 200px; height: 200px; background: rgba(255,255,255,0.05); border-radius: 50%; blur: 40px;"></div>
              <h3 class="section-subtitle mb-4" style="font-size: 1.1rem; font-weight: 800; color: #F7F4B7; margin-bottom: 24px;">Performance Analytics</h3>
              <div class="performance-grid" style="display: grid; grid-template-columns: 1fr; gap: 24px;">
                <div class="perf-stat" style="background: rgba(0,0,0,0.2); padding: 20px; border-radius: 20px; display: flex; align-items: center; justify-content: space-between;">
                  <div class="perf-label" style="font-size: 0.8rem; font-weight: 700; color: rgba(255,255,255,0.6);">Patients Treated</div>
                  <div class="perf-value" style="font-size: 1.75rem; font-weight: 900; color: #fff;">1,280</div>
                </div>
                <div class="perf-stat" style="background: rgba(0,0,0,0.2); padding: 20px; border-radius: 20px; display: flex; align-items: center; justify-content: space-between;">
                  <div class="perf-label" style="font-size: 0.8rem; font-weight: 700; color: rgba(255,255,255,0.6);">Clinical Success</div>
                  <div class="perf-value" style="font-size: 1.75rem; font-weight: 900; color: #1FF4D0;">94.2%</div>
                </div>
                <div class="perf-stat" style="background: rgba(0,0,0,0.2); padding: 20px; border-radius: 20px; display: flex; align-items: center; justify-content: space-between;">
                  <div class="perf-label" style="font-size: 0.8rem; font-weight: 700; color: rgba(255,255,255,0.6);">Patient Satisfaction</div>
                  <div class="perf-value" style="font-size: 1.75rem; font-weight: 900; color: #F7F4B7;">4.9/5</div>
                </div>
              </div>
            </div>
          </div>

          ${doctorProfile?.bio || isEditMode ? `
          <div class="profile-section glass-panel p-6" style="background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 28px; padding: 32px; margin-top: 24px;">
            <h3 class="section-subtitle mb-4" style="font-size: 1.1rem; font-weight: 800; color: #fff; margin-bottom: 16px;">Professional Biography</h3>
            ${isEditMode ?
               `<textarea id="editBio" class="form-input" style="width: 100%; background: var(--bg-input); border: 1px solid var(--glass-border); color: #fff; padding: 16px; border-radius: 16px;" rows="4">${doctorProfile?.bio || ''}</textarea>` :
               `<p class="bio-text" style="color: var(--text-secondary); line-height: 1.8; font-size: 1rem;">${doctorProfile?.bio || 'No bio provided.'}</p>`}
          </div>` : ''}
        </div>
      </div>
    `;
   }

   function toggleEdit() {
      isEditMode = !isEditMode;
      renderMain();
   }

   async function handleSave() {
      const btn = document.getElementById('saveProfileBtn');
      if (btn) btn.disabled = true;

      // Staff profile updates
      const staffUpdates = {
         years_experience: parseInt(document.getElementById('editExp')?.value || 0),
         phone: document.getElementById('editPhone')?.value || ''
      };

      const { success: staffSuccess } = await API.updateStaffProfile(AppState.role, AppState.user.id, staffUpdates);

      // Doctor profile updates (if doctor)
      if (AppState.role === 'doctor' && doctorProfile) {
         const doctorUpdates = {
            experience_years: parseInt(document.getElementById('editExp')?.value || 0),
            qualification: document.getElementById('editQual')?.value || '',
            license_number: document.getElementById('editLicense')?.value || '',
            department: document.getElementById('editDept')?.value || '',
            unit: document.getElementById('editUnit')?.value || '',
            bio: document.getElementById('editBio')?.value || '',
            // Specialization NOT included — blocked
            specialization: doctorProfile.specialization
         };

         const { success: dpSuccess } = await API.updateDoctorProfile(AppState.user.id, doctorUpdates);
         if (dpSuccess) {
            doctorProfile = { ...doctorProfile, ...doctorUpdates };
            AppState.doctorProfile = doctorProfile;
         }
      }

      if (staffSuccess) {
         localProfile = { ...localProfile, ...staffUpdates };
         isEditMode = false;
         renderMain();
         UI.showToast('Profile updated successfully.', 'success');
         Dashboard.updateHeader();

         await API.logAction({
            action_type: 'PROFILE_UPDATE',
            user_id: AppState.user.id,
            entity: 'doctor_profiles',
            entity_id: AppState.user.id,
            new_data: staffUpdates
         });
      }
      if (btn) btn.disabled = false;
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

   function requestSpecChange() {
      UI.showToast('Specialization changes require admin approval. Please contact your administrator.', 'info');
   }

   return { load, toggleEdit, handleSave, toggleStatus, requestSpecChange };
})();

// Register globally
window.Profile = Profile;

