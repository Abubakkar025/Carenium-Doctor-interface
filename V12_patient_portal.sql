-- CARENIUM: V12 — Patient Portal Access
-- Configures correct RLS policies for Patients to view their data

-- Enable RLS on patients table for the patient role
CREATE POLICY "Patients can view own records" ON public.patients 
FOR SELECT USING (auth.uid() = user_id);

-- Patients can view their own prescriptions
CREATE POLICY "Patients can view own prescriptions" ON public.prescriptions 
FOR SELECT USING (
   patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);

-- Note: Patients aren't allowed to create/update medical records or prescriptions
-- RLS automatically defaults to deny all other actions.

-- View to simplify Patient Data extraction
CREATE OR REPLACE VIEW public.patient_summary AS
SELECT 
    p.id, 
    p.name, 
    p.age, 
    p.gender, 
    p.blood_group, 
    p.heart_rate, 
    p.spo2, 
    p.temperature,
    p.ai_risk_score,
    (SELECT json_agg(rx) FROM public.prescriptions rx WHERE rx.patient_id = p.id) as active_prescriptions
FROM public.patients p;

GRANT SELECT ON public.patient_summary TO authenticated;
