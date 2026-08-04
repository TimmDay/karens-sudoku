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

export interface GameState {
  version: 1
  puzzle: Puzzle
  cells: CellState[]
  mistakes: number
  elapsedSeconds: number
  started: boolean
  status: 'playing' | 'won' | 'lost'
  savedAt: number
}
