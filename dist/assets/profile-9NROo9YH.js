import{N as c,A as h,a as o}from"./api-DAyZ9kHC.js";import{A as l,D as b,S as w}from"./dashboard-DsR46vqT.js";const y=(()=>{let i=!1,e=null,t=null;async function f(){const{user:a}=l;if(!a)return;w.render("dashboardContent",1);const{data:s,success:n}=await o.getStaffProfile(l.role,a.id);if(n&&(e={...s}),l.role==="doctor"){const d=await o.getDoctorProfile(a.id);d.success&&(t=d.data)}r()}function r(){var p,u;const a=document.getElementById("dashboardContent");if(!a)return;const s=(e==null?void 0:e.full_name)||((u=(p=l.user)==null?void 0:p.email)==null?void 0:u.split("@")[0])||"Doctor",n=(t==null?void 0:t.department)||(e==null?void 0:e.department)||"--",d=(t==null?void 0:t.specialization)||(e==null?void 0:e.specialization)||"General Practice";a.innerHTML=`
      <div class="profile-container fade-in">
        <div class="profile-header-card glass-card p-8 mb-6 rounded-[32px]">
          <div class="flex items-center gap-8">
            <div class="profile-avatar-large w-[120px] h-[120px] bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-[3.5rem] font-black text-white border-4 border-white/10 relative overflow-hidden">
                ${s[0]}
            </div>
            <div class="profile-title flex-1">
               <h2 class="text-4xl font-black text-white tracking-tighter mb-2">${s}</h2>
               <div class="flex gap-3">
                 <span class="px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">${d}</span>
                 <span class="px-4 py-1.5 rounded-full bg-white/5 text-slate-400 text-xs font-bold border border-white/10">${n}</span>
               </div>
               <div class="mt-3 text-xs opacity-50">Member since ${new Date((e==null?void 0:e.created_at)||Date.now()).toLocaleDateString()}</div>
            </div>
            <div class="profile-actions-header flex gap-2">
               <button class="btn btn-secondary px-6 py-3 rounded-xl font-bold" onclick="Profile.toggleEdit()">
                  ${i?"Cancel":"Edit Profile"}
               </button>
               ${i?'<button class="btn btn-primary px-6 py-3 rounded-xl font-bold" onclick="Profile.handleSave()">Save Changes</button>':""}
               <button id="logoutBtn" class="logout-btn font-bold ml-2" onclick="Profile.logout()">Logout</button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="glass-card p-8 rounded-[28px]">
            <h3 class="text-xl font-black text-white mb-6 flex items-center gap-3">
                Professional Credentials
            </h3>
            <div class="flex flex-col gap-6">
               <div class="grid grid-cols-2 gap-4">
                   <div>
                      <label class="block text-[0.7rem] font-black text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
                      <input type="text" id="profileName" class="form-input" value="${s}" ${i?"":"disabled"}>
                   </div>
                   <div>
                      <label class="block text-[0.7rem] font-black text-slate-500 uppercase tracking-widest mb-2">Phone</label>
                      <input type="text" id="profilePhone" class="form-input" value="${(e==null?void 0:e.phone)||""}" ${i?"":"disabled"}>
                   </div>
               </div>
               <div class="grid grid-cols-2 gap-4">
                   <div>
                      <label class="block text-[0.7rem] font-black text-slate-500 uppercase tracking-widest mb-2">Department</label>
                      <input type="text" id="profileDepartment" class="form-input" value="${n}" ${i?"":"disabled"}>
                   </div>
                   <div>
                      <label class="block text-[0.7rem] font-black text-slate-500 uppercase tracking-widest mb-2">Specialization</label>
                      <input type="text" id="profileSpecialization" class="form-input" value="${d}" ${i?"":"disabled"}>
                   </div>
               </div>
               <div class="grid grid-cols-2 gap-4">
                   <div>
                      <label class="block text-[0.7rem] font-black text-slate-500 uppercase tracking-widest mb-2">Experience (Years)</label>
                      <input type="number" id="profileExperience" class="form-input" value="${(t==null?void 0:t.experience_years)||0}" ${i?"":"disabled"}>
                   </div>
                   <div>
                      <label class="block text-[0.7rem] font-black text-slate-500 uppercase tracking-widest mb-2">Working Schedule</label>
                      <input type="text" id="workingSchedule" class="form-input" placeholder="e.g. 8AM - 4PM" value="${(t==null?void 0:t.working_schedule)||""}" ${i?"":"disabled"}>
                   </div>
               </div>
            </div>
          </div>

          <div class="flex flex-col gap-6">
              <div class="glass-card p-8 rounded-[28px] h-full">
                <h3 class="text-xl font-black text-white mb-6">Status & Availability</h3>
                <div class="flex flex-col gap-6">
                     <div>
                        <label class="block text-[0.7rem] font-black text-slate-500 uppercase tracking-widest mb-2">Clinical Availability</label>
                        <button class="w-full p-4 rounded-2xl font-black transition-all ${(e==null?void 0:e.status)==="on-duty"?"bg-emerald-500/20 text-emerald-400 border border-emerald-500/30":"bg-white/5 text-slate-400 border border-white/10"}" onclick="Profile.toggleStatus()" ${i?"":"disabled"}>
                           ${(e==null?void 0:e.status)==="on-duty"?"On Duty":"Off Duty"}
                        </button>
                     </div>
                </div>
              </div>
          </div>
        </div>

        ${t!=null&&t.bio||i?`
          <div class="glass-card p-8 rounded-[28px] mt-6">
            <h3 class="text-xl font-black text-white mb-4">Biography</h3>
            ${i?`<textarea id="editBio" class="form-input w-full p-4 rounded-2xl" rows="4">${(t==null?void 0:t.bio)||""}</textarea>`:`<p class="text-slate-400 leading-relaxed">${(t==null?void 0:t.bio)||"No bio provided."}</p>`}
          </div>`:""}
      </div>
    `}function m(){i=!i,r()}async function g(){const a={full_name:document.getElementById("profileName").value,phone:document.getElementById("profilePhone").value,department:document.getElementById("profileDepartment").value,specialization:document.getElementById("profileSpecialization").value},s={name:a.full_name,phone:a.phone,department:a.department,specialization:a.specialization,experience_years:parseInt(document.getElementById("profileExperience").value||0),working_schedule:document.getElementById("workingSchedule").value||""};c.info("Clinical credentials being synchronized...");const{success:n}=await o.updateStaffProfile(l.role,l.user.id,a);l.role==="doctor"&&(await o.updateDoctorProfile(l.user.id,s),t={...t,...s}),n&&(e={...e,...a},i=!1,r(),c.success("Clinical profile updated successfully."),b.updateHeader())}async function x(){const a=(e==null?void 0:e.status)==="on-duty"?"off-duty":"on-duty",{success:s}=await o.updateStaffProfile(l.role,l.user.id,{status:a});s&&(e.status=a,r(),b.updateHeader())}async function v(){try{c.info("Terminating secure clinical session..."),await h.signOut(),sessionStorage.removeItem("demoMode"),window.location.href="/index.html"}catch(a){console.error("Logout failed:",a),sessionStorage.removeItem("demoMode"),window.location.href="/index.html"}}return{load:f,toggleEdit:m,handleSave:g,toggleStatus:x,logout:v}})();window.Profile=y;export{y as Profile};
//# sourceMappingURL=profile-9NROo9YH.js.map
