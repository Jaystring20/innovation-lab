import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * The Lab's scheduled mailer. Run daily by pg_cron (see LAB_SETUP.md).
 *
 * Sends four kinds of message, all addressed to the school contact on file —
 * never to an address supplied in the request:
 *   stage_open       a stage opens today
 *   deadline_3 / _1  the team has not submitted and the stage is due soon
 *   feedback_ready   judging closed and feedback was released
 *   gate_result      the team advanced, or did not
 *
 * notification_log is the dedupe key (kind, team_id, stage_id), so a re-run on
 * the same day is a no-op rather than a second email.
 *
 * No JWT: pg_cron cannot present one. A shared CRON_SECRET guards it instead,
 * compared in constant time.
 */

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

interface Recipient {
  email: string;
  contactName: string;
  schoolName: string;
  teamName: string;
}

interface Notice {
  kind: string;
  teamId: string;
  stageId: string;
  stageName: string;
  subject: string;
  heading: string;
  body: string;
  cta?: { label: string; href: string };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const expected = Deno.env.get("CRON_SECRET");
  if (!expected) {
    console.error("CRON_SECRET is not set; refusing to run.");
    return json({ error: "Not configured." }, 500);
  }
  const provided = req.headers.get("x-cron-secret") ?? "";
  if (!safeEqual(provided, expected)) return json({ error: "Forbidden" }, 403);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("ORDER_EMAIL_FROM") ?? "APEN 2026 <onboarding@resend.dev>";
  const siteUrl = (Deno.env.get("SITE_URL") ?? "").replace(/\/$/, "");
  const dryRun = !apiKey;

  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const plusDays = (n: number) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + n);
    return iso(d);
  };

  const [{ data: stages }, { data: teams }, { data: subs }, { data: queued }] =
    await Promise.all([
      admin.from("stages").select("id, ord, name, opens_at, due_at"),
      admin
        .from("teams")
        .select("id, name, eliminated_after_stage, schools ( name, contact_name, contact_email )"),
      admin.from("submissions").select("team_id, stage_id, status"),
      admin
        .from("notification_log")
        .select("id, kind, team_id, stage_id")
        .is("sent_at", null),
    ]);

  const stageById = new Map((stages ?? []).map((s) => [s.id, s]));
  const recipientByTeam = new Map<string, Recipient>();
  for (const t of teams ?? []) {
    const school = t.schools as {
      name: string;
      contact_name: string;
      contact_email: string;
    } | null;
    if (school?.contact_email) {
      recipientByTeam.set(t.id, {
        email: school.contact_email,
        contactName: school.contact_name,
        schoolName: school.name,
        teamName: t.name,
      });
    }
  }

  const submitted = new Set(
    (subs ?? [])
      .filter((s) => s.status !== "not_started" && s.status !== "returned")
      .map((s) => `${s.team_id}:${s.stage_id}`),
  );

  const activeTeams = (teams ?? []).filter((t) => t.eliminated_after_stage === null);
  const notices: Notice[] = [];

  // 1. Stages opening today, and deadlines 3 / 1 days out.
  for (const st of stages ?? []) {
    const openToday = st.opens_at === iso(today);
    const dueIn3 = st.due_at === plusDays(3);
    const dueIn1 = st.due_at === plusDays(1);
    if (!openToday && !dueIn3 && !dueIn1) continue;

    for (const team of activeTeams) {
      const hasSubmission = (subs ?? []).some(
        (s) => s.team_id === team.id && s.stage_id === st.id,
      );
      if (!hasSubmission) continue; // stage not open for this team

      const rec = recipientByTeam.get(team.id);
      if (!rec) continue;

      if (openToday) {
        notices.push({
          kind: "stage_open",
          teamId: team.id,
          stageId: st.id,
          stageName: st.name,
          subject: `${st.name} is open — APEN 2026`,
          heading: `${st.name} is now open`,
          body: `${rec.teamName} can start work on ${st.name}. The deadline is ${fmtDate(st.due_at)}.`,
          cta: siteUrl ? { label: "Open the Lab", href: `${siteUrl}/lab/dashboard` } : undefined,
        });
      } else if (!submitted.has(`${team.id}:${st.id}`)) {
        const days = dueIn3 ? 3 : 1;
        notices.push({
          kind: `deadline_${days}`,
          teamId: team.id,
          stageId: st.id,
          stageName: st.name,
          subject: `${days} day${days === 1 ? "" : "s"} left — ${st.name}`,
          heading: `${st.name} closes in ${days} day${days === 1 ? "" : "s"}`,
          body: `${rec.teamName} has not submitted for ${st.name} yet. The deadline is ${fmtDate(st.due_at)}.`,
          cta: siteUrl ? { label: "Submit now", href: `${siteUrl}/lab/dashboard` } : undefined,
        });
      }
    }
  }

  // 2. Queued events written by database triggers and the stage gate.
  for (const row of queued ?? []) {
    const rec = recipientByTeam.get(row.team_id!);
    const st = stageById.get(row.stage_id!);
    if (!rec || !st) continue;

    if (row.kind === "feedback_ready") {
      notices.push({
        kind: row.kind,
        teamId: row.team_id!,
        stageId: row.stage_id!,
        stageName: st.name,
        subject: `Feedback ready — ${st.name}`,
        heading: `Judge feedback for ${st.name} is ready`,
        body: `Judging is complete for ${rec.teamName}. Scores and judge comments are now visible in the Lab.`,
        cta: siteUrl ? { label: "See the feedback", href: `${siteUrl}/lab/dashboard` } : undefined,
      });
    } else if (row.kind === "gate_result") {
      const team = (teams ?? []).find((t) => t.id === row.team_id);
      const advanced = team?.eliminated_after_stage === null;
      notices.push({
        kind: row.kind,
        teamId: row.team_id!,
        stageId: row.stage_id!,
        stageName: st.name,
        subject: advanced
          ? `${rec.teamName} advances — APEN 2026`
          : `APEN 2026 result for ${rec.teamName}`,
        heading: advanced ? "Your team advances" : "Thank you for competing",
        body: advanced
          ? `${rec.teamName} is through to the next round of APEN 2026. The next stage is open in the Lab now.`
          : `${rec.teamName} did not advance past ${st.name} this year. Judge feedback for every scored stage is in the Lab.`,
        cta: siteUrl ? { label: "Open the Lab", href: `${siteUrl}/lab/dashboard` } : undefined,
      });
    }
  }

  let sent = 0;
  const failures: string[] = [];

  for (const n of notices) {
    const rec = recipientByTeam.get(n.teamId)!;

    // Claim the slot before sending, so a crash mid-loop cannot double-send.
    const { error: claimErr } = await admin
      .from("notification_log")
      .upsert(
        { kind: n.kind, team_id: n.teamId, stage_id: n.stageId, sent_at: new Date().toISOString() },
        { onConflict: "kind,team_id,stage_id", ignoreDuplicates: true },
      );
    if (claimErr) {
      failures.push(`${n.kind}/${n.teamId}: ${claimErr.message}`);
      continue;
    }

    // ignoreDuplicates means an already-claimed row is untouched; check it.
    const { data: logRow } = await admin
      .from("notification_log")
      .select("sent_at")
      .eq("kind", n.kind)
      .eq("team_id", n.teamId)
      .eq("stage_id", n.stageId)
      .maybeSingle();

    if (!logRow?.sent_at) continue; // someone else already handled it

    if (dryRun) {
      sent++;
      continue;
    }

    const ok = await send(apiKey!, from, rec, n);
    if (ok) sent++;
    else {
      failures.push(`${n.kind}/${n.teamId}: send failed`);
      // Let the next run retry.
      await admin
        .from("notification_log")
        .update({ sent_at: null })
        .eq("kind", n.kind)
        .eq("team_id", n.teamId)
        .eq("stage_id", n.stageId);
    }
  }

  return json({
    ok: true,
    dry_run: dryRun,
    candidates: notices.length,
    sent,
    failures: failures.length,
  });
});

