-- Add public INSERT policy for school registration
-- The register-order Edge Function needs to insert new schools during registration
-- This policy allows unauthenticated users to register schools

CREATE POLICY "public can insert schools during registration" ON public.schools
  FOR INSERT
  WITH CHECK (true);
