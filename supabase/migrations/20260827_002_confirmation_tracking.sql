-- Tracks when a confirmation was last emailed for an order. Used to stop the
-- public confirmation endpoint being used to mail-bomb a school's inbox.
alter table public.orders
  add column if not exists confirmation_sent_at timestamptz;

-- Recovery lookups hit contact_email; without this they are a full table scan.
create index if not exists schools_contact_email_idx
  on public.schools (lower(contact_email));
