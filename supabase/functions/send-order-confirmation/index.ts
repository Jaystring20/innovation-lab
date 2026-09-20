import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Emails a school its order reference and payment instructions.
 *
 * Deliberately public (no JWT): schools register anonymously, so there is no
 * token to present. The endpoint is safe to expose because the recipient is
 * read from the database, never from the request — a caller can only ever
 * cause a legitimate confirmation to be re-sent to the school that owns the
 * order, and a cooldown stops that being used to flood an inbox.
 */

const REF_PATTERN = /^APEN-[A-Z0-9]{7}$/;
const RESEND_COOLDOWN_MS = 60_000;

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Validate the request before looking at server configuration, so a bad
  // request is always reported as a bad request rather than as a config fault.
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
    console.error("RESEND_API_KEY is not set; cannot send confirmation.");
    return json({ error: "Email is not configured on the server." }, 500);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "order_reference, division, team_count, kit_unit_price, delivery_fee, fulfilment, line_items, total_amount, confirmation_sent_at, schools ( name, contact_name, contact_email )",
    )
    .eq("order_reference", orderReference)
    .maybeSingle();

  // Never disclose whether a reference exists.
  if (error || !order) return json({ ok: true });

  const { data: settings } = await supabase
    .from("store_settings")
    .select("whatsapp_number, dispatch_note_lagos, dispatch_note_outside")
    .eq("id", 1)
    .maybeSingle();

  const waNumber = (settings?.whatsapp_number ?? "2348038838094").replace(/\D/g, "");
  const dispatchNote =
    order.fulfilment === "delivery_outside"
      ? settings?.dispatch_note_outside ?? "5–7 working days after payment is confirmed"
      : order.fulfilment === "pickup"
        ? "ready to collect 2–3 working days after payment is confirmed"
        : settings?.dispatch_note_lagos ?? "3–5 working days after payment is confirmed";

  const school = order.schools as {
    name: string;
    contact_name: string;
    contact_email: string;
  } | null;
  if (!school?.contact_email) return json({ ok: true });

  if (order.confirmation_sent_at) {
    const age = Date.now() - new Date(order.confirmation_sent_at).getTime();
    if (age < RESEND_COOLDOWN_MS) return json({ ok: true, throttled: true });
  }

  const bank = {
    name: Deno.env.get("BANK_NAME") ?? "(bank details not yet configured)",
    accountName: Deno.env.get("BANK_ACCOUNT_NAME") ?? "",
    accountNumber: Deno.env.get("BANK_ACCOUNT_NUMBER") ?? "",
  };

  const statusLink = siteUrl ? `${siteUrl}/order/${orderReference}` : "";
  const ref = escapeHtml(orderReference);
  const waText = encodeURIComponent(
    `I have paid for APEN 2026 order ${orderReference} (${order.schools ? (order.schools as { name: string }).name : ""}) — ${naira(order.total_amount)}. Proof of payment attached.`,
  );
  const waLink = waNumber ? `https://wa.me/${waNumber}?text=${waText}` : "";

  const FULFILMENT: Record<string, string> = {
    delivery_lagos: "Delivery within Lagos",
    delivery_outside: "Delivery outside Lagos (estimate — confirmed by location)",
    pickup: "Pickup — collect in Lagos",
  };
  const lineItems = Array.isArray(order.line_items)
    ? (order.line_items as { component: string; qty: number; unit_price: number; included: boolean }[])
    : [];
  const includedItems = lineItems.filter((i) => i.included);
  const kitPerTeam = Number(order.kit_unit_price ?? 0);
  const deliveryFee = Number(order.delivery_fee ?? 0);

  const itemsHtml = includedItems.length
    ? `<h2 style="margin:0 0 8px;font-size:16px">Kit contents (per team)</h2>
       <table style="width:100%;border-collapse:collapse;margin:0 0 20px;font-size:13px">
       ${includedItems
         .map(
           (i) =>
             `<tr><td style="padding:4px 0;color:#47586b">${escapeHtml(i.component)}${i.qty > 1 ? ` &times; ${i.qty}` : ""}</td><td style="padding:4px 0;text-align:right">${naira(i.qty * i.unit_price)}</td></tr>`,
         )
         .join("")}
       </table>`
    : "";

  const itemsText = includedItems.length
    ? [
        "",
        "KIT CONTENTS (per team)",
        ...includedItems.map(
          (i) => `  ${i.component}${i.qty > 1 ? ` x${i.qty}` : ""} - ${naira(i.qty * i.unit_price)}`,
        ),
      ]
    : [];

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f4f6f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#16202b;line-height:1.6">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #dce3e8;border-radius:4px;padding:28px">
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#7b8b9c">APEN 2026 · Innovation Store</p>
    <h1 style="margin:0 0 16px;font-size:22px">Your registration is received</h1>
    <p style="margin:0 0 16px">Hello ${escapeHtml(school.contact_name)},</p>
    <p style="margin:0 0 20px">${escapeHtml(school.name)} is registered for APEN 2026. Keep this email — your order reference is how you track the order and how we match your payment.</p>

    <div style="background:#e7ecf7;border:1px solid #1a3b8b;border-radius:4px;padding:16px;text-align:center;margin:0 0 20px">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#1a3b8b">Order reference</p>
      <p style="margin:0;font-size:26px;font-weight:700;letter-spacing:.06em;font-family:ui-monospace,'SFMono-Regular',Menlo,monospace">${ref}</p>
    </div>

    <table style="width:100%;border-collapse:collapse;margin:0 0 20px;font-size:14px">
      <tr><td style="padding:6px 0;color:#47586b">Division</td><td style="padding:6px 0;text-align:right">${escapeHtml(DIVISIONS[order.division] ?? order.division)}</td></tr>
      <tr><td style="padding:6px 0;color:#47586b">Kit &times; ${order.team_count} team${order.team_count === 1 ? "" : "s"}</td><td style="padding:6px 0;text-align:right">${naira(kitPerTeam * order.team_count)}</td></tr>
      <tr><td style="padding:6px 0;color:#47586b">${escapeHtml(FULFILMENT[order.fulfilment as string] ?? "Delivery")}</td><td style="padding:6px 0;text-align:right">${deliveryFee === 0 ? "Free" : naira(deliveryFee)}</td></tr>
      <tr><td style="padding:10px 0;border-top:1px solid #dce3e8;font-weight:700">Total due</td><td style="padding:10px 0;border-top:1px solid #dce3e8;text-align:right;font-weight:700">${naira(order.total_amount)}</td></tr>
    </table>

    ${itemsHtml}

    <h2 style="margin:0 0 8px;font-size:16px">How to pay</h2>
    <p style="margin:0 0 12px;font-size:14px">Transfer <strong>${naira(order.total_amount)}</strong> to the account below, using <strong>${ref}</strong> as the transfer narration.</p>
    <div style="background:#f4f6f7;border:1px solid #e9eef1;border-radius:4px;padding:14px;font-size:14px;margin:0 0 16px">
      <div>Bank: ${escapeHtml(bank.name)}</div>
      ${bank.accountName ? `<div>Account name: ${escapeHtml(bank.accountName)}</div>` : ""}
      ${bank.accountNumber ? `<div>Account number: ${escapeHtml(bank.accountNumber)}</div>` : ""}
    </div>

    <p style="margin:0 0 16px;font-size:14px">Then confirm your payment one of two ways:</p>
    <ul style="margin:0 0 20px;padding-left:18px;font-size:14px">
      ${statusLink ? `<li style="margin:0 0 6px">Upload your proof on your <a href="${statusLink}" style="color:#1a3b8b">order page</a>, or</li>` : ""}
      ${waLink ? `<li>Send your proof on WhatsApp to <strong>+234 803 883 8094</strong>, quoting <strong>${ref}</strong></li>` : ""}
    </ul>

    ${waLink ? `<p style="margin:0 0 20px;text-align:center"><a href="${waLink}" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;padding:12px 22px;border-radius:4px;font-weight:600;font-size:15px">Confirm payment on WhatsApp</a></p>` : ""}
    ${statusLink ? `<p style="margin:0 0 20px;text-align:center"><a href="${statusLink}" style="display:inline-block;background:#1a3b8b;color:#fff;text-decoration:none;padding:12px 22px;border-radius:4px;font-weight:600;font-size:15px">Track your order &amp; upload proof</a></p>` : ""}

    <p style="margin:0;font-size:13px;color:#7b8b9c;border-top:1px solid #e9eef1;padding-top:16px">Every registered school receives a kit. Once your payment is confirmed, your kit is dispatched — ${escapeHtml(dispatchNote)}. Registration closes 25 September 2026.</p>
  </div>
