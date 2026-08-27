import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Emails a school every order reference registered against its contact address.
 *
 * This is the safety net for the one unrecoverable failure in the store: a
 * school that closes the tab loses the only copy of its reference.
 *
 * The response is identical whether or not the address has any orders, so this
 * cannot be used to test which schools have registered. References are only
 * ever delivered to the address that owns them, never returned to the caller.
 */

const EMAIL_PATTERN = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;
const RESEND_COOLDOWN_MS = 60_000;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Always the same answer, so the endpoint cannot enumerate registrations.
const GENERIC = {
  ok: true,
  message:
    "If that address has any APEN 2026 orders, we have emailed the reference numbers to it.",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const naira = (n: number) =>
  "NGN " + Number(n).toLocaleString("en-NG", { maximumFractionDigits: 0 });

const STATUS_LABELS: Record<string, string> = {
  registered: "Awaiting payment",
  payment_pending: "Payment under review",
  paid: "Paid",
  dispatched: "Kit dispatched",
  cancelled: "Cancelled",
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Validate before consulting server configuration, so a malformed request is
  // reported as such rather than masked by a config error.
  let email: string;
  try {
    email = String((await req.json()).email ?? "").trim().toLowerCase();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  if (!EMAIL_PATTERN.test(email)) {
    return json({ error: "Please enter a valid email address." }, 400);
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const fromAddress = Deno.env.get("ORDER_EMAIL_FROM") ??
    "APEN 2026 <onboarding@resend.dev>";
  const siteUrl = (Deno.env.get("SITE_URL") ?? "").replace(/\/$/, "");

  if (!apiKey) {
    console.error("RESEND_API_KEY is not set; cannot send recovery email.");
    return json({ error: "Email is not configured on the server." }, 500);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data: schools, error } = await supabase
    .from("schools")
    .select(
      "id, name, contact_name, contact_email, recovery_sent_at, orders ( order_reference, division, team_count, total_amount, status, created_at )",
    )
    .ilike("contact_email", email);

  if (error) {
    console.error("Recovery lookup failed:", error.message);
    return json(GENERIC);
  }

  type OrderRow = {
    order_reference: string;
    team_count: number;
    total_amount: number;
    status: string;
    created_at: string;
  };

  const rows: OrderRow[] = (schools ?? []).flatMap(
    (s) => (s.orders ?? []) as OrderRow[],
  );

  // Nothing to send — but the caller is told exactly what it would be told
  // if there had been.
  if (rows.length === 0) return json(GENERIC);

  // Throttle: without this, a known school address can be mail-bombed and the
  // sending quota drained. The response is unchanged either way, so throttling
  // stays invisible to a caller probing for behaviour.
  const lastSent = (schools ?? [])
    .map((s) => (s as { recovery_sent_at: string | null }).recovery_sent_at)
    .filter(Boolean)
    .sort()
    .pop();
  if (lastSent && Date.now() - new Date(lastSent).getTime() < RESEND_COOLDOWN_MS) {
    return json(GENERIC);
  }

  rows.sort((a, b) => b.created_at.localeCompare(a.created_at));

  const contactName = (schools ?? [])[0]?.contact_name ?? "there";

  const rowsHtml = rows.map((o) => {
    const link = siteUrl ? `${siteUrl}/order/${o.order_reference}` : "";
    const refCell = link
      ? `<a href="${link}" style="color:#1a3b8b;font-weight:700;text-decoration:none;font-family:ui-monospace,'SFMono-Regular',Menlo,monospace">${escapeHtml(o.order_reference)}</a>`
      : `<span style="font-weight:700;font-family:ui-monospace,Menlo,monospace">${escapeHtml(o.order_reference)}</span>`;
    return `<tr>
      <td style="padding:10px 0;border-top:1px solid #e9eef1">${refCell}<div style="font-size:12px;color:#7b8b9c">${o.team_count} kit(s) · ${naira(o.total_amount)}</div></td>
      <td style="padding:10px 0;border-top:1px solid #e9eef1;text-align:right;font-size:13px;color:#47586b">${escapeHtml(STATUS_LABELS[o.status] ?? o.status)}</td>
    </tr>`;
  }).join("");

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f4f6f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#16202b;line-height:1.6">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #dce3e8;border-radius:4px;padding:28px">
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#7b8b9c">APEN 2026 · Innovation Store</p>
    <h1 style="margin:0 0 16px;font-size:22px">Your order reference${rows.length > 1 ? "s" : ""}</h1>
    <p style="margin:0 0 20px">Hello ${escapeHtml(contactName)}, here ${rows.length > 1 ? "are the orders" : "is the order"} registered against this email address.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${rowsHtml}</table>
    <p style="margin:24px 0 0;font-size:13px;color:#7b8b9c;border-top:1px solid #e9eef1;padding-top:16px">If you did not request this, you can ignore this email — nothing has changed on your order.</p>
  </div>
</body></html>`;

  const text = [
    "APEN 2026 - Innovation Store",
    "",
    `Hello ${contactName},`,
    "",
    `Order${rows.length > 1 ? "s" : ""} registered against this email address:`,
    "",
    ...rows.map((o) =>
      `  ${o.order_reference} - ${o.team_count} kit(s), ${naira(o.total_amount)} - ${STATUS_LABELS[o.status] ?? o.status}` +
      (siteUrl ? `\n    ${siteUrl}/order/${o.order_reference}` : "")
    ),
    "",
    "If you did not request this, ignore this email.",
  ].join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [email],
      subject: "Your APEN 2026 order reference" + (rows.length > 1 ? "s" : ""),
      html,
      text,
    }),
  });

  if (!res.ok) {
    console.error("Resend rejected the recovery send:", res.status, await res.text());
  } else {
    const ids = (schools ?? []).map((s) => (s as { id: string }).id);
    await supabase
      .from("schools")
      .update({ recovery_sent_at: new Date().toISOString() })
      .in("id", ids);
  }

  return json(GENERIC);
});
