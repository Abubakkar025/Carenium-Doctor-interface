/* =============================================
   CARENIUM — Appointments Module
   Schedule management for doctors.
   ============================================= */

const Appointments = (() => {
  let appointments = [];

  async function load() {
    const content = document.getElementById('dashboardContent');
    content.innerHTML = `
          <div class="appointments-container fade-in">
            <div class="section-card p-6">
              <div class="section-header mb-6">
                <h3 class="section-title">Appointments</h3>
                <button class="btn btn-sm btn-primary" onclick="Appointments.openScheduleModal()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Schedule New
                </button>
              </div>

              <!-- Today's List -->
              <div class="appointment-section mb-8">
                <h4 class="subsection-title">Today's Appointments</h4>
                <div id="todayAppointments" class="appointment-list">
                  <div class="skeleton-card"></div>
                </div>
              </div>

              <!-- Upcoming -->
              <div class="appointment-section">
                <h4 class="subsection-title">Upcoming</h4>
                <div id="upcomingAppointments" class="appointment-list">
                  <div class="skeleton-card"></div>
                </div>
              </div>
            </div>
          </div>
        `;

    await fetchAppointments();
  }

  async function fetchAppointments() {
    if (AppState.isDemoMode) {
      appointments = generateDemoAppointments();
    } else {
      const result = await API.getAppointments(AppState.user.id);
      if (result.success) appointments = result.data || [];
    }
    renderAppointments();
  }

  function generateDemoAppointments() {
    const names = ['Sarah Johnson', 'Michael Chen', 'Lisa Patel', 'James Wilson', 'Emma Garcia'];
    const statuses = ['scheduled', 'completed', 'scheduled'];
    const now = new Date();
    return names.map((name, i) => ({
      id: `demo-apt-${i}`,
      patient_name: name,
      scheduled_at: new Date(now.getTime() + (i - 1) * 3600000).toISOString(),
      duration_minutes: 30,
      status: statuses[i % statuses.length],
      notes: ''
    }));
  }

  function renderAppointments() {
    const today = new Date().toDateString();

    const todayList = appointments.filter(a =>
      new Date(a.scheduled_at).toDateString() === today
    );
    const upcoming = appointments.filter(a =>
      new Date(a.scheduled_at).toDateString() !== today &&
      new Date(a.scheduled_at) > new Date()
    );

    const todayEl = document.getElementById('todayAppointments');
    const upcomingEl = document.getElementById('upcomingAppointments');

    if (todayEl) {
      todayEl.innerHTML = todayList.length === 0
        ? '<p class="empty-text">No appointments today.</p>'
        : todayList.map(renderAppointmentCard).join('');
    }

    if (upcomingEl) {
      upcomingEl.innerHTML = upcoming.length === 0
        ? '<p class="empty-text">No upcoming appointments.</p>'
        : upcoming.map(renderAppointmentCard).join('');
    }
  }

  function renderAppointmentCard(apt) {
    const time = new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const statusClass = apt.status === 'completed' ? 'completed' : apt.status === 'cancelled' ? 'cancelled' : 'scheduled';

    return `
          <div class="appointment-card glass-panel ${statusClass}">
            <div class="apt-time">
              <span class="apt-hour">${time}</span>
              <span class="apt-duration">${apt.duration_minutes} min</span>
            </div>
            <div class="apt-info">
              <span class="apt-patient">${apt.patient_name || 'Patient'}</span>
              <span class="apt-status">${apt.status}</span>
            </div>
            <div class="apt-actions">
              ${apt.status === 'scheduled' ? `
                <button class="btn btn-xs btn-outline-primary" onclick="Appointments.reschedule('${apt.id}')">Reschedule</button>
                <button class="btn btn-xs btn-outline-danger" onclick="Appointments.cancel('${apt.id}')">Cancel</button>
              ` : ''}
            </div>
          </div>
        `;
  }

  function openScheduleModal() {
    UI.showToast('Appointment scheduling — select a patient from My Patients first.', 'info');
  }

  async function reschedule(id) {
    UI.showToast('Reschedule functionality — select new date/time.', 'info');
  }

  async function cancel(id) {
    UI.confirmAction('Cancel Appointment', 'Are you sure you want to cancel this appointment?', async () => {
      if (AppState.isDemoMode) {
        UI.showToast('Demo Mode: Cancellation simulated.', 'info');
        return;
      }
      const { success } = await API.updateAppointment(id, { status: 'cancelled' });
      if (success) {
        UI.showToast('Appointment cancelled.', 'success');
        await fetchAppointments();
      }
    });
  }

  return { load, openScheduleModal, reschedule, cancel };
})();

// Register globally
window.Appointments = Appointments;

