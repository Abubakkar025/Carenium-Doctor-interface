-- ==========================================
-- CARENIUM MIGRATION V8
-- Module: Clinical Handoff (Nurse -> Doctor)
-- ==========================================

-- 1. Create the handoffs table
CREATE TABLE IF NOT EXISTS public.handoffs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    patient_name TEXT NOT NULL,
    from_staff TEXT NOT NULL,
    to_staff TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.handoffs ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Doctors and nurses can read active handoffs
CREATE POLICY "Staff can view handoffs" 
    ON public.handoffs FOR SELECT 
    TO authenticated 
    USING (true);

-- Staff can create a handoff
CREATE POLICY "Staff can create handoffs" 
    ON public.handoffs FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- Staff can update handoff status (acknowledge)
CREATE POLICY "Staff can update handoffs" 
    ON public.handoffs FOR UPDATE 
    TO authenticated 
    USING (true);

-- 4. Audit trigger integration (assuming audit_logs exist from prior migrations)
CREATE OR REPLACE FUNCTION public.trigger_audit_handoffs()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (action_type, entity, entity_id, user_id, new_data)
    VALUES (
        TG_OP,
        'handoffs',
        new.id,
        auth.uid(),
        row_to_json(NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_handoffs_audit ON public.handoffs;
CREATE TRIGGER trg_handoffs_audit
    AFTER INSERT OR UPDATE ON public.handoffs
    FOR EACH ROW EXECUTE FUNCTION public.trigger_audit_handoffs();

-- 5. Track update times automatically
CREATE TRIGGER set_handoffs_updated_at
    BEFORE UPDATE ON public.handoffs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
