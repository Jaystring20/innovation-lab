import { supabase } from './supabase';
import type { Stage, Submission, Feedback, Team } from './lab';

/**
 * APEN 2026 Student Platform — data layer for the complete student learning experience.
 * Extends the core lab.ts with student-specific queries for missions, progress, XP, badges,
 * team collaboration, and portfolio tracking.
 */

/* ----------------------- Student Experience Types ----------------------- */

export interface Mission {
  id: string;
  stage_id: string;
  division: 'primary' | 'secondary' | 'sixth_form';
  title: string;
  brief: string;
  learning_objectives: string[];
  resources: MissionResource[];
  created_at: string;
}

export interface MissionResource {
  id: string;
  title: string;
  type: 'video' | 'article' | 'guide' | 'template' | 'tool';
  url: string;
  description?: string;
}

export interface StudentXP {
  student_id: string;
  total_xp: number;
  current_level: number;
  stage_xp: Record<string, number>;
  updated_at: string;
}

export interface Badge {
  id: string;
  key: string;
  title: string;
  description: string;
  icon_emoji: string;
  criteria: string;
  unlocked_at?: string;
}

export interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  role: 'captain' | 'engineer' | 'designer' | 'researcher';
  xp: number;
  status: 'active' | 'inactive';
  joined_at: string;
}

export interface StudentSubmissionView {
  id: string;
  stage_id: string;
  stage_name: string;
  status: string;
  submitted_at: string | null;
  submitted_by?: string;
  payload: Record<string, any>;
  feedback?: Feedback;
}

export interface StudentProgress {
  team_id: string;
  team_name: string;
  overall_xp: number;
  rank: number;
  total_teams: number;
  stages_completed: string[];
  current_stage: Stage | null;
  completion_percent: number;
}

export interface LeaderboardEntry {
  rank: number;
  team_name: string;
  division: string;
  xp: number;
  badges_earned: number;
  current_stage: string;
  school: string;
}

/* ----------------------- Queries ----------------------- */

/**
 * Get all missions for a student's stage and division.
 */
export async function getMissions(
  stageId: string,
  division: string,
): Promise<Mission[]> {
  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .eq('stage_id', stageId)
    .eq('division', division);

  if (error) throw new Error(error.message);
  return (data ?? []) as Mission[];
}

/**
 * Get the current stage for a student's team.
 */
export async function getCurrentStage(teamId: string): Promise<Stage | null> {
  const { data, error } = await supabase
    .from('submissions')
    .select('stages(*)')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data?.stages ?? null;
}

/**
 * Get all submissions for a student's team with feedback.
 */
export async function getTeamSubmissions(teamId: string): Promise<StudentSubmissionView[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('id, stage_id, status, submitted_at, payload, stages(name)')
    .eq('team_id', teamId)
    .order('created_at');

  if (error) throw new Error(error.message);

  const submissions = (data ?? []) as any[];
  return submissions.map((s) => ({
    id: s.id,
    stage_id: s.stage_id,
    stage_name: s.stages?.name ?? 'Unknown',
    status: s.status,
    submitted_at: s.submitted_at,
    payload: s.payload,
  }));
}

/**
 * Get team members for collaboration view.
 */
export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('id, email, full_name, role, xp, status, joined_at')
    .eq('team_id', teamId)
    .order('role');

  if (error) throw new Error(error.message);
  return (data ?? []) as TeamMember[];
}

/**
 * Get student's current XP and level.
 */
export async function getStudentXP(studentId: string): Promise<StudentXP | null> {
  const { data, error } = await supabase
    .from('student_xp')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return (data as StudentXP | null) ?? null;
}

/**
 * Get all badges and which ones are unlocked for a student.
 */
export async function getStudentBadges(studentId: string): Promise<Badge[]> {
  const { data, error } = await supabase
    .from('badges')
    .select('*, student_badges(unlocked_at)')
    .order('title');

  if (error) throw new Error(error.message);

  return ((data ?? []) as any[]).map((b) => ({
    ...b,
    unlocked_at: b.student_badges?.[0]?.unlocked_at,
  }));
}

/**
 * Get student's overall progress and ranking.
 */
