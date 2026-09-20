// Admin Dashboard Types
// Shared TypeScript interfaces for all components

export interface Level {
  id: string;
  document_id: string;
  tier_id: string;
  stage_id: string;
  title: string;
  order_index: number;
  outcome_statement: string;
  status: 'draft' | 'published' | 'archived';
  version: number;
  last_edited_by?: string;
  last_edited_at?: string;
  created_at: string;
}

export interface Lesson {
  id: string;
  document_id: string;
  level_id: string;
  title: string;
  content_type: 'video' | 'interactive' | 'reading';
  content_url?: string;
  content_body?: string;
  estimated_minutes: number;
  xp_reward: number;
  order_index: number;
  status: 'draft' | 'published' | 'archived';
  version: number;
  supplementary_assets?: string[];
  created_at: string;
}

export interface AssessmentQuestion {
  id?: string;
  assessment_id: string;
  question_type: 'multiple_choice' | 'true_false' | 'drag_order' | 'image_select';
  question_text: string;
  image_url?: string;
  options: Record<string, any>[];
  explanation: string;
  order_index: number;
  status: 'draft' | 'published' | 'archived';
}

export interface Assessment {
  id: string;
  document_id: string;
  level_id: string;
  title: string;
  passing_score_pct: number;
  max_attempts?: number;
  status: 'draft' | 'published' | 'archived';
  version: number;
  questions?: AssessmentQuestion[];
  created_at: string;
}

export interface LabMission {
  id: string;
  document_id: string;
  tier_id: string;
  level_id: string;
  title: string;
  description: string;
  instructions: string;
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
  duration_minutes: number;
  language: 'blockly' | 'python' | 'cpp';
  tinkercad_design_id?: string;
  learning_objectives?: string[];
  hints?: string[];
  starter_code?: string;
  test_cases?: Record<string, any>[];
  xp_reward: number;
  status: 'draft' | 'published' | 'archived';
  version: number;
  supplementary_assets?: string[];
  created_at: string;
}

export interface ContentAsset {
  id: string;
  document_id: string;
  asset_type: 'video' | 'pdf' | 'image' | 'document' | 'slide' | 'audio' | 'interactive' | 'link';
  title: string;
  description?: string;
  file_name?: string;
  file_url: string;
  file_size?: number;
  storage_path?: string;
  is_external: boolean;
  uploaded_by?: string;
  created_at: string;
}

export interface Tier {
  id: string;
  name: string;
  slug: string;
  grade_range: string;
  accent_color: string;
  vibe: string;
  description: string;
  created_at: string;
}

export interface AdminUser {
  id: string;
  user_id: string;
  role: 'super_admin' | 'curriculum_editor' | 'organizer' | 'viewer';
  tier_scope?: string[];
  created_at: string;
}

export interface DashboardState {
  selectedTier?: string;
  selectedStage?: string;
  selectedLevel?: string;
  editingMode: 'create' | 'edit' | 'view';
}
