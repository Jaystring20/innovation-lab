-- register-order's generateOrderReference() was generating 7 random
-- characters, but this policy (and the REF_PATTERN validators in the
-- send-order-confirmation / send-payment-receipt Edge Functions) expected
-- exactly 6. Every order reference issued since 20260827_003 has therefore
-- been rejected by this policy on upload, with "new row violates row-level
-- security policy" — payment proofs could never be attached, and the
-- confirmation email silently failed its own pattern check.
--
-- The generator now produces 6 characters again (matching the length this
-- policy was written for), but existing orders already carry 7-character
-- references. Accept both lengths so those orders aren't orphaned by the
-- fix.
drop policy if exists "public can upload payment proof" on storage.objects;
create policy "public can upload payment proof" on storage.objects
  for insert to public
  with check (
    bucket_id = 'payment-proofs'
    and name ~ '^APEN-[A-Z0-9]{6,7}/[^/]+$'
  );
