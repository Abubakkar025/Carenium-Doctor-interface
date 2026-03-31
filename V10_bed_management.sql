-- CARENIUM: V10 — Bed Management Module
-- Creates wards and beds tables for real-time tracking

CREATE TABLE IF NOT EXISTS public.wards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    capacity INT NOT NULL,
    type TEXT CHECK (type IN ('ICU', 'General', 'Emergency', 'Pediatrics')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.beds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ward_id UUID REFERENCES public.wards(id) ON DELETE CASCADE,
    bed_number VARCHAR(10) NOT NULL,
    status TEXT CHECK (status IN ('available', 'occupied', 'cleaning', 'maintenance')) DEFAULT 'available',
    current_patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    last_cleaned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ward_id, bed_number)
);

-- Enable RLS
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;

-- Staff can view wards and beds
CREATE POLICY "Staff can view wards" ON public.wards FOR SELECT USING (true);
CREATE POLICY "Staff can view beds" ON public.beds FOR SELECT USING (true);

-- Only authenticated users (doctors/nurses) can update bed status
CREATE POLICY "Staff can update beds" ON public.beds FOR UPDATE USING (auth.role() = 'authenticated');

-- Insert Initial Demo Wards
INSERT INTO public.wards (name, capacity, type) VALUES
('General Ward A', 20, 'General'),
('Intensive Care Unit', 12, 'ICU'),
('Emergency Room', 10, 'Emergency')
ON CONFLICT DO NOTHING;
