import { describe, expect, it } from 'vitest'
import { summarizeAttempts } from './statistics'
import type { Attempt } from './types'

const attempt = (difficulty: Attempt['difficulty'], outcome: Attempt['outcome'], elapsedSeconds: number, mistakes: number): Attempt => ({
  id: `${difficulty}-${outcome}-${elapsedSeconds}`,
  puzzleId: 'puzzle',
  difficulty,
  startedAt: 1,
  endedAt: outcome === 'playing' ? null : 2,
  elapsedSeconds,
  mistakes,
  outcome,
})

describe('statistics', () => {
  const attempts = [
    attempt('easy', 'completed', 120, 0),
    attempt('easy', 'completed', 180, 1),
    attempt('easy', 'failed', 60, 3),
    attempt('hard', 'abandoned', 30, 0),
  ]

  it('calculates overall summaries from completed attempts only', () => {
    expect(summarizeAttempts(attempts)).toEqual({
      played: 4,
      completed: 2,
      failed: 1,
      abandoned: 1,
      clean: 1,
      completionRate: 50,
      average: 150,
      best: 120,
    })
  })

  it('filters every statistic by difficulty', () => {
    expect(summarizeAttempts(attempts, 'hard')).toEqual({
      played: 1,
      completed: 0,
      failed: 0,
      abandoned: 1,
      clean: 0,
      completionRate: 0,
      average: null,
      best: null,
    })
  })
})
