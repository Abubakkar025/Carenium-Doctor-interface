import{N as v,a as g}from"./api-DAyZ9kHC.js";import"./dashboard-DsR46vqT.js";const h=(()=>{let n=[];async function c(){var t,i;const e=document.getElementById("dashboardContent");e&&(e.innerHTML=`
         <div class="staff-directory fade-in p-6">
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
      `,await d(),(t=document.getElementById("staffSearch"))==null||t.addEventListener("input",s),(i=document.getElementById("roleFilter"))==null||i.addEventListener("change",s))}async function d(){const{data:e,success:t}=await g.getAllStaff();t&&(n=e||[],s())}function s(){var o,r;const e=((o=document.getElementById("staffSearch"))==null?void 0:o.value.toLowerCase())||"",t=((r=document.getElementById("roleFilter"))==null?void 0:r.value)||"all",i=document.getElementById("staffGrid");if(!i)return;const l=n.filter(a=>{const p=a.full_name.toLowerCase().includes(e)||(a.specialization||"").toLowerCase().includes(e),m=t==="all"||a.role===t;return p&&m});if(l.length===0){i.innerHTML='<div class="p-12 text-center opacity-30 col-span-full">No clinical staff matched your criteria.</div>';return}i.innerHTML=l.map(a=>f(a)).join("")}function f(e){const t=e.role==="doctor";return`
         <div class="staff-card glass-card p-5 border border-white/5 relative overflow-hidden flex flex-col items-center text-center">
            <div class="absolute top-3 right-3 flex items-center gap-1.5">
               <span class="w-1.5 h-1.5 rounded-full ${e.status==="on-duty"?"bg-green-500":"bg-gray-500"}"></span>
               <span class="text-[9px] font-black uppercase opacity-60">${e.status||"offline"}</span>
            </div>
            
            <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-2xl font-black mb-4 border border-white/10">
               ${e.full_name.split(" ").map(l=>l[0]).join("")}
            </div>
            
            <h4 class="font-bold text-lg leading-tight mb-1">${e.full_name}</h4>
            <div class="text-xs font-black uppercase tracking-widest text-primary mb-3">${t?e.specialization||"Attending Physician":"Registered Nurse"}</div>
            
            <div class="w-full pt-4 border-t border-white/5 flex flex-col gap-2">
               <div class="flex justify-between items-center text-[10px] font-bold">
                  <span class="opacity-50">DEPARTMENT</span>
                  <span>${e.department||"General"}</span>
               </div>
               <button class="btn btn-sm btn-outline mt-2 w-full" onclick="Staff.viewProfile('${e.id}')">View Credentials</button>
            </div>
         </div>
      `}function u(e){v.info("Detailed staff credentials view coming in Phase 21.")}return{load:c,viewProfile:u}})();window.Staff=h;export{h as Staff};
//# sourceMappingURL=staff-CxY7T9Hk.js.map
