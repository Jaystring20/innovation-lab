// types/competition.ts - Competition types

import { Entity, Status } from './common';

// Competition Stages
export interface CompetitionStage extends Entity {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  submission_deadline: string;
  min_team_size: number;
  max_team_size: number;
  theme?: string;
  requirements?: string;
  order_index: number;
  status: Status;
}

export interface CreateStageInput {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  submission_deadline: string;
  min_team_size: number;
  max_team_size: number;
  theme?: string;
  requirements?: string;
  order_index: number;
}

export interface UpdateStageInput {
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  submission_deadline?: string;
  min_team_size?: number;
  max_team_size?: number;
  theme?: string;
  requirements?: string;
  order_index?: number;
  status?: Status;
}

// Teams
export type TeamStatus = 'active' | 'inactive' | 'disqualified';

export interface Team extends Entity {
  name: string;
  description?: string;
  school_or_org: string;
  stage_id: string;
  mentor_name?: string;
  mentor_email?: string;
  status: TeamStatus;
}

export interface TeamMember {
  id: string;
  team_id: string;
  name: string;
  email: string;
  role: 'leader' | 'developer' | 'designer' | 'researcher';
  created_at: string;
}

export interface CreateTeamInput {
  name: string;
  description?: string;
  school_or_org: string;
  stage_id: string;
  mentor_name?: string;
  mentor_email?: string;
  members: {
    name: string;
    email: string;
    role: 'leader' | 'developer' | 'designer' | 'researcher';
  }[];
}

export interface UpdateTeamInput {
  name?: string;
  description?: string;
  school_or_org?: string;
  mentor_name?: string;
  mentor_email?: string;
  status?: TeamStatus;
}

// Submissions
export type SubmissionStatus = 'pending' | 'under_review' | 'accepted' | 'rejected';

export interface Submission extends Entity {
  team_id: string;
  stage_id: string;
  title: string;
  description?: string;
  repo_url?: string;
  demo_url?: string;
  status: SubmissionStatus;
}

export interface CreateSubmissionInput {
  team_id: string;
  stage_id: string;
  title: string;
  description?: string;
  repo_url?: string;
  demo_url?: string;
}

export interface UpdateSubmissionInput {
  title?: string;
  description?: string;
  repo_url?: string;
  demo_url?: string;
  status?: SubmissionStatus;
}

// Submission Reviews
export type ReviewStatus = 'reviewing' | 'pending_revision' | 'approved';

export interface SubmissionReview extends Entity {
  submission_id: string;
  reviewer_comments?: string;
  status: ReviewStatus;
}

export interface CreateReviewInput {
  submission_id: string;
  reviewer_comments?: string;
  status?: ReviewStatus;
}

export interface UpdateReviewInput {
  reviewer_comments?: string;
  status?: ReviewStatus;
}

// Submission Scores
export interface SubmissionScore extends Entity {
  submission_id: string;
  innovation_score: number;
  implementation_score: number;
  collaboration_score: number;
  sustainability_score: number;
  presentation_score: number;
  feedback?: string;
}

export type ScoringCategory =
  | 'innovation'
  | 'implementation'
  | 'collaboration'
  | 'sustainability'
  | 'presentation';

export interface CreateScoreInput {
  submission_id: string;
  innovation_score: number;
  implementation_score: number;
  collaboration_score: number;
  sustainability_score: number;
  presentation_score: number;
  feedback?: string;
}

export interface UpdateScoreInput {
  innovation_score?: number;
  implementation_score?: number;
  collaboration_score?: number;
  sustainability_score?: number;
  presentation_score?: number;
  feedback?: string;
}

// Scoring utilities
export interface ScoreStats {
  submission_id: string;
  team_name: string;
  total_score: number;
  average_score: number;
  rank?: number;
  category_scores: {
    category: ScoringCategory;
    score: number;
  }[];
}

// Competition analytics
export interface CompetitionStats {
  stage_id: string;
  total_teams: number;
  submissions_count: number;
  reviews_completed: number;
  avg_score: number;
}

export interface TeamSubmissionStats {
  team_id: string;
  team_name: string;
  stage_id: string;
  submission_count: number;
  avg_score: number;
  status: SubmissionStatus;
  rank?: number;
}

// Form states and validation
export interface StageFormData {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  submission_deadline: string;
  min_team_size: number;
  max_team_size: number;
  theme?: string;
  requirements?: string;
  order_index: number;
}

export interface TeamFormData {
  name: string;
  description?: string;
  school_or_org: string;
  stage_id: string;
  mentor_name?: string;
  mentor_email?: string;
  members: {
    name: string;
    email: string;
    role: 'leader' | 'developer' | 'designer' | 'researcher';
  }[];
}

export interface SubmissionFormData {
  team_id: string;
  stage_id: string;
  title: string;
  description?: string;
  repo_url?: string;
  demo_url?: string;
  status?: SubmissionStatus;
}

export interface ScoringFormData {
  submission_id: string;
  innovation_score: number;
  implementation_score: number;
  collaboration_score: number;
  sustainability_score: number;
  presentation_score: number;
  feedback?: string;
}
