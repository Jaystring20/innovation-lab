import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Emails a school an official receipt once an organizer confirms their payment.
 *
 * Organizer-only. verify_jwt is off so the CORS preflight and a clean 401 are
 * handled here, but the caller's JWT is verified below and checked against
 * public.profiles before the service-role client (which bypasses RLS) does
 * anything.
 *
 * The order must already be `paid`. A 1-hour cooldown on receipt_sent_at stops
 * a double-click sending two receipts.
 */

const REF_PATTERN = /^APEN-[A-Z0-9]{6}$/;
const COOLDOWN_MS = 60 * 60 * 1000;

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

const naira = (n: number) =>
  "NGN " + Number(n).toLocaleString("en-NG", { maximumFractionDigits: 0 });

const DIVISIONS: Record<string, string> = {
  primary: "Primary School (Ages 7–12) — Agriculture",
  secondary: "Secondary School (Ages 13–16) — Power",
  sixth_form: "Sixth Form (Ages 16–18) — Security",
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return json({ error: "Sign in as an organizer." }, 401);
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const asCaller = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: isOrg, error: roleError } = await asCaller.rpc("is_organizer");
  if (roleError || !isOrg) {
    return json({ error: "Organizers only." }, 403);
  }

  let orderReference: string;
  try {
    orderReference = String((await req.json()).orderReference ?? "").toUpperCase();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }
  if (!REF_PATTERN.test(orderReference)) {
    return json({ error: "Invalid order reference." }, 400);
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const fromAddress = Deno.env.get("ORDER_EMAIL_FROM") ??
    "APEN 2026 <apen@digitalcreativeshubltd.com>";
  const replyTo = Deno.env.get("ORDER_EMAIL_REPLY_TO") ||
    (fromAddress.match(/<([^>]+)>/)?.[1] ?? fromAddress);
  const siteUrl = (Deno.env.get("SITE_URL") ?? "").replace(/\/$/, "");
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set; cannot send receipt.");
    return json({ error: "Email is not configured on the server." }, 500);
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "order_reference, division, team_count, kit_unit_price, delivery_fee, fulfilment, total_amount, status, paid_at, receipt_sent_at, schools ( name, contact_name, contact_email )",
    )
    .eq("order_reference", orderReference)
    .maybeSingle();

  if (error || !order) return json({ error: "Order not found." }, 404);
  if (order.status !== "paid" && order.status !== "dispatched") {
    return json({ error: "This order is not marked paid yet." }, 409);
  }

  const school = order.schools as {
    name: string;
    contact_name: string;
    contact_email: string;
  } | null;
  if (!school?.contact_email) return json({ error: "No contact email on file." }, 422);

  if (order.receipt_sent_at) {
    const age = Date.now() - new Date(order.receipt_sent_at).getTime();
    if (age < COOLDOWN_MS) return json({ ok: true, throttled: true });
  }

  const { data: settings } = await supabase
    .from("store_settings")
    .select("dispatch_note_lagos, dispatch_note_outside")
    .eq("id", 1)
    .maybeSingle();

  const dispatchNote =
    order.fulfilment === "delivery_outside"
      ? settings?.dispatch_note_outside ?? "5–7 working days after payment is confirmed"
      : order.fulfilment === "pickup"
        ? "ready to collect 2–3 working days after payment is confirmed"
        : settings?.dispatch_note_lagos ?? "3–5 working days after payment is confirmed";

  const receiptNo = orderReference.replace(/^APEN-/, "RCPT-");
  const ref = escapeHtml(orderReference);
  const kitPerTeam = Number(order.kit_unit_price ?? 0);
  const deliveryFee = Number(order.delivery_fee ?? 0);
  const statusLink = siteUrl ? `${siteUrl}/order/${orderReference}` : "";
  const issuerName = Deno.env.get("BANK_ACCOUNT_NAME") ?? "";
  const issuerTin = Deno.env.get("BUSINESS_TIN") ?? "";

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f4f6f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#16202b;line-height:1.6">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #dce3e8;border-radius:4px;padding:28px">
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#7b8b9c">APEN 2026 · Innovation Store</p>
    <h1 style="margin:0 0 16px;font-size:22px">Payment received — receipt</h1>
    <p style="margin:0 0 16px">Hello ${escapeHtml(school.contact_name)},</p>
    <p style="margin:0 0 20px">We have confirmed payment for <strong>${escapeHtml(school.name)}</strong>. This email is your receipt — keep it for your records.</p>

    <div style="background:#e8f5ec;border:1px solid #1a7a3b;border-radius:4px;padding:16px;text-align:center;margin:0 0 20px">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#1a7a3b">Amount received</p>
      <p style="margin:0;font-size:26px;font-weight:700">${naira(order.total_amount)}</p>
    </div>

    <table style="width:100%;border-collapse:collapse;margin:0 0 20px;font-size:14px">
      <tr><td style="padding:6px 0;color:#47586b">Receipt no.</td><td style="padding:6px 0;text-align:right;font-family:ui-monospace,Menlo,monospace">${escapeHtml(receiptNo)}</td></tr>
      <tr><td style="padding:6px 0;color:#47586b">Order reference</td><td style="padding:6px 0;text-align:right;font-family:ui-monospace,Menlo,monospace">${ref}</td></tr>
      <tr><td style="padding:6px 0;color:#47586b">Date confirmed</td><td style="padding:6px 0;text-align:right">${escapeHtml(fmtDate(order.paid_at))}</td></tr>
      <tr><td style="padding:6px 0;color:#47586b">Division</td><td style="padding:6px 0;text-align:right">${escapeHtml(DIVISIONS[order.division] ?? order.division)}</td></tr>
      <tr><td style="padding:6px 0;color:#47586b">Kit &times; ${order.team_count} team${order.team_count === 1 ? "" : "s"}</td><td style="padding:6px 0;text-align:right">${naira(kitPerTeam * order.team_count)}</td></tr>
      <tr><td style="padding:6px 0;color:#47586b">Delivery / handling</td><td style="padding:6px 0;text-align:right">${deliveryFee === 0 ? "Free" : naira(deliveryFee)}</td></tr>
      <tr><td style="padding:10px 0;border-top:1px solid #dce3e8;font-weight:700">Total paid</td><td style="padding:10px 0;border-top:1px solid #dce3e8;text-align:right;font-weight:700">${naira(order.total_amount)}</td></tr>
    </table>

    <p style="margin:0 0 20px;font-size:14px">Every registered school receives a kit. Yours is now being prepared and will be dispatched — <strong>${escapeHtml(dispatchNote)}</strong>.</p>

    ${statusLink ? `<p style="margin:0 0 20px;text-align:center"><a href="${statusLink}" style="display:inline-block;background:#1a3b8b;color:#fff;text-decoration:none;padding:12px 22px;border-radius:4px;font-weight:600;font-size:15px">Track your kit</a></p>` : ""}

    <p style="margin:0;font-size:13px;color:#7b8b9c;border-top:1px solid #e9eef1;padding-top:16px">Questions? Reply to this email or message us on WhatsApp at +234 803 883 8094.</p>
    ${issuerName ? `<p style="margin:8px 0 0;font-size:12px;color:#9aa7b3">Issued by ${escapeHtml(issuerName)}${issuerTin ? ` &middot; TIN ${escapeHtml(issuerTin)}` : ""}</p>` : ""}
  </div>
