import type { Attempt, Difficulty } from './types'

export interface StatisticsSummary {
  played: number
  completed: number
  failed: number
  abandoned: number
  clean: number
  completionRate: number | null
  average: number | null
  best: number | null
}

export const summarizeAttempts = (attempts: readonly Attempt[], filter: 'overall' | Difficulty = 'overall'): StatisticsSummary => {
  const selected = filter === 'overall' ? attempts : attempts.filter((attempt) => attempt.difficulty === filter)
  const finished = selected.filter((attempt) => attempt.outcome === 'completed')
  return {
    played: selected.length,
    completed: finished.length,
    failed: selected.filter((attempt) => attempt.outcome === 'failed').length,
    abandoned: selected.filter((attempt) => attempt.outcome === 'abandoned').length,
    clean: finished.filter((attempt) => attempt.mistakes === 0).length,
    completionRate: selected.length ? Math.round((finished.length / selected.length) * 100) : null,
    average: finished.length ? Math.round(finished.reduce((sum, attempt) => sum + attempt.elapsedSeconds, 0) / finished.length) : null,
    best: finished.length ? Math.min(...finished.map((attempt) => attempt.elapsedSeconds)) : null,
  }
}
