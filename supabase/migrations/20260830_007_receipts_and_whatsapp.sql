-- Payment receipts + WhatsApp confirmation channel + payment-based dispatch copy.
--
-- Dispatch is no longer tied to Stage 1 approval — every registered school
-- qualifies to receive a kit. Kits ship once payment is confirmed: 3–5 working
-- days within Lagos, 5–7 days elsewhere. The exact wording lives in
-- store_settings so an organizer can adjust it without a redeploy.

alter table public.orders
  add column if not exists whatsapp_pinged_at timestamptz,
  add column if not exists receipt_sent_at    timestamptz;

alter table public.store_settings
  add column if not exists whatsapp_number       text not null default '2348038838094',
  add column if not exists dispatch_note_lagos   text not null default '3–5 working days after payment is confirmed',
  add column if not exists dispatch_note_outside text not null default '5–7 working days after payment is confirmed';

-- The order-status page has no account, so the school flags "I've messaged
-- WhatsApp" through this. It only stamps a timestamp on a row the caller
-- already has the reference for — it returns void whether or not the row
-- exists, so it can't be used to probe which references are valid.
create or replace function public.mark_whatsapp_pinged(ref text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.orders
  set whatsapp_pinged_at = now()
  where order_reference = ref and whatsapp_pinged_at is null;
end $$;
grant execute on function public.mark_whatsapp_pinged(text) to anon, authenticated;

-- get_order_status also returns whatsapp_pinged_at so the page can confirm
-- the ping was recorded.
drop function if exists public.get_order_status(text);
create function public.get_order_status(ref text)
returns table (
  order_reference    text,
  division           text,
  team_count         integer,
  kit_unit_price     numeric,
  delivery_fee       numeric,
  total_amount       numeric,
  fulfilment         text,
  line_items         jsonb,
  status             text,
  created_at         timestamptz,
  paid_at            timestamptz,
  dispatched_at      timestamptz,
  whatsapp_pinged_at timestamptz
) language sql stable security definer set search_path = public as $$
  select order_reference, division, team_count, kit_unit_price, delivery_fee,
         total_amount, fulfilment, line_items, status, created_at, paid_at,
         dispatched_at, whatsapp_pinged_at
  from orders
  where order_reference = ref;
$$;
grant execute on function public.get_order_status(text) to anon, authenticated;
