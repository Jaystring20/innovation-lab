-- Allow schools to register for lab access without ordering a kit.
-- 'none' means there is nothing to deliver or pick up: the school registered
-- teams for the Lab but did not purchase a kit through the Store.
-- See ADR-001 (collapse the two registration pathways into one) — Store.tsx
-- now offers a "lab access only" branch alongside "order a kit", both going
-- through the same register-order Edge Function.

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_fulfilment_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_fulfilment_check
  CHECK (fulfilment IN ('delivery_lagos', 'delivery_outside', 'pickup', 'none'));
