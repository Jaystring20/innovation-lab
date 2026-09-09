/**
 * Organizer mutations — stage advancement, judge assignment, feedback release.
 * All operations are organizer-only at the RLS layer.
 */

import { supabase } from './supabase';

/* --------------------------------- Judge Assignment --------------------------------- */

export async function assignJudge(
  submissionId: string,
  judgeId: string,
  organizerId: string,
): Promise<void> {
  const { error } = await supabase.from('assignments').insert({
    submission_id: submissionId,
    judge_id: judgeId,
    assigned_by: organizerId,
    assigned_at: new Date().toISOString(),
  });

  if (error) throw new Error(`Failed to assign judge: ${error.message}`);
}

export async function unassignJudge(submissionId: string, judgeId: string): Promise<void> {
  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('submission_id', submissionId)
    .eq('judge_id', judgeId);

  if (error) throw new Error(`Failed to unassign judge: ${error.message}`);
}

export async function reassignJudge(
  submissionId: string,
  fromJudgeId: string,
  toJudgeId: string,
  organizerId: string,
): Promise<void> {
  // Delete old assignment and create new one in transaction
  await unassignJudge(submissionId, fromJudgeId);
  await assignJudge(submissionId, toJudgeId, organizerId);
}

/* --------------------------------- Stage Advancement --------------------------------- */

export interface AdvancementResult {
  advancedTeams: string[];
  eliminatedTeams?: string[];
}

export async function advanceTeams(
  stageId: string,
  teamIds: string[],
): Promise<AdvancementResult> {
  // Get stage info to find next stage
  const { data: stage, error: stageError } = await supabase
    .from('stages')
    .select('id, ord, name')
    .eq('id', stageId)
    .single();

  if (stageError) throw new Error(`Stage not found: ${stageError.message}`);

  // Find next stage
  const { data: nextStage, error: nextError } = await supabase
    .from('stages')
    .select('id')
    .eq('ord', (stage?.ord ?? 0) + 1)
    .single();

  if (nextError && nextError.code !== 'PGRST116') {
    throw new Error(`Error finding next stage: ${nextError.message}`);
  }

  // Update teams with advancement timestamp
  const { error: updateError } = await supabase
    .from('teams')
    .update({
      advanced_at: new Date().toISOString(),
    })
    .in('id', teamIds);

  if (updateError) throw new Error(`Failed to advance teams: ${updateError.message}`);

  // If there's a next stage, create submissions for advanced teams
  if (nextStage) {
    const submissions = teamIds.map((teamId) => ({
      team_id: teamId,
      stage_id: nextStage.id,
      status: 'not_started' as const,
      payload: {},
    }));

    const { error: subError } = await supabase.from('submissions').insert(submissions);
    if (subError) throw new Error(`Failed to create next stage submissions: ${subError.message}`);
  }

  return {
    advancedTeams: teamIds,
  };
}

export async function eliminateTeams(stageOrd: number, teamIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('teams')
    .update({
      eliminated_after_stage: stageOrd,
    })
    .in('id', teamIds);

  if (error) throw new Error(`Failed to eliminate teams: ${error.message}`);
}

/* --------------------------------- Feedback Release --------------------------------- */

export async function releaseFeedback(submissionId: string): Promise<void> {
  const { error } = await supabase
    .from('submissions')
    .update({
      feedback_released_at: new Date().toISOString(),
    })
    .eq('id', submissionId);

  if (error) throw new Error(`Failed to release feedback: ${error.message}`);
}

export async function releaseFeedbackBatch(submissionIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('submissions')
    .update({
      feedback_released_at: new Date().toISOString(),
    })
    .in('id', submissionIds);

  if (error) throw new Error(`Failed to release feedback: ${error.message}`);
}

export async function holdbackFeedback(submissionId: string): Promise<void> {
  const { error } = await supabase
    .from('submissions')
    .update({
      feedback_released_at: null,
    })
    .eq('id', submissionId);

  if (error) throw new Error(`Failed to hold back feedback: ${error.message}`);
}

/* --------------------------------- Submission Status --------------------------------- */

export async function returnSubmissionForChanges(submissionId: string): Promise<void> {
  const { error } = await supabase
    .from('submissions')
    .update({
      status: 'returned' as const,
    })
    .eq('id', submissionId);

  if (error) throw new Error(`Failed to return submission: ${error.message}`);
}

export async function restartSubmission(submissionId: string): Promise<void> {
  const { error } = await supabase
    .from('submissions')
    .update({
      status: 'not_started' as const,
      payload: {},
    })
    .eq('id', submissionId);

  if (error) throw new Error(`Failed to restart submission: ${error.message}`);
}

/* --------------------------------- Bulk Operations --------------------------------- */

export async function notifyJudges(judgeIds: string[], message: string): Promise<void> {
  // This would integrate with your email service
  // For now, just validate input
  if (judgeIds.length === 0) {
    throw new Error('No judges selected');
  }

  // TODO: Implement email notification
  console.log(`Would send message to ${judgeIds.length} judges: ${message}`);
}

export async function generateStandingsReport(stageId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_standings_report', {
    p_stage_id: stageId,
  });

  if (error) throw new Error(`Failed to generate report: ${error.message}`);
  return data as string;
}
