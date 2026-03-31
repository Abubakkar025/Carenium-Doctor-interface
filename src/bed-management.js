/* =============================================
   CARENIUM — Bed Management Module
   Visual Ward & Occupancy Tracker
   ============================================= */

const BedManagement = (() => {

    function render() {
        const content = document.getElementById('dashboardContent');
        if (!content) return;

        content.innerHTML = `
            <div class="fade-in" style="padding: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
                   <div>
                      <h2 style="font-size: 1.5rem; font-weight: 900; color: #fff; margin: 0;">Bed Management</h2>
                      <p style="font-size: 10px; opacity: 0.4; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">Live Ward Availability Map</p>
                   </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                   <div class="glass-card p-6 border border-white/5 rounded-2xl relative overflow-hidden group">
                      <div class="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors"></div>
                      <h4 class="font-black text-[10px] uppercase tracking-widest opacity-50 mb-2">Total Capacity</h4>
                      <div class="flex items-end gap-3"><span class="text-4xl font-black text-indigo-400">120</span><span class="text-xs opacity-50 mb-1">Beds</span></div>
                   </div>
                   <div class="glass-card p-6 border border-white/5 rounded-2xl relative overflow-hidden group">
                      <div class="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors"></div>
                      <h4 class="font-black text-[10px] uppercase tracking-widest opacity-50 mb-2">Available Now</h4>
                      <div class="flex items-end gap-3"><span class="text-4xl font-black text-emerald-400" id="availableBedsCount">24</span><span class="text-xs opacity-50 mb-1">Beds</span></div>
                   </div>
                   <div class="glass-card p-6 border border-white/5 rounded-2xl relative overflow-hidden group">
                      <div class="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors"></div>
                      <h4 class="font-black text-[10px] uppercase tracking-widest opacity-50 mb-2">Needs Cleaning</h4>
                      <div class="flex items-end gap-3"><span class="text-4xl font-black text-amber-400">5</span><span class="text-xs opacity-50 mb-1">Beds</span></div>
                   </div>
                </div>

                <!-- WARDS -->
                <div id="wardsMap" class="flex flex-col gap-6"></div>
            </div>
        `;

        loadWards();
    }

    function loadWards() {
        // Mock data
        const wards = [
           { id: 'w1', name: 'General Ward A', capacity: 20, occupied: 18, cleaning: 1 },
           { id: 'w2', name: 'ICU', capacity: 12, occupied: 11, cleaning: 0 },
           { id: 'w3', name: 'Pediatrics', capacity: 15, occupied: 8, cleaning: 2 }
        ];

        const container = document.getElementById('wardsMap');
        if (!container) return;

        container.innerHTML = wards.map(w => {
            const avail = w.capacity - w.occupied - w.cleaning;
            
            // Generate bed dots
            let dots = '';
            for(let i=0; i<w.capacity; i++) {
                let status = 'available';
                let colorClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]';
                
                if (i < w.occupied) {
                    status = 'occupied';
                    colorClass = 'bg-red-500/20 text-red-500 border-red-500/30';
                } else if (i < w.occupied + w.cleaning) {
                    status = 'cleaning';
                    colorClass = 'bg-amber-500/20 text-amber-500 border-amber-500/30';
                }

                dots += `
                    <div class="w-10 h-10 rounded-xl border flex flex-col items-center justify-center transition-all hover:scale-105 cursor-pointer ${colorClass}" title="Bed ${i+1} - ${status}">
                        <span class="text-[8px] font-black tracking-widest uppercase opacity-70">B${i+1}</span>
                    </div>
                `;
            }

            return `
                <div class="glass-card p-6 border border-white/5 rounded-2xl">
                   <div class="flex justify-between items-center mb-6">
                      <div class="flex items-center gap-3">
                         <div class="w-3 h-3 rounded-full ${avail > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}"></div>
                         <h3 class="font-bold text-sm tracking-wide">${w.name}</h3>
                      </div>
                      <div class="text-[10px] font-black uppercase tracking-widest opacity-40">
                         ${avail} Free / ${w.capacity} Total
                      </div>
                   </div>
                   <div class="flex flex-wrap gap-2">
                       ${dots}
                   </div>
                </div>
            `;
        }).join('');
    }

    return { render };
})();

export { BedManagement };
window.BedManagement = BedManagement;
