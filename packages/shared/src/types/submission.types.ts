/**
 * Submission Types
 */

export interface Submission {
  id: string
  teamId: string
  stageId: string
  status: 'draft' | 'submitted' | 'under_review' | 'feedback_ready' | 'completed'
  submittedAt?: Date
  createdAt: Date
}

export interface RoleAssignment {
  id: string
  studentId: string
  stageId: string
  role: string
  contributionPercent: number
  xpEarned: number
}
