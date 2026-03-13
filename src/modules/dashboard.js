import { Auth } from '../core/auth.js';
import { API } from '../core/api.js';
import { Realtime } from '../core/realtime.js';
import { Modal } from '../ui/modal.js';
import { Notifications } from '../ui/notifications.js';
import { Skeletons } from '../ui/skeletons.js';
import { DemoData } from '../core/demo.js';
import { Patients } from './patients.js';

// Global Application State
export const AppState = {
  user: null,
  role: null,
  specialization: null,
  doctorProfile: null,
  activeSection: 'overview',
  activePatient: null,
  isDemoMode: false
};

const Dashboard = (() => {
  async function loadModule(moduleName, sectionId) {
    try {
      console.log(`Carenium Dashboard: Lazy-loading module: ${moduleName}...`);
      const module = await window.CareniumModules[moduleName]();
      const keys = Object.keys(module);
      const exportedModule = module[moduleName] || module[keys[0]];
      
      if (exportedModule && exportedModule.init) {
        await exportedModule.init();
      }
      if (exportedModule && exportedModule.load) {
        exportedModule.load();
      }
    } catch (err) {
      console.error(`Carenium Dashboard: Module load failed (${moduleName}):`, err);
      if (window.UI) UI.showToast(`Failed to load ${moduleName} module.`, "error");
    }
  }

  const NAV_CONFIG = {
    doctor: [
      { id: 'overview', label: 'Dashboard', icon: 'grid', action: () => renderOverview() },
      { id: 'patients', label: 'My Patients', icon: 'users', action: () => {
          loadModule('Patients', 'patients');
          setTimeout(() => { if (window.Patients) window.Patients.renderPatientsPage(); }, 100);
      }},
      { id: 'appointments', label: 'Appointments', icon: 'calendar', action: () => loadModule('Appointments', 'appointments') },
      { id: 'reports', label: 'Reports', icon: 'clipboard', action: () => loadModule('Reports', 'reports') },
      { id: 'directory', label: 'Staff Directory', icon: 'shield', action: () => loadModule('Staff', 'directory') },
      { id: 'profile', label: 'My Profile', icon: 'user', action: () => loadModule('Profile', 'profile') }
    ],
    nurse: [
      { id: 'overview', label: 'Dashboard', icon: 'grid', action: () => renderOverview() },
      { id: 'patients', label: 'Assigned Duties', icon: 'activity', action: () => loadModule('Patients', 'patients') },
      { id: 'directory', label: 'Staff Directory', icon: 'shield', action: () => loadModule('Staff', 'directory') },
      { id: 'profile', label: 'My Profile', icon: 'user', action: () => loadModule('Profile', 'profile') }
    ]
  };

  const NAV_ICONS = {
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    clipboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>'
  };

  async function init() {
    try {
      // 1. Authenticate FIRST
      const demoMode = sessionStorage.getItem("demoMode");

      if (demoMode === "true" || window.isDemoMode) {
        setupDemoState();
      } else {
        const session = await Auth.getSession();
        if (!session) {
          window.location.href = '/index.html';
          return;
        }
        AppState.user = session.user;

        const profile = await API.getBaseProfile(AppState.user.id);
        if (profile.success) {
          AppState.role = profile.data.role || 'doctor';
          AppState.displayName = profile.data.name;
        } else {
          AppState.role = 'doctor';
        }

        if (AppState.role === 'doctor') {
          try {
            const doctorProfile = await API.getDoctorProfile(AppState.user.id);
            if (doctorProfile.success && doctorProfile.data && doctorProfile.data.specialization) {
              AppState.doctorProfile = doctorProfile.data;
              AppState.specialization = doctorProfile.data.specialization;
            } else if (!window.isDemoMode) {
              console.warn("Carenium: Clinical profile is incomplete. Launching onboarding wizard...");
              if (window.Router) {
                await window.Router.navigate('/onboarding');
                return; // Stop initialization
              }
            }
          } catch (profileErr) {
            console.error("Carenium: Error loading doctor profile:", profileErr);
          }
        }

        Realtime.init((type, payload) => {
          if (type === 'patients' && window.Patients) window.Patients.load();
          if (type === 'staff' && window.Staff) window.Staff.load();
          if (type === 'vital_alert') {
            if (window.Alerts) window.Alerts.handleIncoming(payload);
          }
        });
      }

      // 2. ONLY THEN Ensure Shell exists
      ensureShell();
      renderSidebar();
      updateHeader();
      switchSection('overview');

    } catch (error) {
      console.error('Carenium: Dashboard critical init failure:', error);
      Notifications.error('System initialization failed. Please refresh.');
    }
  }

  function setupDemoState() {
    AppState.isDemoMode = true;
    AppState.role = 'doctor';
    AppState.specialization = 'Cardiologist';
    AppState.displayName = 'Dr. Demo';
    AppState.user = { email: 'demo@carenium.com', id: 'demo-u-001' };

    DemoData.init((data) => {
      if (AppState.activeSection === 'overview' || AppState.activeSection === 'patients') {
        Patients.load();
      }
    });
  }

  function renderSidebar() {
    console.log("Carenium Dashboard: Rendering sidebar...");
    const nav = document.querySelector('.sidebar-nav');
    const footer = document.getElementById('sidebarFooter');
    const items = NAV_CONFIG[AppState.role] || [];

    if (nav) {
      nav.innerHTML = items.map(item => `
        <div class="nav-item p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all hover:bg-white/5 ${AppState.activeSection === item.id ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400'}" 
             data-section="${item.id}">
          <span class="w-5 h-5 pointer-events-none">${NAV_ICONS[item.icon] || ''}</span>
          <span class="font-bold text-sm pointer-events-none">${item.label}</span>
        </div>
      `).join('');
    }

    if (footer) {
      footer.innerHTML = `
        <div class="nav-item p-3 rounded-xl flex items-center gap-3 cursor-pointer text-slate-500 hover:text-red-400 transition-all hover:bg-red-500/5 mt-auto" id="logoutBtn">
          <span class="w-5 h-5 pointer-events-none">${NAV_ICONS.logout}</span>
          <span class="font-bold text-sm pointer-events-none">Logout</span>
        </div>

        ${AppState.isDemoMode ? `
        <div class="nav-item p-3 rounded-xl flex items-center gap-3 cursor-pointer text-amber-500 hover:text-amber-400 transition-all hover:bg-amber-500/5 border border-amber-500/10 mt-2" id="resetDemoBtn">
          <span class="w-5 h-5 pointer-events-none">🔄</span>
          <span class="font-bold text-sm pointer-events-none">Reset Demo Data</span>
        </div>
        ` : ''}
      `;
    }

    const displayName = AppState.displayName || 'Demo User';
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRoleText');
    const avatarEl = document.getElementById('userAvatar');

    if (userNameEl) userNameEl.textContent = displayName;
    if (userRoleEl) userRoleEl.textContent = AppState.specialization || AppState.role.toUpperCase();
    if (avatarEl) avatarEl.textContent = displayName[0].toUpperCase();
  }

  function openAdmission() {
    UI.openPanel('admissionPanel');
    
    // BUG FIX: Safe Event Binding for Admission Button
    const confirmBtn = document.querySelector("#confirmAdmissionBtn");
    if(confirmBtn){
       // Remove previous listeners to avoid duplicates
       const newConfirmBtn = confirmBtn.cloneNode(true);
       confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
       newConfirmBtn.addEventListener("click", (e) => {
          if (window.Patients) window.Patients.admitPatient(e);
          else UI.showToast("Patients module not ready.", "error");
       });
    }

    // Auto-generate Patient ID
    const pidEl = document.getElementById('generatedPatientId');
    if (pidEl) pidEl.textContent = 'PID-' + Date.now().toString(36).toUpperCase();

    // Auto-fill Admission Timestamp
    const timeEl = document.getElementById('generatedAdmitTime');
    if (timeEl) timeEl.textContent = new Date().toLocaleString();

    // Auto-assign Doctor
    const docEl = document.getElementById('slideAdmDoctor');
    if (docEl) {
      docEl.value = AppState.isDemoMode ? 'Dr. Demo' : ('Dr. ' + (AppState.user?.email?.split('@')[0] || 'User'));
    }
  }

  function closeAdmission() {
    UI.closePanel('admissionPanel');
  }

  function updateHeader() {
    const userDisplay = AppState.isDemoMode
      ? 'Dr. Demo Workspace'
      : ('Dr. ' + (AppState.user?.email?.split('@')[0] || 'User'));

    const topName = document.getElementById('topUserName');
    if (topName) topName.textContent = userDisplay;

    const specBadgeContainer = document.getElementById('specBadgeContainer');
    if (specBadgeContainer && AppState.specialization) {
      specBadgeContainer.innerHTML = `
        ${AppState.isDemoMode ? '<span class="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/40 mr-2 animate-pulse">Demo Mode Active</span>' : ''}
        <span class="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">${AppState.specialization}</span>
        ${AppState.doctorProfile?.unit ? `<span class="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-500/20 ml-2">${AppState.doctorProfile.unit}</span>` : ''}
      `;
    }
  }

  function switchSection(id) {
    AppState.activeSection = id;
    renderSidebar();

    Skeletons.render('dashboardContent', 1);

    const config = NAV_CONFIG[AppState.role].find(x => x.id === id);
    if (config) {
      setTimeout(() => config.action(), 100);
    }
  }

  function ensureShell() {
    let dashboardRoot = document.getElementById('dashboardRoot');
    const loginWrapper = document.querySelector('.login-wrapper');
    if (loginWrapper) loginWrapper.style.display = 'none';

    // If root exists but inner structure is missing (e.g. freshly loaded dashboard.html)
    // or if root doesn't exist at all.
    if (!dashboardRoot || !dashboardRoot.querySelector('.sidebar')) {
      if (!dashboardRoot) {
        dashboardRoot = document.createElement('div');
        dashboardRoot.id = 'dashboardRoot';
        dashboardRoot.className = 'dashboard-layout flex min-h-screen';
        document.body.appendChild(dashboardRoot);
      }

      dashboardRoot.style.display = 'flex';
      dashboardRoot.innerHTML = `
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

                      <div class="header-right flex items-center gap-4 relative">
                          <button class="md:hidden w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 lg:hidden" id="mobileMenuBtn">
                              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                          </button>
                          <button class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 relative" id="notificationBell">
                              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                              <span class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping hidden" id="notifBadge"></span>
                          </button>
                          
                          <!-- NOTIFICATION DROPDOWN -->
                          <div id="notificationPanel" class="hidden absolute top-14 right-0 w-80 border border-white/10 rounded-xl shadow-2xl glass-card z-50 overflow-hidden" style="background: rgba(15, 20, 30, 0.95); backdrop-filter: blur(20px);">
                              <div class="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                                  <h3 class="font-bold text-white text-sm">Notifications</h3>
                                  <span class="text-[10px] bg-red-500/20 text-red-500 font-bold px-2 py-1 rounded" id="notifCount">0 New</span>
                              </div>
                              <div class="max-h-[300px] overflow-y-auto" id="notificationList">
                                 <div class="p-6 text-center opacity-40 text-xs">No recent notifications.</div>
                              </div>
                          </div>
                      </div>
                  </header>

                  <div id="dashboardContent" class="fade-page">
                      <div class="p-12 text-center opacity-50">Loading Medical OS...</div>
                  </div>
               </main>
               <div class="sidebar-overlay" id="sidebarOverlay"></div>
           `;
    } else {
      dashboardRoot.style.display = 'flex';
    }
  }

  async function renderOverview() {
    const content = document.getElementById('dashboardContent');
    const specLabel = AppState.specialization || 'Medical';

    content.innerHTML = `
      <div class="overview-container fade-page">
        <div class="welcome-banner glass-card" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div class="welcome-text">
            <h2>Good ${getGreeting()}, Dr. ${AppState.user?.email?.split('@')[0] || 'Doctor'}</h2>
            <p>${specLabel} Department — ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div class="flex gap-3">
             <button class="btn btn-sm btn-outline" onclick="Dashboard.handleScheduleClick()"><span class="mr-2">📅</span>Schedule Appt</button>
             <button class="btn btn-sm btn-primary" id="newAdmissionBtn"><span class="mr-2">➕</span>New Admission</button>
          </div>
        </div>

        <div class="dashboard-grid mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="stat-card glass-card">
            <div class="stat-icon">🏥</div>
            <div class="stat-info">
              <label>Active Patients</label>
              <div class="stat-value" id="statTotal">
                 <div class="w-8 h-4 bg-white/10 animate-pulse rounded"></div>
              </div>
            </div>
          </div>
          <div class="stat-card glass-card">
            <div class="stat-icon">🚨</div>
            <div class="stat-info">
              <label>Critical Alerts</label>
              <div class="stat-value text-red-400" id="statCritical">
                 <div class="w-8 h-4 bg-white/10 animate-pulse rounded"></div>
              </div>
            </div>
          </div>
          <div class="stat-card glass-card">
            <div class="stat-icon">📅</div>
            <div class="stat-info">
              <label>Today's Appointments</label>
              <div class="stat-value" id="statAppointments">
                 <div class="w-8 h-4 bg-white/10 animate-pulse rounded"></div>
              </div>
            </div>
          </div>
          <div class="stat-card glass-card highlighting">
            <div class="stat-icon">🛏️</div>
            <div class="stat-info">
              <label>Bed Occupancy</label>
              <div class="stat-value" id="statOccupancy">
                 <div class="w-12 h-4 bg-white/10 animate-pulse rounded"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
           <div class="lg:col-span-2 flex flex-col gap-6">
               <div class="glass-card p-6 border border-white/5">
                   <h3 class="font-bold mb-4">Daily Summary & Patient Flow</h3>
                   <div class="flex items-end gap-2 h-32 border-b border-white/10 relative" id="patientChart">
                       <div class="absolute inset-0 flex items-center justify-center opacity-50 text-[10px] tracking-widest uppercase font-black">Building AI Analytics...</div>
                   </div>
                   <div class="flex justify-between text-[10px] opacity-40 mt-2 font-bold uppercase">
                       <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                   </div>
               </div>
               
               <div class="section-card glass-card border border-white/5">
                 <div class="section-header flex justify-between items-center mb-6 pl-6 pt-6 pr-6">
                   <h3 class="section-title">Active Unit Monitor</h3>
                 </div>
                 <div class="px-6 pb-6">
                    <div id="patientGrid" class="grid grid-cols-1 xl:grid-cols-2 gap-4"></div>
                 </div>
               </div>
            <div class="flex flex-col gap-6">
               <div class="glass-card p-6 border border-white/5 border-l-4 border-l-indigo-500">
                   <div class="flex justify-between items-center mb-4">
                       <h3 class="font-bold flex items-center gap-2"><span class="text-indigo-400">🧠</span> AI Clinical Monitoring</h3>
                       <span class="text-[10px] bg-indigo-500/20 text-indigo-400 px-2.5 py-0.5 rounded-full font-bold">Active Engine</span>
                   </div>
                   <div class="flex flex-col gap-3" id="aiAlertsList">
                       <div class="text-xs opacity-50 p-4 text-center italic">Scanning physiological data streams...</div>
                   </div>
               </div>

               <div class="glass-card p-6 border border-white/5 border-l-4 border-l-red-500">
                   <div class="flex justify-between items-center mb-4">
                       <h3 class="font-bold flex items-center gap-2"><span class="text-red-400">🚨</span> Critical Alerts Panel</h3>
                       <span class="text-[10px] bg-red-500/20 text-red-500 px-2.5 py-0.5 rounded-full font-bold" id="liveAlertsCount">0</span>
                   </div>
                   <div class="flex flex-col gap-3" id="liveAlertsList">
                       <div class="text-xs opacity-50 p-4 text-center">No active critical alerts.</div>
                   </div>
               </div>

               <div class="glass-card p-6 border border-white/5 flex-1 max-h-[300px] overflow-y-auto">
                   <h3 class="font-bold flex items-center gap-2 mb-4"><span class="text-indigo-400">⏱️</span> Recent Activity</h3>
                   <div class="relative pl-4 border-l-2 border-white/10 flex flex-col gap-6 pt-2" id="activityTimeline">
                       <div class="text-[10px] tracking-widest uppercase font-black opacity-30 py-4 text-center">Fetching chronological timeline...</div>
                   </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Initialize core patients grid
    if (window.Patients && window.Patients.load) window.Patients.load();

    // Fetch Live Dashboard Data Non-Blocking
    setTimeout(fetchDashboardData, 100);
  }

  async function fetchDashboardData() {
     try {
         const pRes = await API.getPatients(AppState.role, AppState.user.id);
         const patients = pRes.data || [];
         
         const aRes = await API.getAppointments(AppState.user.id);
         const apts = aRes.data || [];

         const logsRes = await API.getAuditLogs(10);
         const logs = logsRes.data || [];

         // Stats
         const criticals = patients.filter(p => p.status === 'critical');
         const todayStr = new Date().toDateString();
         const todayApts = apts.filter(a => new Date(a.scheduled_at).toDateString() === todayStr);
         
         document.getElementById('statTotal').textContent = patients.length;
         document.getElementById('statCritical').textContent = criticals.length;
         document.getElementById('statAppointments').textContent = todayApts.length;
         document.getElementById('statOccupancy').textContent = Math.min(Math.round((patients.length / 50) * 100), 100) + '%';

         // AI Alerts Panel & criticals
         const aiAlertsList = document.getElementById('aiAlertsList');
         const alertsList = document.getElementById('liveAlertsList');
         const alertsCount = document.getElementById('liveAlertsCount');

         if (aiAlertsList) {
            const highRiskPatients = patients.filter(p => (p.ai_risk_score || 0) > 60).sort((a,b) => (b.ai_risk_score||0) - (a.ai_risk_score||0));
            if (highRiskPatients.length > 0) {
               aiAlertsList.innerHTML = highRiskPatients.map(p => `
                  <div class="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer" onclick="window.Patients?.openDetailModal('${p.id}')">
                     <div class="flex flex-col">
                        <span class="text-xs font-bold">${p.name}</span>
                        <span class="text-[9px] opacity-40 uppercase tracking-widest">Risk Analysis: ${p.ai_risk_score > 80 ? 'CRITICAL' : 'WARNING'}</span>
                     </div>
                     <div class="text-lg font-black ${p.ai_risk_score > 80 ? 'text-red-400' : 'text-yellow-400'}">${p.ai_risk_score}%</div>
                  </div>
               `).join('');
            } else {
               aiAlertsList.innerHTML = `<div class="text-[10px] opacity-40 p-4 text-center italic">No high-risk physiological patterns detected.</div>`;
            }
         }

         if (alertsList && criticals.length > 0) {
             if (alertsCount) alertsCount.textContent = criticals.length;
             alertsList.innerHTML = criticals.map(c => `
                 <div class="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex flex-col cursor-pointer hover:bg-red-500/20 hover:-translate-y-0.5 transition-all shadow-lg" onclick="window.Patients?.openDetailModal('${c.id}')">
                     <span class="text-xs font-bold text-red-400">Critical Patient: ${c.name}</span>
                     <span class="text-[10px] opacity-70 truncate mt-1">Ward: ${c.ward || 'ICU'} • Condition: ${c.condition || 'Unstable'}</span>
                 </div>
             `).join('');
         } else if (alertsList) {
            if (alertsCount) alertsCount.textContent = '0';
            alertsList.innerHTML = `<div class="text-xs opacity-50 p-4 text-center">No active critical alerts.</div>`;
         }

         // Recent Activity Timeline
         const timeline = document.getElementById('activityTimeline');
         if (timeline) {
             if (logs.length > 0) {
                  timeline.innerHTML = logs.map((log, i) => `
                     <div class="relative slide-up" style="animation-delay: ${i*0.05}s">
                         <div class="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-[var(--bg-primary)]"></div>
                         <div class="text-[10px] text-indigo-400 font-bold mb-0.5">${new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                         <div class="text-xs text-white max-w-[200px] truncate">${log.action_type || log.action || 'System Event'}</div>
                         <div class="text-[9px] opacity-40 uppercase truncate tracking-wider">${log.entity||'Global'}</div>
                     </div>
                 `).join('');
             } else {
                 timeline.innerHTML = `<div class="text-xs opacity-50 py-4 text-center">No recent activity.</div>`;
             }
         }

         // Mock Patient Chart
         const chartElement = document.getElementById('patientChart');
         if (chartElement) {
             const days = [12, 19, 15, 22, 18, 14, Math.max(8, patients.length)];
             const max = Math.max(...days, 1);
             chartElement.innerHTML = days.map((val, i) => `
                 <div class="flex-1 bg-indigo-500/20 hover:bg-indigo-500/60 rounded-t border-t border-indigo-500/50 transition-all flex items-end justify-center relative group" style="height: ${(val/max)*100}%; animation: slideUp 0.5s ease forwards; animation-delay: ${i*0.05}s">
                     <div class="absolute -top-6 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-500 text-white px-2 py-0.5 rounded">${val}</div>
                 </div>
             `).join('');
         }

         // Notifications
         const notifications = [
             ...criticals.map(c => ({ title: 'Critical Patient', message: c.name + ' needs attention', type: 'critical' })),
             ...todayApts.slice(0, 2).map(a => ({ title: 'Upcoming Appt', message: a.patient_name || 'Generic Patient', type: 'info' }))
         ];
         updateNotificationBell(notifications);

     } catch (err) {
         console.error("Dashboard Data Fetch Error:", err);
     }
  }

  function updateNotificationBell(notifications) {
      const badge = document.getElementById('notifBadge');
      const count = document.getElementById('notifCount');
      const list = document.getElementById('notificationList');

      if (!badge || !list) return;

      if (notifications.length > 0) {
          badge.classList.remove('hidden');
          count.textContent = notifications.length + ' New';
          list.innerHTML = notifications.map((n, i) => `
              <div class="p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer flex flex-col gap-1 transition-colors">
                 <span class="text-xs font-bold flex items-center gap-2 ${n.type === 'critical' ? 'text-red-400' : 'text-blue-400'}">
                    ${n.type === 'critical' ? '🚨' : '💬'} ${n.title}
                 </span>
                 <span class="text-[11px] text-white/70">${n.message}</span>
              </div>
          `).join('');
      } else {
          badge.classList.add('hidden');
          count.textContent = '0 New';
          list.innerHTML = '<div class="p-6 text-center opacity-40 text-xs">No recent notifications.</div>';
      }
  }

  document.addEventListener('click', (e) => {
    const target = e.target;

    // Sidebar Navigation
    const navItem = target.closest('.nav-item[data-section]');
    if (navItem) {
      const section = navItem.dataset.section;
      console.log(`Carenium Dashboard: Switching to section: ${section}`);
      document.body.classList.remove('sidebar-open');
      switchSection(section);
      return;
    }

    // Logout
    if (target.closest('#logoutBtn')) {
      Auth.signOut();
      return;
    }

    // Reset Demo Data
    if (target.closest('#resetDemoBtn')) {
      if (confirm('Are you sure you want to reset all demo data? This will restore the initial dataset.')) {
        if (window.DemoData) {
          window.DemoData.resetData();
          Notifications.success('Demo data restored to initial state.');
          location.reload();
        }
      }
      return;
    }

    // Toggle Notifications Panel
    if (target.closest('#notificationBell')) {
       document.getElementById('notificationPanel')?.classList.toggle('hidden');
       return;
    }
    
    // Auto-close notification panel when clicking outside
    const notifPanel = document.getElementById('notificationPanel');
    if (notifPanel && !notifPanel.classList.contains('hidden')) {
      if (!target.closest('#notificationPanel') && !target.closest('#notificationBell')) {
        notifPanel.classList.add('hidden');
      }
    }

    if (target.closest('#newAdmissionBtn')) {
      console.log("Carenium Dashboard: Opening Admission Panel.");
      openAdmission();
    }
    if (target.closest('#mobileMenuBtn')) {
      document.body.classList.add('sidebar-open');
      console.log("Carenium Dashboard: Opening mobile menu.");
    }
    
    if (target.closest('#sidebarOverlay')) {
      document.body.classList.remove('sidebar-open');
      console.log("Carenium Dashboard: Closing mobile menu via overlay.");
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.body.classList.remove('sidebar-open');
    }
  });

  document.addEventListener('submit', (e) => {
    if (e.target.id === 'admissionForm' || e.target.id === 'slideAdmissionForm') {
      console.log("Carenium Dashboard: Admission form submitted.");
      if (window.Patients) window.Patients.admitPatient(e);
      else console.error("Carenium: Patients module not loaded for admission.");
    }
  });

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
  }


  async function handleScheduleClick() {
    if (window.Appointments) {
      window.Appointments.openScheduleModal();
    } else {
      await loadModule('Appointments', 'appointments');
      if (window.Appointments) window.Appointments.openScheduleModal();
      else Notifications.error("Unable to initialize Appointments module.");
    }
  }

  console.log("Carenium Dashboard: Module loaded.");
  return { init, switchSection, updateHeader, openAdmission, closeAdmission, handleScheduleClick };
})();

export { Dashboard };
window.Dashboard = Dashboard;

