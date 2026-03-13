import { API } from '../core/api.js';
import { Notifications } from '../ui/notifications.js';
import { Modal } from '../ui/modal.js';
import { AppState } from './dashboard.js';

const AdminPanel = (() => {
    let activeTab = 'logs';

    async function load() {
        const content = document.getElementById('dashboardContent');
        if (!content) return;

        content.innerHTML = `
            <div class="admin-panel fade-page p-6">
                <div class="glass-card p-6">
                    <div class="flex justify-between items-center mb-8">
                        <div>
                            <h3 class="text-xl font-bold">Clinical Governance Panel</h3>
                            <p class="text-xs opacity-50 font-medium">System-wide oversight and security audit logs</p>
                        </div>
                        <button class="btn btn-sm btn-primary" onclick="AdminPanel.openAddStaffModal()">+ Add Personnel</button>
                    </div>

                    <div class="detail-tabs mb-8" id="adminTabs">
                        <button class="detail-tab active" onclick="AdminPanel.switchTab('logs')">Audit Trails</button>
                        <button class="detail-tab" onclick="AdminPanel.switchTab('staff')">Personnel Management</button>
                        <button class="detail-tab" onclick="AdminPanel.switchTab('depts')">Departments</button>
                    </div>

                    <div id="adminTabContent">
                        <!-- Audit Logs Tab -->
                        <div class="admin-tab-view" id="tabLogs">
                           <div class="table-responsive">
                                <table class="w-full text-left text-xs">
                                    <thead class="opacity-40 uppercase font-black border-b border-white/5">
                                        <tr>
                                            <th class="py-3 px-4">TIMESTAMP</th>
                                            <th class="py-3 px-4">USER</th>
                                            <th class="py-3 px-4">ACTION</th>
                                            <th class="py-3 px-4">ENTITY</th>
                                            <th class="py-3 px-4">DETAILS</th>
                                        </tr>
                                    </thead>
                                    <tbody id="auditLogsBody">
                                        <tr><td colspan="5" class="p-8 text-center opacity-30">Retrieving system-wide clinical event logs...</td></tr>
                                    </tbody>
                                </table>
                           </div>
                        </div>

                        <!-- Personnel Management Tab -->
                        <div class="admin-tab-view hidden" id="tabStaff">
                            <div id="adminStaffGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div class="p-8 text-center opacity-30 col-span-full">Loading personnel records...</div>
                            </div>
                        </div>

                        <!-- Departments Tab -->
                        <div class="admin-tab-view hidden" id="tabDepts">
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="deptsGrid"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        activeTab = 'logs';
        await fetchAuditLogs();
    }

    async function fetchAuditLogs() {
        const { data, success } = await API.getAuditLogs();
        const body = document.getElementById('auditLogsBody');
        if (!body) return;

        if (success && data && data.length > 0) {
            body.innerHTML = data.map(log => `
                <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td class="py-3 px-4 opacity-50">${new Date(log.created_at).toLocaleString()}</td>
                    <td class="py-3 px-4 font-bold text-indigo-400">${log.user_id ? log.user_id.substring(0, 8) + '...' : 'SYSTEM'}</td>
                    <td class="py-3 px-4"><span class="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-white/5 border border-white/10">${log.action_type || log.action || 'EVENT'}</span></td>
                    <td class="py-3 px-4">${log.entity || 'CORE'}</td>
                    <td class="py-3 px-4 truncate max-w-[200px] opacity-60">${typeof log.details === 'object' ? JSON.stringify(log.details) : (log.details || '--')}</td>
                </tr>
            `).join('');
        } else {
            body.innerHTML = `<tr><td colspan="5" class="p-8 text-center opacity-30">No audit logs retrieved. Ensure Admin privileges.</td></tr>`;
        }
    }

    async function loadStaffTab() {
        const grid = document.getElementById('adminStaffGrid');
        if (!grid) return;

        const { data, success } = await API.getAllStaff();
        if (success && data) {
            grid.innerHTML = data.map(s => `
                <div class="glass-card p-4 border border-white/5 flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-sm border border-white/10">
                        ${s.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-bold text-sm truncate">${s.full_name}</div>
                        <div class="text-[10px] opacity-50 uppercase tracking-wider">${s.role === 'doctor' ? (s.specialization || 'Doctor') : 'Nurse'} • ${s.department || 'General'}</div>
                    </div>
                    <span class="w-2 h-2 rounded-full ${s.status === 'on-duty' ? 'bg-green-500' : 'bg-gray-500'}"></span>
                </div>
            `).join('');
        } else {
            grid.innerHTML = '<div class="p-8 text-center opacity-30 col-span-full">No staff records found.</div>';
        }
    }

    function loadDeptsTab() {
        const grid = document.getElementById('deptsGrid');
        if (!grid) return;

        const departments = ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Emergency', 'Radiology', 'Oncology', 'General Medicine', 'ICU'];
        grid.innerHTML = departments.map(dept => `
            <div class="glass-card p-5 border border-white/5 hover:bg-white/5 transition-all cursor-default">
                <h4 class="font-bold text-sm mb-2">${dept}</h4>
                <div class="text-[10px] opacity-50 uppercase tracking-widest">Active Department</div>
            </div>
        `).join('');
    }

    function switchTab(tab) {
        activeTab = tab;

        // Toggle tab active states
        document.querySelectorAll('#adminTabs .detail-tab').forEach(t => {
            t.classList.toggle('active', t.getAttribute('onclick')?.includes(`'${tab}'`));
        });

        // Toggle content views
        document.getElementById('tabLogs')?.classList.toggle('hidden', tab !== 'logs');
        document.getElementById('tabStaff')?.classList.toggle('hidden', tab !== 'staff');
        document.getElementById('tabDepts')?.classList.toggle('hidden', tab !== 'depts');

        if (tab === 'staff') loadStaffTab();
        if (tab === 'depts') loadDeptsTab();
    }

    function openAddStaffModal() {
        const modalBody = document.querySelector('#prescriptionModal .modal-body');
        if (!modalBody) {
            Notifications.info('Staff registration module activated.');
            return;
        }

        modalBody.innerHTML = `
            <form id="addStaffForm" class="p-4">
                <h3 class="font-bold mb-4">Register New Staff Member</h3>
                <div class="form-group mb-4">
                    <label class="block text-xs font-bold opacity-50 mb-1">FULL NAME</label>
                    <input type="text" id="newStaffName" class="form-input" placeholder="Dr. Jane Smith" required>
                </div>
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="form-group">
                        <label class="block text-xs font-bold opacity-50 mb-1">ROLE</label>
                        <select id="newStaffRole" class="form-input">
                            <option value="doctor">Doctor</option>
                            <option value="nurse">Nurse</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="block text-xs font-bold opacity-50 mb-1">DEPARTMENT</label>
                        <input type="text" id="newStaffDept" class="form-input" placeholder="Cardiology" required>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="form-group">
                        <label class="block text-xs font-bold opacity-50 mb-1">PHONE</label>
                        <input type="text" id="newStaffPhone" class="form-input" placeholder="+1 555-0100">
                    </div>
                    <div class="form-group">
                        <label class="block text-xs font-bold opacity-50 mb-1">EMAIL</label>
                        <input type="email" id="newStaffEmail" class="form-input" placeholder="jane@hospital.com">
                    </div>
                </div>
                <button type="submit" class="btn btn-primary w-full">Register Staff Member</button>
            </form>
        `;

        Modal.open('prescriptionModal');

        document.getElementById('addStaffForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            Notifications.success('Staff member registration submitted. Backend sync pending admin approval.');
            Modal.close('prescriptionModal');

            await API.logAction({
                action_type: 'ADD_STAFF',
                user_id: AppState.user?.id,
                entity: 'staff',
                new_data: {
                    name: document.getElementById('newStaffName')?.value,
                    role: document.getElementById('newStaffRole')?.value,
                    department: document.getElementById('newStaffDept')?.value
                }
            });
        });
    }

    return { load, switchTab, openAddStaffModal };
})();

export { AdminPanel };
window.AdminPanel = AdminPanel;
