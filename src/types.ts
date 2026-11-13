export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'

export type Cage = {
  id: number
  sum: number
  cells: number[]
}

export type Puzzle = {
  version: 1
  id: string
  seed: number
  difficulty: Difficulty
  solution: number[]
  cages: Cage[]
  cageByCell: number[]
}

export type CellState = {
  value: number | null
  notes: number[]
  wrong: boolean
  given: boolean
}

export type GameSnapshot = {
  cells: CellState[]
  mistakes: number
  status: GameState['status']
}

export type GameState = {
  version: 1
  puzzle: Puzzle
  cells: CellState[]
  mistakes: number
  elapsedSeconds: number
  started: boolean
  status: 'playing' | 'won' | 'lost'
  savedAt: number
  paused: boolean
  past: GameSnapshot[]
  future: GameSnapshot[]
}

export type DifficultyStats = {
  completed: number
  failed: number
  abandoned: number
  clean: number
  totalSeconds: number
  best: number | null
}

export type Settings = {
  theme: 'system' | 'light' | 'dark'
  introductionSeen: boolean
}

export type AppData = {
  version: 1
  games: Partial<Record<Difficulty, GameState>>
  statistics: Record<Difficulty, DifficultyStats>
  queued: Partial<Record<Difficulty, Puzzle>>
  recentPuzzleIds: string[]
  settings: Settings
}
