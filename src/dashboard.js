/* =============================================
   CARENIUM — Enterprise Dashboard Controller v3
   Specialization-driven orchestrator.
   ============================================= */

// Global Application State
const AppState = {
  user: null,
  role: null,
  specialization: null,
  doctorProfile: null,
  activeSection: 'overview',
  activePatient: null,
  isDemoMode: false
};

// Demo gate is set by main.js

const Dashboard = (() => {
  const NAV_CONFIG = {
    doctor: [
      { id: 'overview', label: 'Dashboard', icon: 'grid', action: () => renderOverview() },
      { id: 'patients', label: 'My Patients', icon: 'users', action: () => Patients.load() },
      { id: 'appointments', label: 'Appointments', icon: 'calendar', action: () => Appointments.load() },
      { id: 'reports', label: 'Reports', icon: 'clipboard', action: () => renderReports() },
      { id: 'profile', label: 'My Profile', icon: 'user', action: () => Profile.load() }
    ],
    nurse: [
      { id: 'overview', label: 'Dashboard', icon: 'grid', action: () => renderOverview() },
      { id: 'patients', label: 'Assigned Duties', icon: 'activity', action: () => Patients.load() },
      { id: 'directory', label: 'Staff Directory', icon: 'shield', action: () => Staff.load() },
      { id: 'profile', label: 'My Profile', icon: 'user', action: () => Profile.load() }
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
      // 1. DEMO MODE
      if (window.isDemoMode) {
        console.info('Carenium: Running in Demo Access Mode.');
        setupDemoState();
      } else {
        // 2. REAL AUTH CHECK
        const session = await Auth.getSession();
        if (!session) {
          window.location.href = '/';
          return;
        }
        AppState.user = session.user;

        // 3. PROFILE LOADING (Phase 5 Hardening)
        const profile = await API.getBaseProfile(AppState.user.id);
        if (profile.success) {
          AppState.role = profile.data.role || 'doctor';
          // Store display name from profile or metadata
          AppState.displayName = profile.data.name;
        } else {
          console.warn('Carenium: Profile load failed, using auth defaults.');
          AppState.role = 'doctor'; // Safety fallback
        }

        // 4. DOCTOR ONBOARDING CHECK
        if (AppState.role === 'doctor') {
          const doctorProfile = await API.getDoctorProfile(AppState.user.id);
          if (doctorProfile.success && doctorProfile.data) {
            AppState.doctorProfile = doctorProfile.data;
            AppState.specialization = doctorProfile.data.specialization;
          } else if (!window.isDemoMode) {
            // If no doctor profile and not demo, might need onboarding
            // However, we check if they HAVE a specialty first
            if (!doctorProfile.data?.specialization) {
              window.location.href = 'doctor-onboarding.html';
              return;
            }
          }
        }

        // Start Real-time
        if (typeof Realtime !== 'undefined') {
          Realtime.init((type, payload) => {
            if (type === 'patients') Patients.load();
            if (type === 'staff') Staff.load();
            if (type === 'vital_alert') {
              if (typeof Alerts !== 'undefined') Alerts.handleIncoming(payload);
            }
          });
        }
      }

      // 5. Initialize UI
      renderSidebar();
      updateHeader();
      switchSection('overview');

    } catch (error) {
      console.error('Carenium: Dashboard critical init failure:', error);
      if (typeof UI !== 'undefined') UI.showToast('System initialization failed. Please refresh.', 'error');
    }
  }

  function setupDemoState() {
    AppState.isDemoMode = true;
    AppState.role = 'doctor';
    AppState.specialization = 'Cardiologist';
    AppState.displayName = 'Dr. Demo';
    AppState.user = { email: 'demo@carenium.com', id: 'demo-u-001' };
    AppState.doctorProfile = {
      specialization: 'Cardiologist',
      experience_years: 12,
      qualification: 'MD Cardiology',
      license_number: 'MCI-DEMO-001',
      department: 'Cardiology',
      unit: 'Cardiac ICU'
    };

    window.apiMutationGuard = (action) => {
      UI.showToast(`Demo Mode: ${action} is simulated.`, 'info');
      return true;
    };

    if (typeof DemoData !== 'undefined') {
      DemoData.init((updatedPatients) => {
        if (AppState.activeSection === 'overview' || AppState.activeSection === 'patients') {
          Patients.load();
        }
      });
    }
  }

  function renderSidebar() {
    const nav = document.querySelector('.sidebar-nav');
    const footer = document.getElementById('sidebarFooter');
    const items = NAV_CONFIG[AppState.role] || [];

    if (nav) {
      nav.innerHTML = items.map(item => `
        <div class="nav-item ${AppState.activeSection === item.id ? 'active' : ''}" 
             onclick="Dashboard.switchSection('${item.id}')">
          <span class="nav-icon">${NAV_ICONS[item.icon] || item.label[0]}</span>
          <span class="nav-label">${item.label}</span>
        </div>
      `).join('');
    }

    if (footer) {
      footer.innerHTML = `
        <div class="nav-item logout" onclick="Auth.signOut()">
          <span class="nav-icon">${NAV_ICONS.logout}</span>
          <span class="nav-label">Logout</span>
        </div>
      `;
    }

    // Sidebar User Info
    const displayName = AppState.displayName || 'Demo User';
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRoleText');
    const avatarEl = document.getElementById('userAvatar');

    if (userNameEl) userNameEl.textContent = displayName;
    if (userRoleEl) userRoleEl.textContent = AppState.specialization || AppState.role.toUpperCase();
    if (avatarEl) avatarEl.textContent = displayName[0].toUpperCase();
  }

  function updateHeader() {
    const userDisplay = AppState.isDemoMode
      ? 'Dr. Demo Workspace'
      : ('Dr. ' + (AppState.user?.email?.split('@')[0] || 'User'));
    document.getElementById('topUserName').textContent = userDisplay;

    const badge = document.getElementById('topRoleBadge');
    badge.textContent = AppState.specialization || AppState.role;
    badge.className = `role-badge ${AppState.role} specialization-badge`;

    // Show specialization sub-badge
    const specBadgeContainer = document.getElementById('specBadgeContainer');
    if (specBadgeContainer && AppState.specialization) {
      specBadgeContainer.innerHTML = `
        <span class="spec-badge">${AppState.specialization}</span>
        ${AppState.doctorProfile?.unit ? `<span class="unit-badge">${AppState.doctorProfile.unit}</span>` : ''}
      `;
    }

    // Demo mode badge
    if (AppState.isDemoMode) {
      const headerRight = document.querySelector('.header-right');
      if (headerRight && !document.getElementById('demoBadge')) {
        const demoBadge = document.createElement('span');
        demoBadge.id = 'demoBadge';
        demoBadge.className = 'role-badge demo';
        demoBadge.textContent = 'Demo Mode';
        demoBadge.title = 'Real database writes are disabled.';
        headerRight.prepend(demoBadge);
      }
    }
  }

  function switchSection(id) {
    AppState.activeSection = id;
    renderSidebar();

    const content = document.getElementById('dashboardContent');
    // Phase 5: Skeleton Loader
    if (typeof UI !== 'undefined' && UI.renderSkeletonGrid) {
      UI.renderSkeletonGrid('dashboardContent', 1);
    } else {
      content.innerHTML = '<div class="section-loader p-12 text-center">Preparing medical unit...</div>';
    }

    const config = NAV_CONFIG[AppState.role].find(x => x.id === id);
    if (config) {
      // Delay slightly for smooth transition
      setTimeout(() => config.action(), 100);
    }
  }

  function renderOverview() {
    const content = document.getElementById('dashboardContent');
    const specLabel = AppState.specialization || 'Medical';

    content.innerHTML = `
      <div class="overview-container fade-in">
        <!-- Welcome Banner -->
        <div class="welcome-banner glass-panel">
          <div class="welcome-text">
            <h2>Good ${getGreeting()}, Dr. ${AppState.user?.email?.split('@')[0] || 'Doctor'}</h2>
            <p>${specLabel} Department — ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div class="welcome-status">
            <span class="online-status-dot"></span>
            <span>Online</span>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card primary">
            <div class="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            </div>
            <div class="stat-body">
              <label>Assigned Patients</label>
              <div class="stat-value" id="statTotal">--</div>
            </div>
          </div>
          <div class="stat-card danger">
            <div class="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div class="stat-body">
              <label>Critical Alerts</label>
              <div class="stat-value" id="statCritical">--</div>
            </div>
          </div>
          <div class="stat-card accent">
            <div class="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div class="stat-body">
              <label>Today's Appointments</label>
              <div class="stat-value" id="statAppointments">--</div>
            </div>
          </div>
          <div class="stat-card info">
            <div class="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <div class="stat-body">
              <label>AI Risk Alerts</label>
              <div class="stat-value" id="statRiskAlerts">0</div>
            </div>
          </div>
        </div>

        <!-- Alert Banner Area -->
        <div id="alertBanner" class="alert-banner-container"></div>

        <!-- Content Grid -->
        <div class="content-grid mt-8">
          <div class="section-card">
            <div class="section-header">
              <h3 class="section-title">Active Unit Monitor</h3>
              <button class="btn btn-sm btn-primary" id="newAdmissionBtn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New Admission
              </button>
            </div>
            <div id="patientGrid" class="patient-grid-compact p-6">
              <!-- Modules/patients.js will render here -->
            </div>
          </div>
        </div>
      </div>
    `;

    // Robust Admission Binding
    Patients.load();
  }

  // Global Event Delegation for Admission Modal
  document.addEventListener('click', (e) => {
    if (e.target.closest('#newAdmissionBtn')) {
      e.preventDefault();
      UI.openModal('admissionModal');
    }
  });

  document.addEventListener('submit', (e) => {
    if (e.target.id === 'admissionForm') {
      Patients.admitPatient(e);
    }
  });


  function renderReports() {
    const content = document.getElementById('dashboardContent');
    content.innerHTML = `
      <div class="reports-container fade-in">
        <div class="section-card p-8">
          <h3 class="section-title mb-6">Performance Reports</h3>
          <div class="reports-grid">
            <div class="report-card glass-panel">
              <div class="report-icon primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </div>
              <div class="report-body">
                <h4>Patients Treated</h4>
                <span class="report-value" id="reportPatientCount">--</span>
                <span class="report-trend positive">+12% this month</span>
              </div>
            </div>
            <div class="report-card glass-panel">
              <div class="report-icon accent">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div class="report-body">
                <h4>Success Rate</h4>
                <span class="report-value">94.2%</span>
                <span class="report-trend positive">+2.1% vs last quarter</span>
              </div>
            </div>
            <div class="report-card glass-panel">
              <div class="report-icon info">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div class="report-body">
                <h4>Avg. Consultation Time</h4>
                <span class="report-value">22 min</span>
                <span class="report-trend neutral">—  on target</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
  }

  return { init, switchSection, updateHeader };
})();

// Register globally — init is called by main.js, NOT DOMContentLoaded
window.Dashboard = Dashboard;
window.AppState = AppState;
