import { supabase } from './supabase';
import type { Division } from './store';

/* ------------------------------------------------------------------ *
 * APEN 2026 Lab — submissions & judging data layer (RLS-backed).
 *
 * Roles: organizer sees/does everything, judge scores assigned work,
 * teacher (one account per school) runs their teams. RLS in
 * 20260828_004_lab_judging.sql is the real boundary; this file just
 * mirrors its shape.
 * ------------------------------------------------------------------ */

export type StageKey = 'design' | 'build' | 'intelligize' | 'battle';
export type DeliverableKind = 'video' | 'prototype' | 'prompt_log' | 'live';
export type SubmissionStatus =
  | 'not_started'
  | 'submitted'
  | 'under_review'
  | 'scored'
  | 'returned';

export interface Stage {
  id: string;
  ord: number;
  key: StageKey;
  name: string;
  deliverable_kind: DeliverableKind;
  opens_at: string | null;
  due_at: string | null;
  weight: number;
  advance_count: number | null;
  auto_release_feedback: boolean;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: 'video' | 'code' | 'doc' | 'image' | 'other';
  gdrive_id?: string;
  gdrive_url?: string;
  thumbnail_url?: string;
  preview_metadata?: Record<string, any>;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
}

export interface SubmissionPayload {
  // Optional URL fields (legacy)
  video_url?: string;
  repo_url?: string;
  doc_url?: string;
  notes?: string;

  // New: uploaded files
  uploaded_files?: UploadedFile[];
}

export interface Team {
  id: string;
  school_id: string;
  division: Division;
  name: string;
  order_id: string | null;
  eliminated_after_stage: number | null;
  advanced_at: string | null;
  created_at: string;
}

export interface Submission {
  id: string;
  team_id: string;
  stage_id: string;
  status: SubmissionStatus;
  payload: SubmissionPayload;
  submitted_at: string | null;
  feedback_released_at: string | null;
  updated_at: string;
}

export interface Feedback {
  released_at: string | null;
  judge_count: number;
  avg_design: number | null;
  avg_hardware: number | null;
  avg_ai: number | null;
  avg_presentation: number | null;
  avg_total: number | null;
  comments: string[];
}

export interface ScoreInput {
  c_design: number;
  c_hardware: number;
  c_ai: number;
  c_presentation: number;
  comments: string;
}

export interface JudgeQueueItem {
  submission_id: string;
  stage_ord: number;
  stage_name: string;
  stage_kind: DeliverableKind;
  division: Division;
  payload: SubmissionPayload;
  status: SubmissionStatus;
  due_at: string | null;
  my_score: (ScoreInput & { comments: string | null }) | null;
}

export interface Standing {
  team_id: string;
  team_name: string;
  division: Division;
  school_id: string;
  overall: number | null;
  stage_scores: Record<string, number>;
  division_rank: number;
  eliminated_after_stage: number | null;
  advanced_at: string | null;
}

/** Organizer views — submission joined with team + stage + aggregate. */
export interface AdminSubmission {
  id: string;
  team_id: string;
  stage_id: string;
  status: SubmissionStatus;
  payload: SubmissionPayload;
  submitted_at: string | null;
  feedback_released_at: string | null;
  teams: { name: string; division: Division; school_id: string } | null;
  stages: { ord: number; name: string; key: StageKey; deliverable_kind: DeliverableKind } | null;
  scores?: {
    judge_count: number;
    avg_design: number | null;
    avg_hardware: number | null;
    avg_ai: number | null;
    avg_presentation: number | null;
    avg_total: number | null;
  } | null;
}

export interface JudgeProfile {
  id: string;
  full_name: string | null;
  email: string | null;
}

export interface Assignment {
  id: string;
  submission_id: string;
  judge_id: string;
  assigned_at: string;
}

export interface GatePreviewRow {
  team_id: string;
  team_name: string;
  division: Division;
  overall: number | null;
  rank: number;
  advances: boolean;
}

/* ----------------------------- Constants ----------------------------- */

export const RUBRIC = [
  { key: 'c_design' as const, label: 'Design Thinking & Empathy', max: 20 },
  { key: 'c_hardware' as const, label: 'Hardware Execution & Build Quality', max: 30 },
  { key: 'c_ai' as const, label: 'AI Innovation & "Intelligize" Layer', max: 30 },
  { key: 'c_presentation' as const, label: 'Presentation & Documentation', max: 20 },
];

export const RUBRIC_MAX = 100;

export const STATUS_LABEL: Record<SubmissionStatus, string> = {
  not_started: 'Not started',
  submitted: 'Submitted',
  under_review: 'Under review',
  scored: 'Scored',
  returned: 'Returned for changes',
};

