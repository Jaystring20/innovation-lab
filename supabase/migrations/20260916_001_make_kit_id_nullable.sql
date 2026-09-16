-- Make kit_id nullable in orders table
-- Schools can register for lab access without purchasing a kit
-- This allows registration-only orders without a kit

ALTER TABLE public.orders
  ALTER COLUMN kit_id DROP NOT NULL;

COMMENT ON COLUMN public.orders.kit_id IS 'Optional: Kit purchased with this order. Schools can register for lab access without a kit.';
