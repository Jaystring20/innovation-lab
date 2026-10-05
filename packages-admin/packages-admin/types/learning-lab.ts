// types/learning-lab.ts - Learning Lab types

import { Entity, PublishStatus, AssetType, DifficultyLevel, ProgrammingLanguage, ContentAsset } from './common';

// Learning Track Tiers
export interface LabPrimaryStage extends Entity {
  name: string;
  description: string;
  tier: string;
  stage: string;
  order_index: number;
  is_published: boolean;
}

// Levels
export interface Level extends Entity {
  name: string;
  description?: string;
  tier: string;
  stage: string;
  order_index: number;
  status: PublishStatus;
  learning_outcomes?: string[];
}

export interface CreateLevelInput {
  name: string;
  description?: string;
  tier: string;
  stage: string;
  order_index: number;
  learning_outcomes?: string[];
}

export interface UpdateLevelInput {
  name?: string;
  description?: string;
  tier?: string;
  stage?: string;
  order_index?: number;
  learning_outcomes?: string[];
}

// Lessons
export interface Lesson extends Entity {
  level_id: string;
  title: string;
  description?: string;
  content: string;
  learning_objectives?: string[];
  duration_minutes?: number;
  assets: ContentAsset[];
  status: PublishStatus;
}

export interface CreateLessonInput {
  level_id: string;
  title: string;
  description?: string;
  content: string;
  learning_objectives?: string[];
  duration_minutes?: number;
  assets?: Partial<ContentAsset>[];
}

export interface UpdateLessonInput {
  title?: string;
  description?: string;
  content?: string;
  learning_objectives?: string[];
  duration_minutes?: number;
  assets?: Partial<ContentAsset>[];
}

// Assessments / Quiz
export type QuestionType = 'multiple_choice' | 'true_false' | 'image_select' | 'drag_order';

export interface AssessmentQuestion {
  id?: string;
  type: QuestionType;
  question_text: string;
  options: QuestionOption[];
  correct_answer: string | string[];
  points?: number;
  explanation?: string;
  time_limit_seconds?: number;
}

export interface QuestionOption {
  id?: string;
  text: string;
  image_url?: string;
  is_correct?: boolean;
}

export interface Assessment extends Entity {
  level_id: string;
  title: string;
  description?: string;
  questions: AssessmentQuestion[];
  passing_score_percent: number;
  total_points: number;
  status: PublishStatus;
}

export interface CreateAssessmentInput {
  level_id: string;
  title: string;
  description?: string;
  questions: AssessmentQuestion[];
  passing_score_percent?: number;
}

export interface UpdateAssessmentInput {
  title?: string;
  description?: string;
  questions?: AssessmentQuestion[];
  passing_score_percent?: number;
}

// Lab Missions
export interface Mission extends Entity {
  level_id: string;
  title: string;
  description?: string;
  difficulty: DifficultyLevel;
  programming_language: ProgrammingLanguage;
  tinkercad_design_id?: string;
  xp_reward: number;
  learning_objectives?: string[];
  instructions?: string;
  hints: string[];
  status: PublishStatus;
}

export interface CreateMissionInput {
  level_id: string;
  title: string;
  description?: string;
  difficulty: DifficultyLevel;
  programming_language: ProgrammingLanguage;
  tinkercad_design_id?: string;
  xp_reward: number;
  learning_objectives?: string[];
  instructions?: string;
  hints?: string[];
}

export interface UpdateMissionInput {
  title?: string;
  description?: string;
  difficulty?: DifficultyLevel;
  programming_language?: ProgrammingLanguage;
  tinkercad_design_id?: string;
  xp_reward?: number;
  learning_objectives?: string[];
  instructions?: string;
  hints?: string[];
}

// Publish tracking
export interface PublishRecord extends Entity {
  level_id: string;
  published_by: string;
  publish_date: string;
  version: number;
  notes?: string;
}

// Analytics
export interface LevelCompletionStats {
  level_id: string;
  level_name: string;
  total_students: number;
  completed_count: number;
  completion_rate: number;
  avg_time_minutes: number;
}

export interface LessonEngagement {
  lesson_id: string;
  lesson_title: string;
  views: number;
  completion_rate: number;
  avg_time_minutes: number;
  assets_used: {
    asset_type: AssetType;
    usage_count: number;
  }[];
}

export interface AssessmentStats {
  assessment_id: string;
  assessment_title: string;
  attempts: number;
  avg_score: number;
  passing_rate: number;
  most_missed_question?: string;
}

// Form states and validation
export interface LevelFormData {
  name: string;
  description?: string;
  tier: string;
  stage: string;
  order_index: number;
  learning_outcomes: string[];
}

export interface LessonFormData {
  level_id: string;
  title: string;
  description?: string;
  content: string;
  learning_objectives: string[];
  duration_minutes?: number;
  assets: {
    type: AssetType;
    url: string;
    name: string;
  }[];
}

export interface AssessmentFormData {
  level_id: string;
  title: string;
  description?: string;
  questions: {
    type: QuestionType;
    text: string;
    options: { text: string; isCorrect: boolean }[];
    points: number;
    explanation?: string;
  }[];
  passing_score_percent: number;
}

export interface MissionFormData {
  level_id: string;
  title: string;
  description?: string;
  difficulty: DifficultyLevel;
  language: ProgrammingLanguage;
  tinkercad_id?: string;
  xp_reward: number;
  learning_objectives: string[];
  instructions?: string;
  hints: string[];
}
