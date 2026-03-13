const DemoData = (() => {
    const STORAGE_KEY = 'carenium_demo_store';
    
    const INITIAL_PATIENTS = [
        { id: 'p1', patient_id: 'PID-CARTER-01', name: 'John Carter', age: 45, gender: 'Male', condition: 'Acute Myocardial Infarction', department: 'Cardiology', ward: 'ICU', room: '101', status: 'critical', heart_rate: 112, spo2: 89, temperature: 38.2, admission_time: new Date(Date.now() - 86400000).toISOString() },
        { id: 'p2', patient_id: 'PID-LOPEZ-02', name: 'Maria Lopez', age: 32, gender: 'Female', condition: 'Multiple Sclerosis Flare', department: 'Neurology', ward: 'Ward 3', room: '305', status: 'stable', heart_rate: 72, spo2: 98, temperature: 36.6, admission_time: new Date(Date.now() - 172800000).toISOString() },
        { id: 'p3', patient_id: 'PID-CHEN-03', name: 'David Chen', age: 54, gender: 'Male', condition: 'Post-Op Hip Replacement', department: 'Orthopedics', ward: 'Main', room: '204', status: 'stable', heart_rate: 80, spo2: 97, temperature: 37.0, admission_time: new Date(Date.now() - 43200000).toISOString() },
        { id: 'p4', patient_id: 'PID-PATEL-04', name: 'Sarah Patel', age: 28, gender: 'Female', condition: 'Type 1 Diabetes Management', department: 'Pediatrics', ward: 'Ward 5', room: '512', status: 'stable', heart_rate: 75, spo2: 99, temperature: 36.4, admission_time: new Date(Date.now() - 259200000).toISOString() }
    ];

    const todayDate = new Date();
    const todayDateStr = todayDate.toLocaleDateString();

    const INITIAL_APPOINTMENTS = [
        { id: 'APT-1001', patient: 'John Carter', doctor: 'Dr. Demo', department: 'Cardiology', time: '09:30 AM', status: 'Confirmed', date_sort: `${todayDateStr} 09:30 AM` },
        { id: 'APT-1002', patient: 'Maria Lopez', doctor: 'Dr. Demo', department: 'Neurology', time: '10:00 AM', status: 'Waiting', date_sort: `${todayDateStr} 10:00 AM` },
        { id: 'APT-1003', patient: 'David Lee', doctor: 'Dr. Demo', department: 'Orthopedics', time: '11:15 AM', status: 'Completed', date_sort: `${todayDateStr} 11:15 AM` },
        { id: 'APT-1004', patient: 'Ahmed Khan', doctor: 'Dr. Demo', department: 'Pediatrics', time: '12:00 PM', status: 'Cancelled', date_sort: `${todayDateStr} 12:00 PM` }
    ];
    const INITIAL_REPORTS = [
        {
            id: "REP-1001",
            patient: "John Carter",
            reportType: "Lab Report",
            doctor: "Dr Demo",
            department: "Cardiology",
            date: "2026-03-10",
            status: "Completed"
        },
        {
            id: "REP-1002",
            patient: "Maria Lopez",
            reportType: "Diagnosis Report",
            doctor: "Dr Demo",
            department: "Neurology",
            date: "2026-03-11",
            status: "Pending"
        },
        {
            id: "REP-1003",
            patient: "David Lee",
            reportType: "Prescription",
            doctor: "Dr Demo",
            department: "Cardiology",
            date: "2026-03-12",
            status: "Completed"
        }
    ];

    let state = {
        patients: [...INITIAL_PATIENTS],
        appointments: [...INITIAL_APPOINTMENTS],
        reports: [...INITIAL_REPORTS],
        auditLogs: [],
        vitalsInterval: null
    };

    function save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            patients: state.patients,
            appointments: state.appointments,
            reports: state.reports,
            auditLogs: state.auditLogs
        }));
        // Update explicit Demo bindings dynamically required by the user
        window.demoPatients = state.patients;
        window.demoAppointments = state.appointments;
        window.demoReports = state.reports;
    }

    function loadFromStorage() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                state.patients = parsed.patients || [...INITIAL_PATIENTS];
                state.appointments = parsed.appointments || [...INITIAL_APPOINTMENTS];
                state.reports = parsed.reports || [...INITIAL_REPORTS];
                state.auditLogs = parsed.auditLogs || [];
            } catch (e) {
                console.error("DemoData: Failed to parse storage.", e);
            }
        }
        // Always bind explicitly natively
        window.demoPatients = state.patients;
        window.demoAppointments = state.appointments;
        window.demoReports = state.reports;
    }

    function init(onUpdate) {
        loadFromStorage();
        if (state.vitalsInterval) clearInterval(state.vitalsInterval);

        state.vitalsInterval = setInterval(() => {
            state.patients = state.patients.map(p => {
                if (p.status === 'discharged') return p;
                
                const hrDiff = Math.floor(Math.random() * 5) - 2;
                const o2Diff = Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0;
                const riskDiff = Math.floor(Math.random() * 3) - 1;

                let newHR = (p.heart_rate || 75) + hrDiff;
                let newO2 = (p.spo2 || 98) + o2Diff;
                let newRisk = (p.ai_risk_score || 20) + riskDiff;

                newHR = Math.max(40, Math.min(180, newHR));
                newO2 = Math.max(80, Math.min(100, newO2));
                newRisk = Math.max(5, Math.min(99, newRisk));

                let newStatus = p.status;
                if (newO2 < 90 || newRisk > 85) newStatus = 'critical';
                else if (newO2 < 94 || newHR > 110 || newRisk > 60) newStatus = 'warning';
                else if (p.status !== 'admitted') newStatus = 'stable';

                return { ...p, heart_rate: newHR, spo2: newO2, ai_risk_score: newRisk, status: newStatus, last_vitals_update: new Date().toISOString() };
            });
            
            save();
            if (onUpdate) onUpdate(state.patients);
        }, 5000);
    }

    return {
        init,
        getPatients: () => state.patients,
        getAppointments: () => state.appointments,
        getReports: () => state.reports,
        getAuditLogs: () => state.auditLogs,
        
        admitPatient: (data) => {
            const newPatient = {
                ...data,
                id: 'p-' + Math.random().toString(36).substr(2, 9),
                heart_rate: 75,
                spo2: 98,
                temperature: 36.6,
                created_at: new Date().toISOString()
            };
            state.patients.unshift(newPatient);
            save();
            return { success: true, data: newPatient };
        },

        updatePatient: (id, updates) => {
            const idx = state.patients.findIndex(p => p.id === id);
            if (idx !== -1) {
                state.patients[idx] = { ...state.patients[idx], ...updates };
                save();
                return { success: true };
            }
            return { success: false, message: 'Patient not found' };
        },

        addAppointment: (data) => {
            const newAppt = {
                ...data,
                id: 'a-' + Math.random().toString(36).substr(2, 9),
                created_at: new Date().toISOString()
            };
            state.appointments.push(newAppt);
            save();
            return { success: true, data: newAppt };
        },

        logAction: (data) => {
            const newLog = { ...data, id: Date.now(), created_at: new Date().toISOString() };
            state.auditLogs.unshift(newLog);
            if (state.auditLogs.length > 50) state.auditLogs.pop();
            save();
            return { success: true };
        },

        resetData: () => {
            state.patients = [...INITIAL_PATIENTS];
            state.appointments = [...INITIAL_APPOINTMENTS];
            state.reports = [...INITIAL_REPORTS];
            state.auditLogs = [];
            
            // Clean exactly defined memory banks
            window.demoPatients = state.patients;
            window.demoAppointments = state.appointments;
            window.demoReports = state.reports;
            
            localStorage.setItem("demoPatients", JSON.stringify(state.patients));
            localStorage.setItem("demoAppointments", JSON.stringify(state.appointments));
            localStorage.setItem("demoReports", JSON.stringify(state.reports));
            localStorage.removeItem(STORAGE_KEY);
            return { success: true };
        }
    };
})();

export { DemoData };
window.DemoData = DemoData;