</body></html>`;

  const text = [
    `APEN 2026 - Innovation Store`,
    `PAYMENT RECEIVED - RECEIPT`,
    ``,
    `Hello ${school.contact_name},`,
    ``,
    `Payment for ${school.name} has been confirmed.`,
    ``,
    `Receipt no:       ${receiptNo}`,
    `Order reference:  ${orderReference}`,
    `Date confirmed:   ${fmtDate(order.paid_at)}`,
    `Division:         ${DIVISIONS[order.division] ?? order.division}`,
    `Kit x ${order.team_count} team(s): ${naira(kitPerTeam * order.team_count)}`,
    `Delivery/handling: ${deliveryFee === 0 ? "Free" : naira(deliveryFee)}`,
    `TOTAL PAID:       ${naira(order.total_amount)}`,
    ``,
    `Every registered school receives a kit. Yours is being prepared and will be`,
    `dispatched - ${dispatchNote}.`,
    ``,
    statusLink ? `Track your kit: ${statusLink}` : "",
    ``,
    `Questions? Reply to this email or WhatsApp +234 803 883 8094.`,
    issuerName ? `Issued by ${issuerName}${issuerTin ? ` - TIN ${issuerTin}` : ""}` : "",
  ].filter(Boolean).join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      reply_to: replyTo,
      to: [school.contact_email],
      subject: `APEN 2026 payment receipt — ${orderReference}`,
      html,
      text,
    }),
  });

  if (!res.ok) {
    console.error("Resend rejected the receipt:", res.status, await res.text());
    return json({ error: "Could not send the receipt email." }, 502);
  }

  await supabase
    .from("orders")
    .update({ receipt_sent_at: new Date().toISOString() })
    .eq("order_reference", orderReference);

  return json({ ok: true });
});