export const DELIVERABLE_LABEL: Record<DeliverableKind, string> = {
  video: '3-minute video pitch',
  prototype: 'Working prototype — demo video / photos',
  prompt_log: 'AI prompt log + project video',
  live: 'Live presentation in Lagos',
};

/* ------------------------------ Shared ------------------------------ */

export async function listStages(): Promise<Stage[]> {
  const { data, error } = await supabase.from('stages').select('*').order('ord');
  if (error) throw new Error(error.message);
  return (data ?? []) as Stage[];
}

/* ------------------------------ Teacher ----------------------------- */

export async function listMyTeams(): Promise<Team[]> {
  const { data, error } = await supabase.from('teams').select('*').order('created_at');
  if (error) throw new Error(error.message);
  return (data ?? []) as Team[];
}

export async function createTeam(schoolId: string, name: string): Promise<Team> {
  const { data, error } = await supabase
    .from('teams')
    .insert({ school_id: schoolId, name: name.trim() })
    .select('*')
    .single();
  if (error) throw new Error(friendlyTeamError(error.message));
  return data as Team;
}

function friendlyTeamError(msg: string): string {
  if (/slots are in use/i.test(msg)) return msg;
  if (/row-level security/i.test(msg))
    return 'Your account is not linked to a school yet. Ask the APEN 2026 team to link it.';
  return msg;
}

export async function renameTeam(teamId: string, name: string): Promise<void> {
  const { error } = await supabase.from('teams').update({ name: name.trim() }).eq('id', teamId);
  if (error) throw new Error(error.message);
}

export async function listTeamSubmissions(teamId: string): Promise<Submission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('team_id', teamId);
  if (error) throw new Error(error.message);
  return (data ?? []) as Submission[];
}

export async function saveSubmission(
  submissionId: string,
  payload: SubmissionPayload,
): Promise<Submission> {
  const { data, error } = await supabase
    .from('submissions')
    .update({ payload, updated_at: new Date().toISOString() })
    .eq('id', submissionId)
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  // Trigger automations (async, non-blocking)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && anonKey) {
    // Files are already in Drive by this point — they upload directly from
    // SubmissionForm as soon as they're selected, not on save. There used
    // to be a "sync to Drive" call here (sync-submission-to-gdrive); it was
    // a stub that never actually called Drive, so it's removed rather than
    // fixed twice.
    Promise.all([
      // 1. Extract link previews
      fetch(`${supabaseUrl}/functions/v1/extract-link-previews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ submission_id: submissionId }),
      }).catch((e) => console.error('Preview extraction failed:', e)),

      // 2. Run auto-analysis
      fetch(`${supabaseUrl}/functions/v1/analyze-submission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ submission_id: submissionId }),
      }).catch((e) => console.error('Analysis failed:', e)),
    ]).catch((e) => console.error('Automation error:', e));
  }

  return data as Submission;
}

export async function getFeedback(submissionId: string): Promise<Feedback | null> {
  const { data, error } = await supabase.rpc('get_submission_feedback', {
    p_submission_id: submissionId,
  });
  if (error) throw new Error(error.message);
  return (data as Feedback | null) ?? null;
}

/* ------------------------------- Judge ------------------------------ */

export async function judgeQueue(): Promise<JudgeQueueItem[]> {
  const { data, error } = await supabase.rpc('judge_queue');
  if (error) throw new Error(error.message);
  return (data ?? []) as JudgeQueueItem[];
}

export async function submitScore(
  submissionId: string,
  judgeId: string,
  score: ScoreInput,
): Promise<void> {
  const { error } = await supabase.from('scores').upsert(
    {
      submission_id: submissionId,
      judge_id: judgeId,
      c_design: score.c_design,
      c_hardware: score.c_hardware,
      c_ai: score.c_ai,
      c_presentation: score.c_presentation,
      comments: score.comments.trim() || null,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: 'submission_id,judge_id' },
  );
  if (error) throw new Error(error.message);
}

/* ----------------------------- Organizer ---------------------------- */

export async function listAllTeams(): Promise<
  (Team & { schools: { name: string; contact_name: string; contact_email: string } | null })[]
> {
  const { data, error } = await supabase
    .from('teams')
    .select('*, schools ( name, contact_name, contact_email )')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as (Team & {
    schools: { name: string; contact_name: string; contact_email: string } | null;
  })[];
}

