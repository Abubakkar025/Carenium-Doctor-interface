-- =============================================
-- CARENIUM — Complete Database Setup
-- Run this ONCE in Supabase SQL Editor
-- =============================================

-- 1. PATIENTS TABLE (core)
CREATE TABLE IF NOT EXISTS public.patients (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    age INT NOT NULL,
    gender TEXT DEFAULT 'Male',
    phone TEXT,
    emergency_contact TEXT,
    address TEXT,
    blood_group TEXT DEFAULT 'O+',
    department TEXT DEFAULT 'General Medicine',
    ward TEXT DEFAULT 'General',
    room TEXT,
    bed TEXT,
    condition TEXT,
    notes TEXT,
    status TEXT DEFAULT 'stable',
    heart_rate INT DEFAULT 72,
    spo2 INT DEFAULT 98,
    temperature NUMERIC(4,1) DEFAULT 36.6,
    blood_pressure TEXT DEFAULT '120/80',
    ai_risk_score NUMERIC(4,1) DEFAULT 0,
    ailment TEXT,
    assigned_doctor UUID REFERENCES auth.users(id),
    assigned_nurse UUID REFERENCES auth.users(id),
    last_vitals_update TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. DOCTORS TABLE
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT NOT NULL,
    specialization TEXT,
    department TEXT,
    years_experience INT DEFAULT 0,
    phone TEXT,
    email TEXT,
    status TEXT DEFAULT 'off-duty',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. NURSES TABLE
CREATE TABLE IF NOT EXISTS public.nurses (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT NOT NULL,
    department TEXT,
    shift TEXT DEFAULT 'morning',
    years_experience INT DEFAULT 0,
    phone TEXT,
    email TEXT,
    status TEXT DEFAULT 'off-duty',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. DOCTOR PROFILES (specialization system)
CREATE TABLE IF NOT EXISTS public.doctor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    specialization TEXT NOT NULL,
    experience_years INT NOT NULL DEFAULT 0,
    qualification TEXT NOT NULL,
    license_number TEXT NOT NULL,
    department TEXT NOT NULL,
    unit TEXT,
    availability_schedule JSONB DEFAULT '{"monday":true,"tuesday":true,"wednesday":true,"thursday":true,"friday":true,"saturday":false,"sunday":false,"shift":"morning"}'::jsonb,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_doctor_profile_user UNIQUE (user_id)
);

-- 5. APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES auth.users(id),
    patient_id BIGINT NOT NULL REFERENCES public.patients(id),
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INT DEFAULT 30,
    status TEXT NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. PRESCRIPTIONS
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id BIGINT NOT NULL REFERENCES public.patients(id),
    doctor_id UUID NOT NULL REFERENCES auth.users(id),
    medication TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. DIAGNOSES
CREATE TABLE IF NOT EXISTS public.diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id BIGINT NOT NULL REFERENCES public.patients(id),
    doctor_id UUID NOT NULL REFERENCES auth.users(id),
    diagnosis TEXT NOT NULL,
    severity TEXT DEFAULT 'moderate',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. LAB REQUESTS
CREATE TABLE IF NOT EXISTS public.lab_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id BIGINT NOT NULL REFERENCES public.patients(id),
    doctor_id UUID NOT NULL REFERENCES auth.users(id),
    test_name TEXT NOT NULL,
    urgency TEXT DEFAULT 'routine',
    status TEXT DEFAULT 'pending',
    results JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 9. TREATMENT PLANS
CREATE TABLE IF NOT EXISTS public.treatment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id BIGINT NOT NULL REFERENCES public.patients(id),
    doctor_id UUID NOT NULL REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    entity TEXT,
    entity_id TEXT,
    old_data JSONB,
    new_data JSONB,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_patients_doctor ON public.patients(assigned_doctor);
CREATE INDEX IF NOT EXISTS idx_patients_nurse ON public.patients(assigned_nurse);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_user ON public.doctor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_spec ON public.doctor_profiles(specialization);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_schedule ON public.appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- =============================================
-- RLS POLICIES (Row Level Security)
-- =============================================

-- Patients
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can view assigned patients" ON public.patients;
CREATE POLICY "Staff can view assigned patients" ON public.patients FOR SELECT USING (
    auth.uid() = assigned_doctor OR auth.uid() = assigned_nurse
);
DROP POLICY IF EXISTS "Doctors can insert patients" ON public.patients;
CREATE POLICY "Doctors can insert patients" ON public.patients FOR INSERT WITH CHECK (
    auth.uid() = assigned_doctor
);
DROP POLICY IF EXISTS "Staff can update patients" ON public.patients;
CREATE POLICY "Staff can update patients" ON public.patients FOR UPDATE USING (
    auth.uid() = assigned_doctor OR auth.uid() = assigned_nurse
);

-- Doctors
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read all doctors" ON public.doctors;
CREATE POLICY "Read all doctors" ON public.doctors FOR SELECT USING (true);
DROP POLICY IF EXISTS "Update own doctor" ON public.doctors;
CREATE POLICY "Update own doctor" ON public.doctors FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Insert own doctor" ON public.doctors;
CREATE POLICY "Insert own doctor" ON public.doctors FOR INSERT WITH CHECK (auth.uid() = id);

-- Nurses  
ALTER TABLE public.nurses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read all nurses" ON public.nurses;
CREATE POLICY "Read all nurses" ON public.nurses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Update own nurse" ON public.nurses;
CREATE POLICY "Update own nurse" ON public.nurses FOR UPDATE USING (auth.uid() = id);

-- Doctor Profiles
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own profile read" ON public.doctor_profiles;
CREATE POLICY "own profile read" ON public.doctor_profiles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "own profile insert" ON public.doctor_profiles;
CREATE POLICY "own profile insert" ON public.doctor_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "own profile update" ON public.doctor_profiles;
CREATE POLICY "own profile update" ON public.doctor_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Doctor appointments" ON public.appointments;
CREATE POLICY "Doctor appointments" ON public.appointments FOR ALL USING (auth.uid() = doctor_id);

-- Prescriptions
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Doctor prescriptions" ON public.prescriptions;
CREATE POLICY "Doctor prescriptions" ON public.prescriptions FOR ALL USING (auth.uid() = doctor_id);

-- Diagnoses
ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Doctor diagnoses" ON public.diagnoses;
CREATE POLICY "Doctor diagnoses" ON public.diagnoses FOR ALL USING (auth.uid() = doctor_id);

-- Lab Requests
ALTER TABLE public.lab_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Doctor lab requests" ON public.lab_requests;
CREATE POLICY "Doctor lab requests" ON public.lab_requests FOR ALL USING (auth.uid() = doctor_id);

-- Treatment Plans
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Doctor treatment plans" ON public.treatment_plans;
CREATE POLICY "Doctor treatment plans" ON public.treatment_plans FOR ALL USING (auth.uid() = doctor_id);

-- Audit Logs (all authenticated users can insert)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Insert audit logs" ON public.audit_logs;
CREATE POLICY "Insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Read own audit logs" ON public.audit_logs;
CREATE POLICY "Read own audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- DONE! Your Carenium database is ready.
-- =============================================
