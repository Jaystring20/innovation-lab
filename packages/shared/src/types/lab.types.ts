/**
 * Lab Domain Types
 */

export interface School {
  id: string
  name: string
  division: 'Primary' | 'Secondary' | 'Sixth Form'
  createdAt: Date
}

export interface Team {
  id: string
  schoolId: string
  name: string
  createdAt: Date
}

export interface Stage {
  id: string
  division: 'Primary' | 'Secondary' | 'Sixth Form'
  name: string
  brief: string
  rubric: Rubric
  createdAt: Date
}

export interface Rubric {
  maxScore: number
  criteria: RubricCriterion[]
}

export interface RubricCriterion {
  name: string
  weight: number
  maxPoints: number
}
