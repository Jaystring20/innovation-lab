// types/common.ts - Shared types and enums

// User roles and permissions
export type UserRole = 'super_admin' | 'organizer' | 'editor' | 'reviewer' | 'student';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type ProgrammingLanguage = 'blockly' | 'python' | 'cpp';

export type Status = 'draft' | 'active' | 'closed' | 'completed' | 'archived';

export type PublishStatus = 'draft' | 'published';

// Assets
export type AssetType = 'video' | 'pdf' | 'image' | 'document' | 'slide' | 'audio' | 'interactive' | 'link';

export interface ContentAsset {
  id: string;
  document_id: string;
  asset_type: AssetType;
  file_name: string;
  file_size?: number;
  file_url: string;
  mime_type?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Admin User
export interface AdminUser {
  id: string;
  user_id: string;
  role: UserRole;
  name: string;
  email: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

// Base timestamps
export interface TimestampedEntity {
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Error handling
export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
  }
}

// Notification types
export type NotificationType =
  | 'lesson_published'
  | 'assessment_available'
  | 'mission_unlocked'
  | 'submission_reviewed'
  | 'score_published'
  | 'team_invitation'
  | 'deadline_reminder';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  lesson_published: boolean;
  assessment_available: boolean;
  mission_unlocked: boolean;
  submission_reviewed: boolean;
  score_published: boolean;
  team_invitation: boolean;
  deadline_reminder: boolean;
  webhook_url?: string;
  webhook_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationEvent {
  id: string;
  user_id: string;
  event_type: NotificationType;
  event_data: Record<string, any>;
  created_at: string;
}

// Analytics
export interface StudentProgress {
  id: string;
  student_id: string;
  level_id: string;
  lessons_completed: number;
  assessments_completed: number;
  missions_completed: number;
  total_xp: number;
  current_xp: number;
  xp_to_next_level: number;
  current_level: number;
  quiz_scores: QuizScore[];
  last_activity_at?: string;
  created_at: string;
  updated_at: string;
}

export interface QuizScore {
  quiz_id: string;
  score: number;
  max_score: number;
  date: string;
}

export interface AnalyticsMetrics {
  totalStudents: number;
  lessonsCompleted: number;
  avgQuizScore: number;
  totalXpEarned: number;
  engagementRate: number;
}

// Form states
export type FormState = 'idle' | 'loading' | 'success' | 'error';

export interface FormError {
  field?: string;
  message: string;
}

// Common entity interface
export interface Entity extends TimestampedEntity {
  id: string;
}
