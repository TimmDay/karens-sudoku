import type { Difficulty, DifficultyStats } from './types'

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

export const emptyStats = (): DifficultyStats => ({ completed: 0, failed: 0, abandoned: 0, clean: 0, totalSeconds: 0, best: null })

export const applyOutcome = (
  stats: DifficultyStats,
  outcome: 'completed' | 'failed' | 'abandoned',
  elapsedSeconds: number,
  mistakes: number,
): DifficultyStats => {
  if (outcome === 'failed') return { ...stats, failed: stats.failed + 1 }
  if (outcome === 'abandoned') return { ...stats, abandoned: stats.abandoned + 1 }
  return {
    ...stats,
    completed: stats.completed + 1,
    clean: stats.clean + (mistakes === 0 ? 1 : 0),
    totalSeconds: stats.totalSeconds + elapsedSeconds,
    best: stats.best === null ? elapsedSeconds : Math.min(stats.best, elapsedSeconds),
  }
}

const combine = (a: DifficultyStats, b: DifficultyStats): DifficultyStats => ({
  completed: a.completed + b.completed,
  failed: a.failed + b.failed,
  abandoned: a.abandoned + b.abandoned,
  clean: a.clean + b.clean,
  totalSeconds: a.totalSeconds + b.totalSeconds,
  best: a.best === null ? b.best : b.best === null ? a.best : Math.min(a.best, b.best),
})

export const summarizeStatistics = (statistics: Record<Difficulty, DifficultyStats>, filter: 'overall' | Difficulty = 'overall'): StatisticsSummary => {
  const stats = filter === 'overall' ? Object.values(statistics).reduce(combine, emptyStats()) : statistics[filter]
  const played = stats.completed + stats.failed + stats.abandoned
  return {
    played,
    completed: stats.completed,
    failed: stats.failed,
    abandoned: stats.abandoned,
    clean: stats.clean,
    completionRate: played ? Math.round((stats.completed / played) * 100) : null,
    average: stats.completed ? Math.round(stats.totalSeconds / stats.completed) : null,
    best: stats.best,
  }
}