</body></html>`;

  const text = [
    `APEN 2026 - Innovation Store`,
    ``,
    `Hello ${school.contact_name},`,
    ``,
    `${school.name} is registered for APEN 2026.`,
    ``,
    `ORDER REFERENCE: ${orderReference}`,
    `Division: ${DIVISIONS[order.division] ?? order.division}`,
    `Kit x ${order.team_count} team(s): ${naira(kitPerTeam * order.team_count)}`,
    `${FULFILMENT[order.fulfilment as string] ?? "Delivery"}: ${deliveryFee === 0 ? "Free" : naira(deliveryFee)}`,
    `Total due: ${naira(order.total_amount)}`,
    ...itemsText,
    ``,
    `HOW TO PAY`,
    `Transfer ${naira(order.total_amount)} to:`,
    `  Bank: ${bank.name}`,
    bank.accountName ? `  Account name: ${bank.accountName}` : "",
    bank.accountNumber ? `  Account number: ${bank.accountNumber}` : "",
    `Use ${orderReference} as the transfer narration.`,
    ``,
    `Then confirm your payment:`,
    statusLink ? `  - Upload proof on your order page: ${statusLink}` : "",
    waLink ? `  - Or send proof on WhatsApp to +234 803 883 8094, quoting ${orderReference}` : "",
    ``,
    `Every registered school receives a kit. Once payment is confirmed, your kit`,
    `is dispatched - ${dispatchNote}. Registration closes 25 September 2026.`,
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
      subject: `APEN 2026 registration — ${orderReference}`,
      html,
      text,
    }),
  });

  if (!res.ok) {
    console.error("Resend rejected the send:", res.status, await res.text());
    return json({ error: "Could not send the confirmation email." }, 502);
  }

  await supabase
    .from("orders")
    .update({ confirmation_sent_at: new Date().toISOString() })
    .eq("order_reference", orderReference);

  return json({ ok: true });
});
