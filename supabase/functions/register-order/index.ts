import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Creates a school + order server-side, under the service role.
 *
 * The browser used to write both tables directly through PostgREST, which meant
 * the "look the price up server-side" rule was unenforceable: anyone holding the
 * publishable key could POST an order with status='dispatched' and total=1.
 * Order state is now decided here and never accepted from the caller.
 *
 * Public on purpose (no JWT): schools register without an account. Everything
 * the caller sends is treated as untrusted and validated below.
 */

const DIVISIONS = ["primary", "secondary", "sixth_form"] as const;
type Division = (typeof DIVISIONS)[number];

const EMAIL_PATTERN = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;
const MAX_TEAMS = 100;
const MAX_LEN = 200;
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

/**
 * Cryptographically secure reference. Math.random() was previously used here,
 * which is a recoverable PRNG — unacceptable for a value that is the sole
 * credential for reading an order and attaching proof of payment.
 *
 * Rejection sampling keeps the 32-char alphabet uniform: 256 % 32 === 0, so a
 * plain modulo is unbiased here, but the guard documents the intent and stays
 * correct if the alphabet ever changes length.
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

  if (!schoolName || !contactName || !contactPhone) {
    return json({ error: "Please fill in all school and contact details." }, 400);
  }
  if (!EMAIL_PATTERN.test(contactEmail)) {
    return json({ error: "Please enter a valid email address." }, 400);
  }
  if (!DIVISIONS.includes(division)) {
    return json({ error: "Please select a valid division." }, 400);
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

  // Price comes from the database, keyed on division. The caller cannot name a
  // kit or a price, so neither can be substituted.
  const { data: kit, error: kitError } = await supabase
    .from("kits")
    .select("id, unit_price")
    .eq("division", division)
    .maybeSingle();

  if (kitError || !kit) {
    console.error("Kit lookup failed:", kitError?.message);
    return json({ error: "That division is not open for registration." }, 400);
  }

  // Reuse the school when the same contact registers again, so a second order
  // does not create a duplicate record.
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

  const totalAmount = Number(kit.unit_price) * teamCount;

  // order_reference is UNIQUE; retry on the astronomically unlikely collision
  // rather than failing the school's registration.
  for (let attempt = 0; attempt < 5; attempt++) {
    const orderReference = generateOrderReference();
    const { error: orderError } = await supabase.from("orders").insert({
      school_id: schoolId,
      kit_id: kit.id,
      division,
      team_count: teamCount,
      kit_unit_price: kit.unit_price,
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
