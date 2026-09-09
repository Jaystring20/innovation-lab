-- Add missing school_id column to profiles table
-- This column is referenced in multiple policies and the register-order Edge Function
-- but was never created in the initial schema

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL;

-- Create index for faster lookups by school
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON public.profiles(school_id);

-- Add comment explaining the relationship
COMMENT ON COLUMN public.profiles.school_id IS 'Foreign key to the school where this teacher works. Teachers are linked to exactly one school.';
