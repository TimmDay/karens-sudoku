import { describe, expect, it } from 'vitest'
import { applyOutcome, emptyStats, summarizeStatistics } from './statistics'
import type { Difficulty, DifficultyStats } from './types'

describe('statistics', () => {
  let easy = applyOutcome(emptyStats(), 'completed', 120, 0)
  easy = applyOutcome(easy, 'completed', 180, 1)
  easy = applyOutcome(easy, 'failed', 60, 3)

  const statistics: Record<Difficulty, DifficultyStats> = {
    easy,
    medium: emptyStats(),
    hard: applyOutcome(emptyStats(), 'abandoned', 30, 0),
    expert: emptyStats(),
  }

  it('calculates overall summaries across every difficulty', () => {
    expect(summarizeStatistics(statistics)).toEqual({
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
    expect(summarizeStatistics(statistics, 'hard')).toEqual({
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
