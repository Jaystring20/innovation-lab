/**
 * Global Constants
 */

export const DIVISIONS = {
  PRIMARY: 'Primary',
  SECONDARY: 'Secondary',
  SIXTH_FORM: 'Sixth Form',
} as const

export const STAGES = {
  DESIGN_PITCH: 'Design Pitch',
  HARDWARE_BUILD: 'Hardware Build',
  AI_LAYER: 'AI Layer',
  BATTLE: 'Battle',
} as const

export const XP_REWARDS = {
  SUBMIT: 100,
  FEEDBACK: 25,
  ITERATE: 50,
  EARLY_SUBMISSION: 25,
  PEER_REVIEW: 30,
  STAGE_COMPLETE: 200,
} as const

export const BADGE_THRESHOLDS = {
  BRONZE: 1000,
  SILVER: 2500,
  GOLD: 4000,
  PLATINUM: 5000,
} as const

export const CACHE_EXPIRY_MS = {
  SCHOOL_DATA: 7 * 24 * 60 * 60 * 1000, // 7 days
  FEEDBACK: 5 * 60 * 1000, // 5 minutes
  LEADERBOARD: 30 * 1000, // 30 seconds
  SUBMISSIONS: 24 * 60 * 60 * 1000, // 24 hours
} as const

export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280,
} as const