export async function listAllSubmissions(): Promise<AdminSubmission[]> {
  const [subs, agg] = await Promise.all([
    supabase
      .from('submissions')
      .select(
        'id, team_id, stage_id, status, payload, submitted_at, feedback_released_at, teams ( name, division, school_id ), stages ( ord, name, key, deliverable_kind )',
      ),
    supabase.from('submission_scores').select('*'),
  ]);
  if (subs.error) throw new Error(subs.error.message);
  if (agg.error) throw new Error(agg.error.message);

  const byId = new Map<string, AdminSubmission['scores']>();
  for (const row of agg.data ?? []) {
    byId.set((row as { submission_id: string }).submission_id, row as AdminSubmission['scores']);
  }
  return ((subs.data ?? []) as unknown as AdminSubmission[])
    .map((s) => ({ ...s, scores: byId.get(s.id) ?? null }))
    .sort((a, b) => (a.stages?.ord ?? 0) - (b.stages?.ord ?? 0));
}

export async function listJudges(): Promise<JudgeProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'judge')
    .order('full_name');
  if (error) throw new Error(error.message);
  return (data ?? []) as JudgeProfile[];
}

export async function listAssignments(): Promise<Assignment[]> {
  const { data, error } = await supabase
    .from('review_assignments')
    .select('id, submission_id, judge_id, assigned_at');
  if (error) throw new Error(error.message);
  return (data ?? []) as Assignment[];
}

export async function assignJudge(
  submissionId: string,
  judgeId: string,
  assignedBy: string,
): Promise<void> {
  const { error } = await supabase
    .from('review_assignments')
    .upsert(
      { submission_id: submissionId, judge_id: judgeId, assigned_by: assignedBy },
      { onConflict: 'submission_id,judge_id', ignoreDuplicates: true },
    );
  if (error) throw new Error(error.message);
}

export async function unassignJudge(submissionId: string, judgeId: string): Promise<void> {
  const { error } = await supabase
    .from('review_assignments')
    .delete()
    .eq('submission_id', submissionId)
    .eq('judge_id', judgeId);
  if (error) throw new Error(error.message);
}

export async function listStandings(): Promise<Standing[]> {
  const { data, error } = await supabase
    .from('team_standings')
    .select('*')
    .order('division')
    .order('division_rank');
  if (error) throw new Error(error.message);
  return (data ?? []) as Standing[];
}

export async function releaseFeedback(submissionId: string): Promise<void> {
  const { error } = await supabase
    .from('submissions')
    .update({ feedback_released_at: new Date().toISOString() })
    .eq('id', submissionId);
  if (error) throw new Error(error.message);
}

export async function returnSubmission(submissionId: string): Promise<void> {
  const { error } = await supabase
    .from('submissions')
    .update({ status: 'returned' })
    .eq('id', submissionId);
  if (error) throw new Error(error.message);
}

export async function updateStage(
  stageId: string,
  patch: Partial<Pick<Stage, 'weight' | 'advance_count' | 'auto_release_feedback' | 'opens_at' | 'due_at'>>,
): Promise<void> {
  const { error } = await supabase.from('stages').update(patch).eq('id', stageId);
  if (error) throw new Error(error.message);
}

export async function listSchools(): Promise<
  { id: string; name: string; division: Division; contact_email: string }[]
> {
  const { data, error } = await supabase
    .from('schools')
    .select('id, name, division, contact_email')
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as { id: string; name: string; division: Division; contact_email: string }[];
}

export async function listUnlinkedTeachers(): Promise<JudgeProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'teacher')
    .is('school_id', null)
    .order('created_at');
  if (error) throw new Error(error.message);
  return (data ?? []) as JudgeProfile[];
}

export async function linkTeacher(profileId: string, schoolId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ school_id: schoolId })
    .eq('id', profileId);
  if (error) throw new Error(error.message);
}

export async function linkTeamToOrder(teamId: string, orderId: string | null): Promise<void> {
  const { error } = await supabase.from('teams').update({ order_id: orderId }).eq('id', teamId);
  if (error) throw new Error(error.message);
}

export interface GateResult {
  dry_run: boolean;
  stage_ord: number;
  divisions: {
    division: Division;
    advance_count: number | null;
    rows: GatePreviewRow[];
  }[];
}

export async function runStageGate(stageOrd: number, dryRun: boolean): Promise<GateResult> {
  const { data, error } = await supabase.functions.invoke('run-stage-gate', {
    body: { stage_ord: stageOrd, dry_run: dryRun },
  });
  if (error) {
    let detail: string | null = null;
    try {
      const res = (error as { context?: Response }).context;
      if (res && typeof res.json === 'function') {
        const body = await res.json();
        if (typeof body?.error === 'string') detail = body.error;
      }
    } catch {
      /* ignore */
    }
    throw new Error(detail ?? 'Could not run the stage gate.');
  }
  return data as GateResult;
}
