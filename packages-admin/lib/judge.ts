import { supabase } from '@/integrations/supabase/client';

/* ------------------------------------------------------------------ *
 * APEN 2026 Judge Management — data layer (RLS-backed)
 * ------------------------------------------------------------------ */

export type DeliverableKind = 'video' | 'prototype' | 'prompt_log' | 'live';
export type SubmissionStatus =
  | 'not_started'
  | 'submitted'
  | 'under_review'
  | 'scored'
  | 'returned';

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
  assigned_by?: string;
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
  division: string;
  payload: Record<string, any>;
  status: SubmissionStatus;
  due_at: string | null;
  my_score: (ScoreInput & { comments: string | null }) | null;
}

export interface SubmissionForAssignment {
  id: string;
  team_id: string;
  stage_id: string;
  status: SubmissionStatus;
  team_name: string;
  stage_name: string;
  stage_ord: number;
  division: string;
  judge_count: number;
}

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

/* ----------------------------- Organizer Judges ----------------------------- */

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
    .select('id, submission_id, judge_id, assigned_at, assigned_by')
    .order('assigned_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Assignment[];
}

export async function assignJudge(
  submissionId: string,
  judgeId: string,
  organizerId: string
): Promise<void> {
  const { error } = await supabase
    .from('review_assignments')
    .upsert(
      { submission_id: submissionId, judge_id: judgeId, assigned_by: organizerId },
      { onConflict: 'submission_id,judge_id', ignoreDuplicates: true }
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

export async function getJudgeQueueStats(judgeId: string): Promise<{
  total: number;
  pending: number;
  completed: number;
}> {
  const { data, error } = await supabase
    .rpc('get_judge_queue_stats', { p_judge_id: judgeId });

  if (error) {
    console.error('Could not fetch stats:', error);
    return { total: 0, pending: 0, completed: 0 };
  }

  const result = data as any;
  return {
    total: result?.total ?? 0,
    pending: result?.pending ?? 0,
    completed: result?.completed ?? 0,
  };
}

export async function submitScore(
  submissionId: string,
  judgeId: string,
  score: ScoreInput
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
    { onConflict: 'submission_id,judge_id' }
  );
  if (error) throw new Error(error.message);
}
