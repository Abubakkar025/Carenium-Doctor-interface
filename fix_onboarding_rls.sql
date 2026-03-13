-- =============================================
-- CARENIUM — FINAL ONBOARDING & AUDIT FIX
-- =============================================

-- 1. FIX AUDIT_LOGS SCHEMA
-- Add 'details' column if missing
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS details JSONB;

-- Make entity and entity_id nullable to support flexible events
ALTER TABLE public.audit_logs ALTER COLUMN entity DROP NOT NULL;
ALTER TABLE public.audit_logs ALTER COLUMN entity_id DROP NOT NULL;

-- 2. FIX DOCTORS TABLE RLS
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can insert own profile" ON public.doctors;
CREATE POLICY "Doctors can insert own profile" ON public.doctors 
FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Doctors can read all doctors" ON public.doctors;
CREATE POLICY "Doctors can read all doctors" ON public.doctors 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Doctors can update own medical profile" ON public.doctors;
CREATE POLICY "Doctors can update own medical profile" ON public.doctors 
FOR UPDATE USING (auth.uid() = id);

-- 3. FIX NURSES TABLE RLS
ALTER TABLE public.nurses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Nurses can insert own profile" ON public.nurses;
CREATE POLICY "Nurses can insert own profile" ON public.nurses 
FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Nurses can read all nurses" ON public.nurses;
CREATE POLICY "Nurses can read all nurses" ON public.nurses 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Nurses can update own medical profile" ON public.nurses;
CREATE POLICY "Nurses can update own medical profile" ON public.nurses 
FOR UPDATE USING (auth.uid() = id);

-- 4. FIX AUDIT LOGS INSERTION
-- Ensure authenticated users can log their own actions
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');
