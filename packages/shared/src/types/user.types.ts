/**
 * User and Auth Types
 */

export type UserRole = 'student' | 'teacher' | 'judge' | 'organizer'

export interface User {
  id: string
  email: string
  role: UserRole
  schoolId?: string
  createdAt: Date
}
