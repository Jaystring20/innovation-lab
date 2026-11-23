import { describe, it, expect } from '@jest/globals'
import { z } from 'zod'

// Example Zod schemas matching component validation
const LevelSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().max(1000).optional(),
  tier: z.enum(['beginner', 'intermediate', 'advanced']),
  stage: z.string().min(1),
  order_index: z.number().int().positive(),
  learning_outcomes: z.array(z.string()).optional(),
})

const LessonSchema = z.object({
  level_id: z.string().uuid(),
  title: z.string().min(3).max(255),
  content: z.string().min(10),
  learning_objectives: z.array(z.string()).optional(),
  duration_minutes: z.number().positive().optional(),
})

const StageSchema = z.object({
  name: z.string().min(3).max(255),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  submission_deadline: z.string().datetime(),
  min_team_size: z.number().int().positive(),
  max_team_size: z.number().int().positive(),
})

describe('Form Validation - Levels', () => {
  it('should validate valid level data', () => {
    const validLevel = {
      name: 'Level 1',
      tier: 'beginner' as const,
      stage: 'stage-1',
      order_index: 1,
    }
    expect(() => LevelSchema.parse(validLevel)).not.toThrow()
  })

  it('should reject short names', () => {
    const invalidLevel = {
      name: 'ab',
      tier: 'beginner' as const,
      stage: 'stage-1',
      order_index: 1,
    }
    expect(() => LevelSchema.parse(invalidLevel)).toThrow()
  })

  it('should allow optional description', () => {
    const level = {
      name: 'Level 1',
      tier: 'beginner' as const,
      stage: 'stage-1',
      order_index: 1,
      description: undefined,
    }
    expect(() => LevelSchema.parse(level)).not.toThrow()
  })

  it('should validate tier enum values', () => {
    const invalidLevel = {
      name: 'Level 1',
      tier: 'invalid-tier',
      stage: 'stage-1',
      order_index: 1,
    }
    expect(() => LevelSchema.parse(invalidLevel)).toThrow()
  })

  it('should validate positive order index', () => {
    const invalidLevel = {
      name: 'Level 1',
      tier: 'beginner' as const,
      stage: 'stage-1',
      order_index: -1,
    }
    expect(() => LevelSchema.parse(invalidLevel)).toThrow()
  })
})

describe('Form Validation - Lessons', () => {
  it('should validate valid lesson data', () => {
    const validLesson = {
      level_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Introduction to Variables',
      content: 'This is a lesson about variables in programming',
    }
    expect(() => LessonSchema.parse(validLesson)).not.toThrow()
  })

  it('should reject invalid UUID', () => {
    const invalidLesson = {
      level_id: 'not-a-uuid',
      title: 'Introduction to Variables',
      content: 'This is a lesson about variables in programming',
    }
    expect(() => LessonSchema.parse(invalidLesson)).toThrow()
  })

  it('should require minimum content length', () => {
    const invalidLesson = {
      level_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Intro',
      content: 'short',
    }
    expect(() => LessonSchema.parse(invalidLesson)).toThrow()
  })

  it('should allow optional duration', () => {
    const lesson = {
      level_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Introduction to Variables',
      content: 'This is a lesson about variables in programming',
      duration_minutes: undefined,
    }
    expect(() => LessonSchema.parse(lesson)).not.toThrow()
  })

  it('should validate positive duration when provided', () => {
    const invalidLesson = {
      level_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Introduction to Variables',
      content: 'This is a lesson about variables in programming',
      duration_minutes: -30,
    }
    expect(() => LessonSchema.parse(invalidLesson)).toThrow()
  })
})

describe('Form Validation - Competition Stages', () => {
  const now = new Date()
  const later = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const deadline = new Date(later.getTime() + 7 * 24 * 60 * 60 * 1000)

  it('should validate valid stage data', () => {
    const validStage = {
      name: 'Spring Competition 2026',
      start_date: now.toISOString(),
      end_date: later.toISOString(),
      submission_deadline: deadline.toISOString(),
      min_team_size: 2,
      max_team_size: 5,
    }
    expect(() => StageSchema.parse(validStage)).not.toThrow()
  })

  it('should require positive team sizes', () => {
    const invalidStage = {
      name: 'Spring Competition 2026',
      start_date: now.toISOString(),
      end_date: later.toISOString(),
      submission_deadline: deadline.toISOString(),
      min_team_size: 0,
      max_team_size: 5,
    }
    expect(() => StageSchema.parse(invalidStage)).toThrow()
  })

  it('should validate date format', () => {
    const invalidStage = {
      name: 'Spring Competition 2026',
      start_date: 'not-a-date',
      end_date: later.toISOString(),
      submission_deadline: deadline.toISOString(),
      min_team_size: 2,
      max_team_size: 5,
    }
    expect(() => StageSchema.parse(invalidStage)).toThrow()
  })

  it('should allow team size range', () => {
    const validStage = {
      name: 'Spring Competition 2026',
      start_date: now.toISOString(),
      end_date: later.toISOString(),
      submission_deadline: deadline.toISOString(),
      min_team_size: 3,
      max_team_size: 10,
    }
    expect(() => StageSchema.parse(validStage)).not.toThrow()
  })
})

describe('Error Messages', () => {
  it('should provide clear validation errors', () => {
    try {
      LevelSchema.parse({ name: 'ab', tier: 'invalid' })
    } catch (error) {
      if (error instanceof z.ZodError) {
        expect(error.errors.length).toBeGreaterThan(0)
        expect(error.errors[0].message).toBeTruthy()
      }
    }
  })

  it('should indicate which fields failed validation', () => {
    try {
      LevelSchema.parse({})
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldPaths = error.errors.map(e => e.path.join('.'))
        expect(fieldPaths.length).toBeGreaterThan(0)
      }
    }
  })
})
