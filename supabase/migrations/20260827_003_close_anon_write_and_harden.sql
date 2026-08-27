-- Security audit remediation. See .gstack/security-reports/ for the findings.

-- FINDING 2 (CRITICAL): orders/schools INSERT were with_check(true), so anyone
-- holding the publishable key could POST an order with status='dispatched' and
-- total_amount=1. Registration now runs in the register-order Edge Function
-- under the service role, which sets status and price itself, so the browser
-- no longer needs write access to either table.
drop policy if exists "public can create order"    on public.orders;
drop policy if exists "public can register school" on public.schools;

-- FINDING 8: bound team_count in the database, not just in the UI.
alter table public.orders drop constraint if exists orders_team_count_check;
alter table public.orders
  add constraint orders_team_count_check check (team_count between 1 and 100);

-- Dedupe key for the Edge Function's school lookup (FINDING 7).
create unique index if not exists schools_contact_email_key
  on public.schools (lower(contact_email));
drop index if exists schools_contact_email_idx;

-- FINDING 5: throttle the recovery email the way confirmations already are.
alter table public.schools
  add column if not exists recovery_sent_at timestamptz;

-- FINDING 6: submit_payment_proof wrote a caller-supplied path with no checks,
-- which let an attacker attach their own file to someone else's order.
create or replace function public.submit_payment_proof(ref text, proof_path text)
returns void language plpgsql security definer set search_path = public as $$
declare
  target public.orders%rowtype;
begin
  select * into target from orders where order_reference = ref;
  if not found then
    return; -- never disclose whether a reference exists
  end if;

  if proof_path is null or proof_path not like ref || '/%' then
    raise exception 'Proof path must be stored under this order reference.'
      using errcode = '22023';
  end if;

  if not exists (
    select 1 from storage.objects
    where bucket_id = 'payment-proofs' and name = proof_path
  ) then
    raise exception 'No uploaded file found at that path.' using errcode = '22023';
  end if;

  update orders
  set proof_of_payment_url = proof_path,
      payment_method = 'bank_transfer',
      status = case when status = 'registered' then 'payment_pending' else status end
  where order_reference = ref;
end;
$$;

-- FINDING 3: the bucket had no size limit and no MIME allowlist, and the policy
-- checked only bucket_id, so anon could write any file to any path.
update storage.buckets
set file_size_limit = 5242880, -- 5 MB
    allowed_mime_types = array['image/jpeg','image/png','image/webp','image/heic','application/pdf']
where id = 'payment-proofs';

drop policy if exists "public can upload payment proof" on storage.objects;
create policy "public can upload payment proof" on storage.objects
  for insert to public
  with check (
    bucket_id = 'payment-proofs'
    and name ~ '^APEN-[A-Z0-9]{6}/[^/]+$'
  );
