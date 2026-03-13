/* =============================================
   CARENIUM — Demo Data Engine
   Realistic medical simulations for Demo Mode.
   ============================================= */

const DemoData = (() => {
    let patients = [
        { id: 'p1', name: 'John Doe', age: 45, status: 'stable', heart_rate: 72, spo2: 98, temperature: 36.6, ward: 'Cardiology', notes: 'Recovering from minor arrhythmia.' },
        { id: 'p2', name: 'Jane Smith', age: 32, status: 'warning', heart_rate: 105, spo2: 94, temperature: 38.2, ward: 'ICU', notes: 'Observing post-surgery fever.' },
        { id: 'p3', name: 'Robert Brown', age: 67, status: 'critical', heart_rate: 120, spo2: 88, temperature: 37.5, ward: 'ICU', notes: 'Respiratory distress. Ventilator support.' },
        { id: 'p4', name: 'Sarah Wilson', age: 28, status: 'stable', heart_rate: 68, spo2: 99, temperature: 36.4, ward: 'Maternity', notes: 'Routine obstetric observation.' },
        { id: 'p5', name: 'Michael Chen', age: 54, status: 'stable', heart_rate: 80, spo2: 97, temperature: 36.8, ward: 'Neurology', notes: 'Stable following concussion.' },
        { id: 'p6', name: 'Emily Davis', age: 71, status: 'warning', heart_rate: 92, spo2: 92, temperature: 37.9, ward: 'General', notes: 'Chronic obstructive pulmonary disease.' },
        { id: 'p7', name: 'David Miller', age: 39, status: 'stable', heart_rate: 75, spo2: 98, temperature: 36.7, ward: 'Orthopedics', notes: 'Post-op physical therapy.' },
        { id: 'p8', name: 'Lisa Garcia', age: 48, status: 'stable', heart_rate: 78, spo2: 96, temperature: 37.0, ward: 'General', notes: 'Diabetes management.' }
    ];

    let staff = [
        { id: 'demo-u-001', full_name: 'Dr. Demo', role: 'doctor', department: 'Cardiology', status: 'on-duty' },
        { id: 'demo-u-002', full_name: 'Nurse Demo', role: 'nurse', department: 'ICU', status: 'on-duty' }
    ];

    let intervalId = null;

    function init(onUpdate) {
        if (intervalId) clearInterval(intervalId);

        intervalId = setInterval(() => {
            patients = patients.map(p => {
                // Randomly fluctuate vitals
                const hrDiff = Math.floor(Math.random() * 5) - 2;
                const o2Diff = Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0;

                let newHR = p.heart_rate + hrDiff;
                let newO2 = p.spo2 + o2Diff;

                // Keep within realistic bounds
                newHR = Math.max(40, Math.min(180, newHR));
                newO2 = Math.max(80, Math.min(100, newO2));

                // Random status change
                let newStatus = p.status;
                if (newO2 < 90) newStatus = 'critical';
                else if (newO2 < 94 || newHR > 110) newStatus = 'warning';
                else newStatus = 'stable';

                return { ...p, heart_rate: newHR, spo2: newO2, status: newStatus };
            });

            if (onUpdate) onUpdate(patients);
        }, 5000);
    }

    return {
        getPatients: () => patients,
        getStaff: () => staff,
        init
    };
})();

// Register globally
window.DemoData = DemoData;

