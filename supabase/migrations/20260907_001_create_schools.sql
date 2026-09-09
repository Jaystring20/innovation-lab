-- Create schools table for STEAM Foundry registration
-- Schools register and purchase kits, with one teacher per school who creates teams

CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  address TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  division TEXT NOT NULL CHECK (division IN ('primary', 'secondary', 'sixth_form')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_schools_state ON public.schools(state);
CREATE INDEX idx_schools_division ON public.schools(division);
CREATE INDEX idx_schools_created_at ON public.schools(created_at);

-- Row Level Security
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Organizers can read/write all schools
CREATE POLICY "organizers read and write schools" ON public.schools
  FOR ALL USING (public.is_organizer()) WITH CHECK (public.is_organizer());

-- Teachers can read their own school info (will be linked via foreign key)
CREATE POLICY "teachers read their school" ON public.schools
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'teacher'
        AND profiles.school_id = schools.id
    )
  );

-- Anon users (registering) cannot access schools table
-- All school creation goes through the register-order Edge Function
