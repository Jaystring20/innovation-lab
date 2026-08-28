import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Creates a school + order server-side, under the service role.
 *
 * Every price is decided here from the `kits` and `store_settings` rows. The
 * caller may say which optional components to drop and how the kit is
 * fulfilled, but the per-team price, the delivery fee and the total are all
 * recomputed — a tampered client total is ignored.
 *
 * Public on purpose (no JWT): schools register without an account.
 */

const DIVISIONS = ["primary", "secondary", "sixth_form"] as const;
type Division = (typeof DIVISIONS)[number];

const FULFILMENTS = ["delivery_lagos", "delivery_outside", "pickup"] as const;
type Fulfilment = (typeof FULFILMENTS)[number];

const EMAIL_PATTERN = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;
const MAX_TEAMS = 100;
const MAX_LEN = 200;
const MAX_EXCLUDED = 50;
const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

interface BomItem {
  component: string;
  qty: number;
  unit_price: number;
  required: boolean;
}

/**
 * Cryptographically secure reference. Math.random() was previously used here,
 * which is a recoverable PRNG — unacceptable for a value that is the sole
 * credential for reading an order and attaching proof of payment.
 */
function generateOrderReference(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const limit = 256 - (256 % REF_ALPHABET.length);
  let code = "";
  for (let i = 0; i < bytes.length; i++) {
    let b = bytes[i];
    while (b >= limit) {
      const extra = new Uint8Array(1);
      crypto.getRandomValues(extra);
      b = extra[0];
    }
    code += REF_ALPHABET[b % REF_ALPHABET.length];
  }
  return `APEN-${code}`;
}

function clean(v: unknown): string {
  return String(v ?? "").trim().slice(0, MAX_LEN);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const schoolName = clean(body.schoolName);
  const state = clean(body.state);
  const contactName = clean(body.contactName);
  const contactEmail = clean(body.contactEmail).toLowerCase();
  const contactPhone = clean(body.contactPhone);
  const division = clean(body.division) as Division;
  const teamCount = Number(body.teamCount);
  const fulfilment = clean(body.fulfilment) as Fulfilment;

  const excludedComponents = Array.isArray(body.excludedComponents)
    ? (body.excludedComponents as unknown[])
        .map((c) => String(c ?? "").trim())
        .filter(Boolean)
        .slice(0, MAX_EXCLUDED)
    : [];

  if (!schoolName || !contactName || !contactPhone) {
    return json({ error: "Please fill in all school and contact details." }, 400);
  }
  if (!EMAIL_PATTERN.test(contactEmail)) {
    return json({ error: "Please enter a valid email address." }, 400);
  }
  if (!DIVISIONS.includes(division)) {
    return json({ error: "Please select a valid division." }, 400);
  }
  if (!FULFILMENTS.includes(fulfilment)) {
    return json({ error: "Please choose how you want the kit delivered." }, 400);
  }
  if (!Number.isInteger(teamCount) || teamCount < 1 || teamCount > MAX_TEAMS) {
    return json(
      { error: `Number of teams must be a whole number between 1 and ${MAX_TEAMS}.` },
      400,
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data: kit, error: kitError } = await supabase
    .from("kits")
    .select("id, bom")
    .eq("division", division)
    .maybeSingle();

  if (kitError || !kit) {
    console.error("Kit lookup failed:", kitError?.message);
    return json({ error: "That division is not open for registration." }, 400);
  }

  const bom = (kit.bom ?? []) as BomItem[];
  const excludedSet = new Set(excludedComponents);

  // Required items are always in. Optional items are in unless excluded.
  const lineItems = bom.map((item) => {
    const included = item.required || !excludedSet.has(item.component);
    return {
      component: item.component,
      qty: Number(item.qty) || 0,
      unit_price: Number(item.unit_price) || 0,
      included,
    };
  });

  const kitUnitPrice = lineItems
    .filter((i) => i.included)
    .reduce((sum, i) => sum + i.qty * i.unit_price, 0);

  if (kitUnitPrice <= 0) {
    return json({ error: "Your kit selection has no items in it." }, 400);
  }

  const { data: settings } = await supabase
    .from("store_settings")
    .select("lagos_delivery_fee, outside_lagos_delivery_fee, pickup_enabled")
    .eq("id", 1)
    .maybeSingle();

  const lagosFee = Number(settings?.lagos_delivery_fee ?? 10000);
  const outsideFee = Number(settings?.outside_lagos_delivery_fee ?? 20000);
  const pickupEnabled = settings?.pickup_enabled ?? true;

  if (fulfilment === "pickup" && !pickupEnabled) {
    return json({ error: "Pickup is not available right now." }, 400);
  }

  const deliveryFee =
    fulfilment === "pickup"
      ? 0
      : fulfilment === "delivery_lagos"
        ? lagosFee
        : outsideFee;

  const totalAmount = kitUnitPrice * teamCount + deliveryFee;

  // Reuse the school when the same contact registers again.
  const { data: existing } = await supabase
    .from("schools")
    .select("id")
    .ilike("contact_email", contactEmail)
    .maybeSingle();

  let schoolId = existing?.id as string | undefined;

  if (schoolId) {
    await supabase
      .from("schools")
      .update({
        name: schoolName,
        state: state || null,
        contact_name: contactName,
        contact_phone: contactPhone,
        division,
      })
      .eq("id", schoolId);
  } else {
    const { data: created, error: schoolError } = await supabase
      .from("schools")
      .insert({
        name: schoolName,
        state: state || null,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        division,
      })
      .select("id")
      .single();
    if (schoolError || !created) {
      console.error("School insert failed:", schoolError?.message);
      return json({ error: "Could not register your school. Please try again." }, 500);
    }
    schoolId = created.id;
  }

  // order_reference is UNIQUE; retry on the astronomically unlikely collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const orderReference = generateOrderReference();
    const { error: orderError } = await supabase.from("orders").insert({
      school_id: schoolId,
      kit_id: kit.id,
      division,
      team_count: teamCount,
      kit_unit_price: kitUnitPrice,
      delivery_fee: deliveryFee,
      fulfilment,
      line_items: lineItems,
      total_amount: totalAmount,
      status: "registered", // never accepted from the caller
      order_reference: orderReference,
    });

    if (!orderError) return json({ orderReference });
    if (orderError.code !== "23505") {
      console.error("Order insert failed:", orderError.message);
      return json({ error: "Could not create your order. Please try again." }, 500);
    }
  }

  return json({ error: "Could not allocate an order reference. Please try again." }, 500);
});
