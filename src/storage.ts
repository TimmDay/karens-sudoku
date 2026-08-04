import type { AppData, Difficulty, GameState, Puzzle } from './types'
import { validatePuzzle } from './generator'

const KEY = 'karens-sudoku:data:v1'
export const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert']

export const defaultData = (): AppData => ({
  version: 1,
  games: {}, attempts: [], queued: {}, recentPuzzleIds: [],
  settings: { theme: 'system', sound: false, haptics: false, introductionSeen: false },
})

const validGame = (game: unknown): game is GameState => Boolean(game && typeof game === 'object' && validatePuzzle((game as GameState).puzzle) && Array.isArray((game as GameState).cells))

export const loadData = (): AppData => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultData()
    const parsed = JSON.parse(raw) as Partial<AppData>
    if (parsed.version !== 1) return defaultData()
    const base = defaultData()
    for (const difficulty of difficulties) {
      if (validGame(parsed.games?.[difficulty])) base.games[difficulty] = parsed.games[difficulty]
      if (validatePuzzle(parsed.queued?.[difficulty])) base.queued[difficulty] = parsed.queued[difficulty]
    }
    base.attempts = Array.isArray(parsed.attempts) ? parsed.attempts : []
    base.recentPuzzleIds = Array.isArray(parsed.recentPuzzleIds) ? parsed.recentPuzzleIds.filter((id): id is string => typeof id === 'string').slice(-100) : []
    base.settings = { ...base.settings, ...parsed.settings }
    return base
  } catch { return defaultData() }
}
export const saveData = (data: AppData): boolean => {
  try { localStorage.setItem(KEY, JSON.stringify(data)); return true }
  catch { return false }
}

export const exportData = (data: AppData): Blob => new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
export const parseImport = (text: string): AppData | null => {
  try {
    const parsed = JSON.parse(text) as AppData
    if (parsed.version !== 1) return null
    for (const puzzle of Object.values(parsed.queued ?? {}) as Puzzle[]) if (!validatePuzzle(puzzle)) return null
    for (const game of Object.values(parsed.games ?? {}) as GameState[]) if (!validGame(game)) return null
    return { ...defaultData(), ...parsed }
  } catch { return null }
}
