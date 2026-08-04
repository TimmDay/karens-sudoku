import type { Difficulty, GameState, Puzzle } from './types'

const GAME_KEY = 'karens-sudoku:game:v1'
const QUEUE_KEY = 'karens-sudoku:next-puzzles:v1'

export const loadGame = (): GameState | null => {
  try {
    const value = localStorage.getItem(GAME_KEY)
    return value ? JSON.parse(value) as GameState : null
  } catch { return null }
}

export const saveGame = (game: GameState) => localStorage.setItem(GAME_KEY, JSON.stringify(game))
export const clearGame = () => localStorage.removeItem(GAME_KEY)

export const loadQueued = (): Partial<Record<Difficulty, Puzzle>> => {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '{}') as Partial<Record<Difficulty, Puzzle>> }
  catch { return {} }
}

export const saveQueued = (puzzles: Partial<Record<Difficulty, Puzzle>>) => localStorage.setItem(QUEUE_KEY, JSON.stringify(puzzles))
