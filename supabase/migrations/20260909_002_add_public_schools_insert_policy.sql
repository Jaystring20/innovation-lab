-- Add public INSERT policy for school registration
-- The register-order Edge Function needs to insert new schools during registration
-- This policy allows unauthenticated users to register schools without organizer role

-- Drop the existing restrictive "organizers read and write schools" policy for INSERT
-- since it requires is_organizer() which blocks public registration
DROP POLICY IF EXISTS "organizers read and write schools" ON public.schools;

-- Create separate policies: organizers full access, public can only insert
CREATE POLICY "organizers read and write schools" ON public.schools
  FOR SELECT USING (public.is_organizer());

CREATE POLICY "organizers update and delete schools" ON public.schools
  FOR UPDATE USING (public.is_organizer()) WITH CHECK (public.is_organizer());

CREATE POLICY "organizers delete schools" ON public.schools
  FOR DELETE USING (public.is_organizer());

-- Allow public INSERT for registration flow
CREATE POLICY "public can insert schools during registration" ON public.schools
  FOR INSERT
  WITH CHECK (true);
