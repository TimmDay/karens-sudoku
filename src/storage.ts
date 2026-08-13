import type { AppData, Difficulty, DifficultyStats, GameState, Puzzle } from './types'
import { validatePuzzle } from './generator'
import { applyOutcome, emptyStats } from './statistics'

const KEY = 'karens-sudoku:data:v1'
export const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert']

export const defaultData = (): AppData => ({
  version: 1,
  games: {},
  statistics: { easy: emptyStats(), medium: emptyStats(), hard: emptyStats(), expert: emptyStats() },
  queued: {},
  recentPuzzleIds: [],
  settings: { theme: 'system', introductionSeen: false },
})

const validGame = (game: unknown): game is GameState =>
  Boolean(game && typeof game === 'object' && validatePuzzle((game as GameState).puzzle) && Array.isArray((game as GameState).cells))

const validStats = (stats: unknown): stats is DifficultyStats => {
  if (!stats || typeof stats !== 'object') return false
  const value = stats as DifficultyStats
  return (
    typeof value.completed === 'number' &&
    typeof value.failed === 'number' &&
    typeof value.abandoned === 'number' &&
    typeof value.clean === 'number' &&
    typeof value.totalSeconds === 'number' &&
    (value.best === null || typeof value.best === 'number')
  )
}

// Saves made before the statistics rewrite kept a flat, ever-growing log of every attempt
// instead of a per-difficulty summary. Fold any of those into the new shape once on load so
// existing totals (best times, completion counts) aren't lost.
interface LegacyAttempt {
  difficulty: Difficulty
  outcome: 'playing' | 'completed' | 'failed' | 'abandoned'
  elapsedSeconds: number
  mistakes: number
}
const migrateAttempts = (attempts: LegacyAttempt[]): Record<Difficulty, DifficultyStats> => {
  const statistics = defaultData().statistics
  for (const attempt of attempts) {
    if (attempt.outcome === 'playing' || !difficulties.includes(attempt.difficulty)) continue
    statistics[attempt.difficulty] = applyOutcome(statistics[attempt.difficulty], attempt.outcome, attempt.elapsedSeconds, attempt.mistakes)
  }
  return statistics
}

export const loadData = (): AppData => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultData()
    const parsed = JSON.parse(raw) as Partial<AppData> & { attempts?: LegacyAttempt[] }
    if (parsed.version !== 1) return defaultData()
    const base = defaultData()
    for (const difficulty of difficulties) {
      if (validGame(parsed.games?.[difficulty])) base.games[difficulty] = parsed.games[difficulty]
      if (validatePuzzle(parsed.queued?.[difficulty])) base.queued[difficulty] = parsed.queued[difficulty]
      if (validStats(parsed.statistics?.[difficulty])) base.statistics[difficulty] = parsed.statistics![difficulty]
    }
    if (!parsed.statistics && Array.isArray(parsed.attempts)) base.statistics = migrateAttempts(parsed.attempts)
    base.recentPuzzleIds = Array.isArray(parsed.recentPuzzleIds)
      ? parsed.recentPuzzleIds.filter((id): id is string => typeof id === 'string').slice(-100)
      : []
    base.settings = { ...base.settings, ...parsed.settings }
    return base
  } catch {
    return defaultData()
  }
}

// Finished games (won/lost) have nothing left to resume — once an attempt is over, only the
// statistics summary needs to survive, so drop the full board/history from what gets persisted.
const forPersistence = (data: AppData): AppData => ({
  ...data,
  games: Object.fromEntries(Object.entries(data.games).filter(([, game]) => game?.status === 'playing')) as AppData['games'],
})

export const saveData = (data: AppData): boolean => {
  try {
    localStorage.setItem(KEY, JSON.stringify(forPersistence(data)))
    return true
  } catch {
    return false
  }
}

export const exportData = (data: AppData): Blob => new Blob([JSON.stringify(forPersistence(data), null, 2)], { type: 'application/json' })
export const parseImport = (text: string): AppData | null => {
  try {
    const parsed = JSON.parse(text) as AppData
    if (parsed.version !== 1) return null
    for (const puzzle of Object.values(parsed.queued ?? {}) as Puzzle[]) if (!validatePuzzle(puzzle)) return null
    for (const game of Object.values(parsed.games ?? {}) as GameState[]) if (!validGame(game)) return null
    return { ...defaultData(), ...parsed }
  } catch {
    return null
  }
}
