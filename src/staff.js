/* =============================================
   CARENIUM — Staff & Directory Module
   Hospital personnel management.
   ============================================= */

const Staff = (() => {
  let directory = [];

  async function load() {
    const gridId = AppState.activeSection === 'directory' ? 'staffGrid' : null;
    if (gridId) UI.renderSkeletonGrid(gridId, 4);

    const { data, success } = await API.getAllStaff();
    if (success) {
      directory = data;
      if (AppState.activeSection === 'directory') renderDirectory();
    }
  }

  function renderDirectory() {
    const grid = document.getElementById('staffGrid');
    if (!grid) return;

    grid.innerHTML = directory.map(s => `
      <div class="staff-card glass-panel fade-in ${s.status}" style="border: 1px solid var(--glass-border); padding: 24px; border-radius: 24px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px; background: var(--glass-bg); box-shadow: var(--glass-shadow);">
        <div class="staff-avatar" style="width: 80px; height: 80px; background: var(--gradient-saturn); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; color: #fff; box-shadow: 0 10px 20px rgba(0,0,0,0.3); border: 2px solid rgba(255,255,255,0.1);">${s.full_name[0]}</div>
        <div class="staff-info">
          <h4 style="font-size: 1.25rem; font-weight: 800; color: #fff; margin-bottom: 4px;">${s.full_name}</h4>
          <p style="font-size: 0.85rem; color: var(--text-tertiary);">${s.department} • <span class="role-text-badge" style="background: var(--gradient-uranus); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; letter-spacing: 1px;">${s.role.toUpperCase()}</span></p>
        </div>
        <div class="staff-availability" style="display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 700; color: ${s.status === 'on-duty' ? '#1FF4D0' : 'var(--text-tertiary)'}; background: rgba(255,255,255,0.05); padding: 6px 16px; border-radius: 20px;">
          <span class="status-pulse" style="background: ${s.status === 'on-duty' ? '#1FF4D0' : '#444'}; width: 6px; height: 6px; border-radius: 50%; ${s.status === 'on-duty' ? 'box-shadow: 0 0 10px #1FF4D0; animation: pulse 2s infinite;' : ''}"></span>
          <span>${s.status === 'on-duty' ? 'Active' : 'Offline'}</span>
        </div>
      </div>
    `).join('');
  }

  return { load, getDirectory: () => directory };
})();

// Register globally
window.Staff = Staff;