function fmtDate(d: string | null): string {
  if (!d) return "the stage deadline";
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

async function send(
  apiKey: string,
  from: string,
  rec: Recipient,
  n: Notice,
): Promise<boolean> {
  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f4f6f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#16202b;line-height:1.6">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #dce3e8;border-radius:4px;padding:28px">
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#7b8b9c">APEN 2026 · Innovation Lab</p>
    <h1 style="margin:0 0 16px;font-size:22px">${escapeHtml(n.heading)}</h1>
    <p style="margin:0 0 16px">Hello ${escapeHtml(rec.contactName)},</p>
    <p style="margin:0 0 20px">${escapeHtml(n.body)}</p>
    <p style="margin:0 0 20px;font-size:14px;color:#47586b">School: ${escapeHtml(rec.schoolName)} · Team: ${escapeHtml(rec.teamName)}</p>
    ${
      n.cta
        ? `<p style="margin:0 0 20px"><a href="${n.cta.href}" style="display:inline-block;background:#1a3b8b;color:#fff;text-decoration:none;padding:12px 22px;border-radius:4px;font-weight:600;font-size:15px">${escapeHtml(n.cta.label)}</a></p>`
        : ""
    }
    <p style="margin:0;font-size:13px;color:#7b8b9c;border-top:1px solid #e9eef1;padding-top:16px">Design. Build. Intelligize. — APEN 2026</p>
  </div>
</body></html>`;

  const text = [
    "APEN 2026 - Innovation Lab",
    "",
    n.heading,
    "",
    `Hello ${rec.contactName},`,
    "",
    n.body,
    "",
    `School: ${rec.schoolName} | Team: ${rec.teamName}`,
    n.cta ? `\n${n.cta.label}: ${n.cta.href}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [rec.email], subject: n.subject, html, text }),
  });

  if (!res.ok) {
    console.error("Resend rejected the send:", res.status, await res.text());
    return false;
  }
  return true;
}
