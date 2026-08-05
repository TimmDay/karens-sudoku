export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'

export interface Cage {
  id: number
  sum: number
  cells: number[]
}

export interface Puzzle {
  version: 1
  id: string
  seed: number
  difficulty: Difficulty
  solution: number[]
  cages: Cage[]
  cageByCell: number[]
}

export interface CellState {
  value: number | null
  notes: number[]
  wrong: boolean
}

export interface GameSnapshot {
  cells: CellState[]
  mistakes: number
  status: GameState['status']
}

export interface GameState {
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

export interface Attempt {
  id: string
  puzzleId: string
  difficulty: Difficulty
  startedAt: number
  endedAt: number | null
  elapsedSeconds: number
  mistakes: number
  outcome: 'playing' | 'completed' | 'failed' | 'abandoned'
}

export interface Settings {
  theme: 'system' | 'light' | 'dark'
  introductionSeen: boolean
}

export interface AppData {
  version: 1
  games: Partial<Record<Difficulty, GameState>>
  attempts: Attempt[]
  queued: Partial<Record<Difficulty, Puzzle>>
  recentPuzzleIds: string[]
  settings: Settings
}
