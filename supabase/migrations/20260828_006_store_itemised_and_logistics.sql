-- Itemised store + logistics.
--
-- Schools now pick which components they want (the microcontroller board is
-- always included so every team can build the standardized project) and choose
-- a fulfilment method. The per-team kit price and the order total are computed
-- server-side from these rows in register-order — the browser never sends a
-- price. bom item shape is { component, qty, unit_price, required }.
--
-- kits.unit_price is the full-kit price (every line included). Prices are the
-- 2026 competition component list.

update public.kits set
  name = 'Smart Farm Bot + LED Interface',
  unit_price = 60050,
  bom = '[
    {"component":"ESP32 38-Pin Type-C Development Board","qty":1,"unit_price":16000,"required":true},
    {"component":"USB Type-C Data/Programming Cable","qty":1,"unit_price":3500,"required":false},
    {"component":"DHT11 Temperature & Humidity Sensor","qty":1,"unit_price":2000,"required":false},
    {"component":"LDR/Photoresistor Light Sensor","qty":1,"unit_price":1100,"required":false},
    {"component":"Water-Level Sensor","qty":1,"unit_price":3500,"required":false},
    {"component":"Water-Flow Sensor","qty":1,"unit_price":5500,"required":false},
    {"component":"5V DC Water Pump","qty":1,"unit_price":6600,"required":false},
    {"component":"1-Channel Relay Module","qty":1,"unit_price":3400,"required":false},
    {"component":"Mini DC Fan","qty":1,"unit_price":4500,"required":false},
    {"component":"LED Grow Light","qty":1,"unit_price":1000,"required":false},
    {"component":"Active Buzzer","qty":1,"unit_price":1450,"required":false},
    {"component":"Red LED","qty":1,"unit_price":1100,"required":false},
    {"component":"Green LED","qty":1,"unit_price":1100,"required":false},
    {"component":"Yellow/Blue LED","qty":1,"unit_price":1100,"required":false},
    {"component":"400-Hole Mini Breadboard","qty":1,"unit_price":3200,"required":false},
    {"component":"Packaging","qty":1,"unit_price":5000,"required":false}
  ]'::jsonb
where division = 'primary';

update public.kits set
  name = 'Smart Energy Bot',
  unit_price = 63100,
  bom = '[
    {"component":"ESP32 Development Board – 38 Pin Type-C","qty":1,"unit_price":16000,"required":true},
    {"component":"ZMPT101B AC Voltage Sensor","qty":1,"unit_price":6500,"required":false},
    {"component":"ACS712 20A Current Sensor","qty":1,"unit_price":4800,"required":false},
    {"component":"16x2 LCD + I2C Module","qty":1,"unit_price":7500,"required":false},
    {"component":"Push Button Tact Switch Module","qty":1,"unit_price":2100,"required":false},
    {"component":"MB-102 830-Point Breadboard","qty":1,"unit_price":3200,"required":false},
    {"component":"400-Hole Mini Breadboard","qty":2,"unit_price":2500,"required":false},
    {"component":"Jumper Wire Set (M-M/M-F/F-F)","qty":1,"unit_price":6000,"required":false},
    {"component":"5V USB Power Supply","qty":1,"unit_price":4500,"required":false},
    {"component":"USB Type-C Cable","qty":1,"unit_price":2500,"required":false},
    {"component":"Packaging","qty":1,"unit_price":5000,"required":false}
  ]'::jsonb
where division = 'secondary';

update public.kits set
  name = 'ESP32-CAM Smart Security Bot',
  unit_price = 64400,
  bom = '[
    {"component":"ESP32-CAM with OV2640 Camera","qty":1,"unit_price":24000,"required":true},
    {"component":"ESP32-CAM MB USB Programming Board","qty":1,"unit_price":5000,"required":false},
    {"component":"HC-SR501 PIR Motion Sensor","qty":1,"unit_price":3000,"required":false},
    {"component":"830-Point Solderless Breadboard","qty":1,"unit_price":4500,"required":false},
    {"component":"140-Piece Mixed Jumper Wire Set","qty":1,"unit_price":7000,"required":false},
    {"component":"LM2596 DC-DC Buck Converter","qty":1,"unit_price":3800,"required":false},
    {"component":"18650 Li-ion Battery","qty":2,"unit_price":4000,"required":false},
    {"component":"18650 Battery Holder","qty":1,"unit_price":2100,"required":false},
    {"component":"Packaging / Student Kit Case & Labelling","qty":1,"unit_price":5000,"required":false},
    {"component":"JST/Power Connector Set","qty":1,"unit_price":2000,"required":false}
  ]'::jsonb
where division = 'sixth_form';

-- Logistics fees, editable by an organizer without a redeploy.
create table public.store_settings (
  id                         int primary key default 1 check (id = 1),
  lagos_delivery_fee         numeric not null default 10000,
  outside_lagos_delivery_fee numeric not null default 20000,
  pickup_enabled             boolean not null default true,
  pickup_location            text not null default 'A pickup address in Lagos will be sent with your payment confirmation.',
  updated_at                 timestamptz not null default now()
);
insert into public.store_settings (id) values (1);

alter table public.store_settings enable row level security;
create policy "anyone can read store settings" on public.store_settings
  for select using (true);
create policy "organizers change store settings" on public.store_settings
  for all using (public.is_organizer()) with check (public.is_organizer());

-- Orders carry the itemised snapshot + how they are fulfilled.
alter table public.orders
  add column if not exists line_items   jsonb,
  add column if not exists fulfilment   text
    check (fulfilment in ('delivery_lagos','delivery_outside','pickup')),
  add column if not exists delivery_fee numeric not null default 0;

-- Expose the new fields to the account-less order-status page.
drop function if exists public.get_order_status(text);
create function public.get_order_status(ref text)
returns table (
  order_reference text,
  division        text,
  team_count      integer,
  kit_unit_price  numeric,
  delivery_fee    numeric,
  total_amount    numeric,
  fulfilment      text,
  line_items      jsonb,
  status          text,
  created_at      timestamptz,
  paid_at         timestamptz,
  dispatched_at   timestamptz
) language sql stable security definer set search_path = public as $$
  select order_reference, division, team_count, kit_unit_price, delivery_fee,
         total_amount, fulfilment, line_items, status, created_at, paid_at,
         dispatched_at
  from orders
  where order_reference = ref;
$$;
grant execute on function public.get_order_status(text) to anon, authenticated;
