/**
 * XP Calculation Utilities
 * Handles team XP pooling and individual XP contribution tracking
 */

export interface XPBreakdown {
  role: string
  studentName: string
  earnedXP: number
  contributionPercent: number
  displayXP: number
}

/**
 * Calculate team XP (sum of all contributions)
 */
export function calculateTeamXP(breakdowns: XPBreakdown[]): number {
  return breakdowns.reduce((sum, b) => sum + b.displayXP, 0)
}

/**
 * Calculate individual XP for a student across all roles
 */
export function calculateIndividualXP(
  breakdowns: XPBreakdown[],
  studentName: string
): number {
  return breakdowns
    .filter(b => b.studentName === studentName)
    .reduce((sum, b) => sum + b.displayXP, 0)
}

/**
 * Apply contribution percentage to earned XP
 */
export function applyContribution(earnedXP: number, percent: number): number {
  return Math.round((earnedXP * percent) / 100)
}

/**
 * Get role-specific XP limits (can be customized per stage)
 */
export function getRoleLimits(role: string): { min: number; max: number } {
  const limits: Record<string, { min: number; max: number }> = {
    Designer: { min: 0, max: 500 },
    Builder: { min: 0, max: 450 },
    'AI Engineer': { min: 0, max: 600 },
    Presenter: { min: 0, max: 400 },
  }
  return limits[role] || { min: 0, max: 500 }
}
