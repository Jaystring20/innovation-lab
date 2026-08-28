import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * The elimination gate between stages.
 *
 * Ranks every team within its division on the weighted average of the stages
 * scored so far, then advances the top N. Advancing opens Stages 3 and 4;
 * everyone else is marked eliminated. Handbook: the cut happens at the Phase 4
 * gate, after Stage 2 judging.
 *
 * Organizer-only. verify_jwt is off so the CORS preflight and a clean 401 are
 * handled here, but the caller's JWT is still verified below and checked
 * against public.profiles — the service-role client used for the writes
 * bypasses RLS entirely, so authorisation has to be proven first.
 */

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

const DIVISIONS = ["primary", "secondary", "sixth_form"] as const;

interface StandingRow {
  team_id: string;
  team_name: string;
  division: string;
  overall: number | null;
  eliminated_after_stage: number | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return json({ error: "Sign in as an organizer to run the gate." }, 401);
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Identify the caller with their own token, then check the role in the DB.
  const asCaller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: userData, error: userErr } = await asCaller.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Invalid session." }, 401);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profile?.role !== "organizer") {
    return json({ error: "Only organizers can run the stage gate." }, 403);
  }

  let stageOrd: number;
  let dryRun: boolean;
  try {
    const body = await req.json();
    stageOrd = Number(body.stage_ord);
    dryRun = body.dry_run !== false; // default to a preview
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  if (!Number.isInteger(stageOrd) || stageOrd < 1 || stageOrd > 3) {
    return json({ error: "stage_ord must be 1, 2 or 3." }, 400);
  }

  const { data: stage } = await admin
    .from("stages")
    .select("id, ord, advance_count")
    .eq("ord", stageOrd)
    .maybeSingle();

  if (!stage) return json({ error: "Unknown stage." }, 400);

  // Standings already carry the weighted average across scored stages.
  const { data: standings, error: standErr } = await admin
    .from("team_standings")
    .select("team_id, team_name, division, overall, eliminated_after_stage");

  if (standErr) return json({ error: standErr.message }, 500);

  const rows = (standings ?? []) as StandingRow[];
  const divisions = DIVISIONS.map((division) => {
    // Teams already cut in an earlier round do not compete for the slots again.
    const eligible = rows
      .filter((r) => r.division === division && r.eliminated_after_stage === null)
      .sort((a, b) => (b.overall ?? -1) - (a.overall ?? -1));

    const cap = stage.advance_count;
    return {
      division,
      advance_count: cap,
      rows: eligible.map((r, i) => ({
        team_id: r.team_id,
        team_name: r.team_name,
        division: r.division,
        overall: r.overall,
        rank: i + 1,
        // An unscored team cannot advance on a blank sheet.
        advances: cap == null ? r.overall != null : i < cap && r.overall != null,
      })),
    };
  });

  if (dryRun) {
    return json({ dry_run: true, stage_ord: stageOrd, divisions });
  }

  const advancing = divisions.flatMap((d) => d.rows.filter((r) => r.advances));
  const eliminated = divisions.flatMap((d) => d.rows.filter((r) => !r.advances));
  const now = new Date().toISOString();

  if (advancing.length > 0) {
    const ids = advancing.map((r) => r.team_id);
    const { error } = await admin
      .from("teams")
      .update({ advanced_at: now, eliminated_after_stage: null })
      .in("id", ids);
    if (error) return json({ error: error.message }, 500);

    // Open the later stages for the teams that got through.
    const { data: laterStages } = await admin
      .from("stages")
      .select("id, ord")
      .gt("ord", stageOrd);

    const toOpen = (laterStages ?? []).flatMap((st) =>
      ids.map((teamId) => ({ team_id: teamId, stage_id: st.id })),
    );

    if (toOpen.length > 0) {
      const { error: openErr } = await admin
        .from("submissions")
        .upsert(toOpen, { onConflict: "team_id,stage_id", ignoreDuplicates: true });
      if (openErr) return json({ error: openErr.message }, 500);
    }
  }

  if (eliminated.length > 0) {
    const { error } = await admin
      .from("teams")
      .update({ eliminated_after_stage: stageOrd })
      .in("id", eliminated.map((r) => r.team_id));
    if (error) return json({ error: error.message }, 500);
  }

  // Queue the result emails; the daily mailer sends and marks them.
  const notices = [...advancing, ...eliminated].map((r) => ({
    kind: "gate_result",
    team_id: r.team_id,
    stage_id: stage.id,
  }));
  if (notices.length > 0) {
    await admin
      .from("notification_log")
      .upsert(notices, { onConflict: "kind,team_id,stage_id", ignoreDuplicates: true });
  }

  return json({
    dry_run: false,
    stage_ord: stageOrd,
    divisions,
    advanced: advancing.length,
    eliminated: eliminated.length,
  });
});
