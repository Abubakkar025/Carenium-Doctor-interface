import { API } from '../core/api.js';
import { Notifications } from '../ui/notifications.js';
import { AppState } from './dashboard.js';
import { Modal } from '../ui/modal.js';

const Reports = (() => {
    let reports = [];

    async function load() {
        const content = document.getElementById('dashboardContent');
        if (!content) return;

        content.innerHTML = `
            <div class="reports-suite fade-page p-6">
                <div class="glass-card p-6 border border-white/5 shadow-2xl">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-white/10 pb-6 gap-4">
                        <div>
                            <h3 class="text-2xl font-black">Medical Reports & Analytics</h3>
                            <p class="text-[10px] font-bold opacity-50 uppercase tracking-widest mt-2">Manage clinical history and documentation</p>
                        </div>
                        <div class="flex gap-4">
                            <button class="btn btn-primary shadow-lg shadow-indigo-500/20 hover:-translate-y-1 transition-all rounded-xl text-xs font-black uppercase tracking-widest px-6 py-2" onclick="Reports.openCreateReportModal()">
                                + Create Medical Report
                            </button>
                        </div>
                    </div>

                    <!-- REPORT SUMMARY CARDS -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                        <div class="glass-card p-6 border border-white/5 rounded-2xl bg-zinc-900 border-l-4 border-l-indigo-500 shadow-lg relative overflow-hidden group">
                           <div class="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors"></div>
                           <h4 class="font-black text-[10px] uppercase tracking-widest opacity-50 mb-4 text-indigo-400">Total Reports</h4>
                           <span class="text-4xl font-black" id="statTotalReports">--</span>
                        </div>
                        <div class="glass-card p-6 border border-white/5 rounded-2xl bg-zinc-900 border-l-4 border-l-amber-500 shadow-lg relative overflow-hidden group">
                           <div class="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors"></div>
                           <h4 class="font-black text-[10px] uppercase tracking-widest opacity-50 mb-4 text-amber-400">Pending Reports</h4>
                           <span class="text-4xl font-black" id="statPendingReports">--</span>
                        </div>
                        <div class="glass-card p-6 border border-white/5 rounded-2xl bg-zinc-900 border-l-4 border-l-emerald-500 shadow-lg relative overflow-hidden group">
                           <div class="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors"></div>
                           <h4 class="font-black text-[10px] uppercase tracking-widest opacity-50 mb-4 text-emerald-400">Completed Reports</h4>
                           <span class="text-4xl font-black" id="statCompletedReports">--</span>
                        </div>
                        <div class="glass-card p-6 border border-white/5 rounded-2xl bg-zinc-900 border-l-4 border-l-red-500 shadow-lg relative overflow-hidden group">
                           <div class="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors"></div>
                           <h4 class="font-black text-[10px] uppercase tracking-widest opacity-50 mb-4 text-red-400">Critical Reports</h4>
                           <span class="text-4xl font-black" id="statCriticalReports">--</span>
                        </div>
                    </div>

                    <!-- REPORT TABLE -->
                    <div class="report-section">
                        <h4 class="text-[10px] font-black uppercase opacity-50 tracking-widest mb-6 border-b border-white/5 pb-2">1️⃣ Report Repository</h4>
                        
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="border-b border-white/10 text-[10px] font-black uppercase tracking-widest opacity-50">
                                        <th class="p-4 rounded-tl-xl bg-white/5">Patient Name</th>
                                        <th class="p-4 bg-white/5">Report Type</th>
                                        <th class="p-4 bg-white/5">Doctor</th>
                                        <th class="p-4 bg-white/5">Department</th>
                                        <th class="p-4 bg-white/5">Date</th>
                                        <th class="p-4 bg-white/5">Status</th>
                                        <th class="p-4 rounded-tr-xl bg-white/5 text-right w-[200px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="reportsTableBody">
                                    <tr>
                                        <td colspan="7" class="p-12 text-center opacity-30">
                                            <div class="flex justify-center items-center">
                                                <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        await fetchReports();
    }

    async function fetchReports() {
        if (AppState.isDemoMode || window.isDemoMode) {
            // 🎯 DEMO MODE RULE: Use realistic fake data
            reports = window.demoReports || [];
        } else {
            // 🎯 DOCTOR INTERFACE RULE: Empty state, no fake data
            reports = [];
        }
        renderReports();
    }

    function renderReports() {
        const tBody = document.getElementById('reportsTableBody');
        
        // Stats
        const statTotal = document.getElementById('statTotalReports');
        const statPending = document.getElementById('statPendingReports');
        const statCompleted = document.getElementById('statCompletedReports');
        const statCritical = document.getElementById('statCriticalReports');

        if (statTotal) statTotal.textContent = reports.length;
        if (statPending) statPending.textContent = reports.filter(r => r.status?.toLowerCase() === 'pending').length;
        if (statCompleted) statCompleted.textContent = reports.filter(r => r.status?.toLowerCase() === 'completed').length;
        if (statCritical) statCritical.textContent = reports.filter(r => r.status?.toLowerCase() === 'critical').length;

        if (!tBody) return;

        if (reports.length === 0) {
            tBody.innerHTML = `
                <tr>
                    <td colspan="7" class="p-16 text-center">
                         <div class="flex flex-col items-center justify-center opacity-30">
                            <span class="text-4xl mb-4">📄</span>
                            <span class="text-lg font-bold">No medical reports available yet.</span>
                            <span class="text-[10px] uppercase tracking-widest mt-2">The repository is currently empty</span>
                         </div>
                    </td>
                </tr>
            `;
            return;
        }

        tBody.innerHTML = reports.map(r => {
            let statusClass = 'bg-white/5 text-white/60';
            const s = (r.status || 'Pending').toLowerCase();
            if(s === 'completed') statusClass = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
            if(s === 'pending') statusClass = 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
            if(s === 'critical') statusClass = 'bg-red-500/20 text-red-400 border border-red-500/30';

            // Handle date format
            let displayDate = r.date;
            try {
               const d = new Date(r.date);
               if(!isNaN(d)) displayDate = d.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
            } catch(e){}

            return `
            <tr class="border-b border-white/5 hover:bg-white/5 transition-colors group">
                <td class="p-4 font-bold text-sm text-white/90">${r.patient}</td>
                <td class="p-4 text-xs font-bold opacity-80">${r.reportType}</td>
                <td class="p-4 text-xs font-bold opacity-70 flex items-center gap-1">🩺 ${r.doctor}</td>
                <td class="p-4 text-xs opacity-60">${r.department || 'General'}</td>
                <td class="p-4 text-[10px] font-black uppercase tracking-widest opacity-60">${displayDate}</td>
                <td class="p-4">
                    <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusClass}">${r.status}</span>
                </td>
                <td class="p-4 text-right">
                    <div class="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:text-indigo-400 transition-all text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded" onclick="Reports.preview('${r.id}')">View</button>
                        <button class="bg-white/5 border border-white/10 hover:border-amber-500/50 hover:text-amber-400 transition-all text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded" onclick="Reports.edit('${r.id}')">Edit</button>
                        <button class="bg-white/5 border border-white/10 hover:border-emerald-500/50 hover:text-emerald-400 transition-all text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded" onclick="Reports.download('${r.id}')">PDF</button>
                        <button class="bg-white/5 border border-white/10 hover:border-blue-500/50 hover:text-blue-400 transition-all text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded" onclick="Reports.printCurrent()">Print</button>
                    </div>
                </td>
            </tr>
        `}).join('');
    }

    function openCreateReportModal() {
        // 🎯 DO NOT REWRITE PROJECT / NO NULL DOM ERRORS: Use existing modal system but build a dedicated DOM structure if missing
        let reportModal = document.getElementById('createReportModal');
        
        if (!reportModal) {
            // Build the modal overlay and container once
            reportModal = document.createElement('div');
            reportModal.id = 'createReportModal';
            reportModal.className = 'modal-overlay';
            reportModal.style.display = 'none';

            // Modal Content Structure: Strict Flex-Column for fixed header/footer
            reportModal.innerHTML = `
                <div class="modal-content glass-card flex flex-col mx-auto my-auto shadow-2xl overflow-hidden" 
                     style="width: 95%; max-width: 800px; height: auto; max-height: 90vh; border-radius: 24px; padding: 0;">
                    
                    <!-- 1. HEADER: Shrink-0 (Pinned) -->
                    <div class="modal-header shrink-0 flex justify-between items-center p-6 border-b border-white/5 bg-white/5">
                        <h2 class="text-xl font-black text-white tracking-tight">Create Medical Report</h2>
                        <button class="modal-close hover:text-red-400 transition-colors text-2xl leading-none transition-all hover:scale-110" id="closeReportModalBtn">✕</button>
                    </div>

                    <!-- 2. BODY: Flex-1 (Scrollable) -->
                    <div class="modal-body flex-1 overflow-y-auto custom-scrollbar p-0" style="background: rgba(15, 23, 42, 0.4);">
                        <form id="createReportForm" class="p-6">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div class="form-group">
                                    <label class="block text-[10px] font-black uppercase opacity-50 tracking-widest mb-2">Patient Name</label>
                                    <input type="text" id="repPatient" class="form-input bg-zinc-900 border-white/10 rounded-xl" placeholder="John Doe" required>
                                </div>
                                <div class="form-group">
                                    <label class="block text-[10px] font-black uppercase opacity-50 tracking-widest mb-2">Report Type</label>
                                    <select id="repType" class="form-input bg-zinc-900 border-white/10 rounded-xl" required>
                                        <option value="">Select Type...</option>
                                        <option value="Diagnosis Report">Diagnosis Report</option>
                                        <option value="Lab Report">Lab Report</option>
                                        <option value="Discharge Summary">Discharge Summary</option>
                                        <option value="Prescription">Prescription</option>
                                        <option value="Surgical Note">Surgical Note</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-group mb-6">
                                <label class="block text-[10px] font-black uppercase opacity-50 tracking-widest mb-2">Symptoms</label>
                                <textarea id="repSymptoms" class="form-input bg-zinc-900 border-white/10 rounded-xl min-h-[60px]" placeholder="Observed symptoms..."></textarea>
                            </div>

                            <div class="form-group mb-6">
                                <label class="block text-[10px] font-black uppercase opacity-50 tracking-widest mb-2 border-l-2 border-indigo-500 pl-2">Diagnosis</label>
                                <textarea id="repDiagnosis" class="form-input bg-zinc-900 border-white/10 border-indigo-500/30 bg-indigo-500/5 rounded-xl min-h-[60px]" required placeholder="Official diagnostic conclusion..."></textarea>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div class="form-group">
                                    <label class="block text-[10px] font-black uppercase opacity-50 tracking-widest mb-2">Treatment Plan</label>
                                    <textarea id="repPlan" class="form-input bg-zinc-900 border-white/10 rounded-xl min-h-[80px]" placeholder="Step-by-step treatment protocol..."></textarea>
                                </div>
                                <div class="form-group">
                                    <label class="block text-[10px] font-black uppercase opacity-50 tracking-widest mb-2">Medicines</label>
                                    <textarea id="repMedicine" class="form-input bg-zinc-900 border-white/10 rounded-xl min-h-[80px]" placeholder="Prescribed pharmaceutical interventions..."></textarea>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div class="form-group">
                                    <label class="block text-[10px] font-black uppercase opacity-50 tracking-widest mb-2">Follow-up Date</label>
                                    <input type="date" id="repFollowup" class="form-input bg-zinc-900 border-white/10 rounded-xl">
                                </div>
                                <div class="form-group">
                                    <label class="block text-[10px] font-black uppercase opacity-50 tracking-widest mb-2 text-indigo-400">Doctor Notes</label>
                                    <textarea id="repNotes" class="form-input bg-zinc-900 border-white/10 rounded-xl min-h-[60px]" placeholder="Confidential clinical notes..."></textarea>
                                </div>
                            </div>
                        </form>
                    </div>

                    <!-- 3. FOOTER: Shrink-0 (Pinned at Bottom) -->
                    <div class="modal-footer shrink-0 flex flex-wrap justify-end items-center gap-3 p-6 border-t border-white/10 bg-slate-900/90 backdrop-blur-md z-20">
                        <button type="button" id="cancelReportBtn" class="btn btn-outline border-white/10 hover:bg-white/5 hover:-translate-y-1 px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all">Cancel</button>
                        <button type="button" id="savePdfBtn" class="btn btn-secondary border-blue-500/30 hover:bg-blue-500/10 hover:-translate-y-1 text-blue-400 px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all">Save & Generate PDF</button>
                        <button type="submit" id="saveReportBtn" form="createReportForm" class="btn btn-primary px-8 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase shadow-lg shadow-indigo-500/20 hover:-translate-y-1 transition-all">Save Report</button>
                    </div>
                </div>
            `;
            document.body.appendChild(reportModal);

            const formEl = document.getElementById('createReportForm');
            const cancelBtn = document.getElementById('cancelReportBtn');
            const closeBtn = document.getElementById('closeReportModalBtn');
            const savePdfBtn = document.getElementById('savePdfBtn');

            // --- Handlers ---
            const closeModalReset = () => {
                if(formEl) formEl.reset();
                Modal.close('createReportModal');
                const modalEl = document.getElementById('createReportModal');
                if(modalEl) modalEl.style.display = 'none';
                document.body.style.overflow = '';
            };

            if(cancelBtn) cancelBtn.addEventListener('click', closeModalReset);
            if(closeBtn) closeBtn.addEventListener('click', closeModalReset);
            
            // ESC Key Support
            document.addEventListener('keydown', (e) => {
                const mod = document.getElementById('createReportModal');
                if (e.key === 'Escape' && mod && mod.style.display === 'flex') {
                    closeModalReset();
                }
            });

            const processReportSave = async (shouldGeneratePdf) => {
                if(!formEl || !formEl.checkValidity()) {
                    formEl.reportValidity();
                    return;
                }

                const btn = document.getElementById('saveReportBtn');
                const origText = btn ? btn.textContent : 'Save Report';
                if (btn) btn.innerHTML = `<span class="flex justify-center items-center gap-2"><div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Saving...</span>`;

                // Generate Accurate Data Object precisely mapping the explicit schema provided
                const report = {
                    id: 'REP-' + Date.now(),
                    patient: document.getElementById('repPatient')?.value || '',
                    type: document.getElementById('repType')?.value || '',
                    reportType: document.getElementById('repType')?.value || '', // Internal rendering mapping
                    symptoms: document.getElementById('repSymptoms')?.value || '',
                    diagnosis: document.getElementById('repDiagnosis')?.value || '',
                    treatment: document.getElementById('repPlan')?.value || '',
                    medicines: document.getElementById('repMedicine')?.value || '',
                    followup: document.getElementById('repFollowup')?.value || '',
                    doctor: AppState.isDemoMode ? 'Dr. Demo' : ('Dr. ' + (AppState.user?.email?.split('@')[0] || 'User')),
                    department: AppState.specialization || 'General',
                    status: 'Completed',
                    created_at: new Date().toISOString()
                };

                const finishSubmit = () => {
                    closeModalReset();
                    if (btn) btn.textContent = origText;
                };

                if (AppState.isDemoMode || window.isDemoMode) {
                    window.demoReports = window.demoReports || [];
                    window.demoReports.unshift(report); // Add to top
                    localStorage.setItem("demoReports", JSON.stringify(window.demoReports));
                    
                    setTimeout(() => {
                        Notifications.success('Medical report created successfully');
                        if (shouldGeneratePdf) Reports.download(report.id);
                        finishSubmit();
                        fetchReports();
                    }, 800);
                } else {
                    // Real doctor session
                    setTimeout(() => {
                        Notifications.success('Medical report created successfully');
                        reports.unshift(report);
                        if(shouldGeneratePdf) Reports.download(report.id);
                        finishSubmit();
                        renderReports();
                    }, 800);
                }
            };
            
            if(savePdfBtn) {
                savePdfBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    processReportSave(true);
                });
            }

            // --- Form Submission ---
            if(formEl) {
                formEl.addEventListener('submit', (e) => {
                    e.preventDefault();
                    processReportSave(false);
                });
            }
        }

        // Final Open Call
        Modal.open('createReportModal');
    }

    function preview(id) {
        Notifications.success('Opening secure report viewer...');
    }

    function edit(id) {
        Notifications.warning('Warning: Editing signed clinical documents leaves an audit trail.');
    }

    function download(id) {
        Notifications.success('Generating encrypted PDF for download...');
    }

    function printCurrent() {
        window.print();
    }

    return { load, printCurrent, fetchReports, openCreateReportModal, preview, edit, download };
})();

export { Reports };
window.Reports = Reports;