export async function getStudentProgress(
  studentId: string,
  teamId: string,
  schoolId: string,
): Promise<StudentProgress | null> {
  // Fetch team info
  const { data: teamData, error: teamError } = await supabase
    .from('teams')
    .select('id, name')
    .eq('id', teamId)
    .maybeSingle();

  if (teamError) throw new Error(teamError.message);
  if (!teamData) return null;

  // Fetch team XP
  const { data: xpData, error: xpError } = await supabase
    .from('team_xp')
    .select('total_xp, rank, total_teams')
    .eq('team_id', teamId)
    .maybeSingle();

  if (xpError && xpError.code !== 'PGRST116')
    throw new Error(xpError.message);

  // Fetch completed stages
  const { data: submissionsData, error: subsError } = await supabase
    .from('submissions')
    .select('stage_id, status')
    .eq('team_id', teamId);

  if (subsError) throw new Error(subsError.message);

  // Fetch current stage
  const { data: stagesData, error: stagesError } = await supabase
    .from('stages')
    .select('*')
    .order('ord')
    .limit(1);

  if (stagesError) throw new Error(stagesError.message);

  const completedStages = submissionsData
    ?.filter((s) => s.status === 'scored')
    .map((s) => s.stage_id) ?? [];

  return {
    team_id: teamId,
    team_name: teamData.name,
    overall_xp: xpData?.total_xp ?? 0,
    rank: xpData?.rank ?? 0,
    total_teams: xpData?.total_teams ?? 0,
    stages_completed: completedStages,
    current_stage: stagesData?.[0] ?? null,
    completion_percent: Math.round((completedStages.length / 4) * 100),
  };
}

/**
 * Get leaderboard for student's division.
 */
export async function getLeaderboard(
  schoolId: string,
  division: string,
  limit: number = 10,
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('team_standings')
    .select(
      'team_id, team_name, division, xp, badges_earned, current_stage, schools(name)',
    )
    .eq('school_id', schoolId)
    .eq('division', division)
    .order('xp', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return ((data ?? []) as any[]).map((entry, idx) => ({
    rank: idx + 1,
    team_name: entry.team_name,
    division: entry.division,
    xp: entry.xp,
    badges_earned: entry.badges_earned ?? 0,
    current_stage: entry.current_stage,
    school: entry.schools?.name ?? 'Unknown',
  }));
}

/**
 * Submit XP earned by a student for an action (submission, feedback received, etc).
 */
export async function awardXP(
  studentId: string,
  teamId: string,
  amount: number,
  reason: string,
): Promise<void> {
  const { error } = await supabase.rpc('award_student_xp', {
    p_student_id: studentId,
    p_team_id: teamId,
    p_amount: amount,
    p_reason: reason,
  });

  if (error) throw new Error(error.message);
}

/**
 * Unlock a badge for a student.
 */
export async function unlockBadge(studentId: string, badgeKey: string): Promise<void> {
  const { error } = await supabase.rpc('unlock_badge', {
    p_student_id: studentId,
    p_badge_key: badgeKey,
  });

  if (error) throw new Error(error.message);
}

/**
 * Get portfolio view - all completed submissions grouped by stage.
 */
export async function getPortfolio(teamId: string): Promise<Record<string, StudentSubmissionView[]>> {
  const { data, error } = await supabase
    .from('submissions')
    .select('id, stage_id, status, submitted_at, payload, stages(name, key)')
    .eq('team_id', teamId)
    .eq('status', 'scored')
    .order('created_at');

  if (error) throw new Error(error.message);

  const portfolio: Record<string, StudentSubmissionView[]> = {};
  for (const submission of data ?? []) {
    const key = (submission.stages as any)?.key ?? 'unknown';
    if (!portfolio[key]) portfolio[key] = [];
    portfolio[key].push({
      id: submission.id,
      stage_id: submission.stage_id,
      stage_name: (submission.stages as any)?.name ?? 'Unknown',
      status: submission.status,
      submitted_at: submission.submitted_at,
      payload: submission.payload,
    });
  }

  return portfolio;
}

/**
 * Get resources for a stage (learning materials, guides, tools).
 */
export async function getStageResources(stageId: string): Promise<MissionResource[]> {
  const { data, error } = await supabase
    .from('stage_resources')
    .select('*')
    .eq('stage_id', stageId)
    .order('order');

  if (error) throw new Error(error.message);
  return (data ?? []) as MissionResource[];
}

/**
 * Mark a resource as viewed by student (for analytics).
 */
export async function markResourceViewed(studentId: string, resourceId: string): Promise<void> {
  const { error } = await supabase.from('resource_views').insert({
    student_id: studentId,
    resource_id: resourceId,
    viewed_at: new Date().toISOString(),
  });

  if (error && error.code !== 'PGRST103') throw new Error(error.message);
}
