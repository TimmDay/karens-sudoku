import type { CellState, GameSnapshot, GameState, Puzzle } from './types'
import { BOXES, COLS, ROWS } from './engine/grid'

const emptyCells = (): CellState[] => Array.from({ length: 81 }, () => ({ value: null, notes: [], wrong: false }))
const copyCells = (cells: readonly CellState[]) => cells.map((cell) => ({ ...cell, notes: [...cell.notes] }))
const snapshot = (game: GameState): GameSnapshot => ({ cells: copyCells(game.cells), mistakes: game.mistakes, status: game.status })

export const createGame = (puzzle: Puzzle): GameState => ({
  version: 1,
  puzzle,
  cells: emptyCells(),
  mistakes: 0,
  elapsedSeconds: 0,
  started: false,
  status: 'playing',
  savedAt: Date.now(),
  paused: false,
  past: [],
  future: [],
})

const withHistory = (game: GameState, update: (draft: GameState) => void): GameState => {
  if (game.status !== 'playing') return game
  const next: GameState = { ...game, cells: copyCells(game.cells), past: [...game.past, snapshot(game)].slice(-200), future: [], started: true, savedAt: Date.now() }
  update(next)
  return next
}

const peerCells = (game: GameState, cell: number): Set<number> => {
  const row = Math.floor(cell / 9)
  const col = cell % 9
  const box = Math.floor(row / 3) * 3 + Math.floor(col / 3)
  const cage = game.puzzle.cages[game.puzzle.cageByCell[cell]!]!
  return new Set([...ROWS[row]!, ...COLS[col]!, ...BOXES[box]!, ...cage.cells])
}

export const enterDigit = (game: GameState, cell: number, digit: number): GameState => withHistory(game, (next) => {
  const target = next.cells[cell]!
  target.value = digit
  target.notes = []
  target.wrong = next.puzzle.solution[cell] !== digit
  if (target.wrong) {
    next.mistakes++
    if (next.mistakes >= 3) next.status = 'lost'
  } else {
    for (const peer of peerCells(next, cell)) next.cells[peer]!.notes = next.cells[peer]!.notes.filter((note) => note !== digit)
    if (next.cells.every((state, index) => state.value === next.puzzle.solution[index])) next.status = 'won'
  }
})

export const toggleNote = (game: GameState, cell: number, digit: number): GameState => {
  if (game.cells[cell]?.value) return game
  return withHistory(game, (next) => {
    const notes = next.cells[cell]!.notes
    next.cells[cell]!.notes = notes.includes(digit) ? notes.filter((note) => note !== digit) : [...notes, digit].sort()
  })
}

export const eraseCell = (game: GameState, cell: number): GameState => {
  const current = game.cells[cell]
  if (!current || (!current.value && !current.notes.length)) return game
  return withHistory(game, (next) => { next.cells[cell] = { value: null, notes: [], wrong: false } })
}

export const undo = (game: GameState): GameState => {
  const previous = game.past.at(-1)
  if (!previous) return game
  return { ...game, ...previous, cells: copyCells(previous.cells), past: game.past.slice(0, -1), future: [snapshot(game), ...game.future], savedAt: Date.now() }
}

export const redo = (game: GameState): GameState => {
  const next = game.future[0]
  if (!next) return game
  return { ...game, ...next, cells: copyCells(next.cells), past: [...game.past, snapshot(game)], future: game.future.slice(1), savedAt: Date.now() }
}

export const tick = (game: GameState): GameState => game.started && !game.paused && game.status === 'playing'
  ? { ...game, elapsedSeconds: game.elapsedSeconds + 1, savedAt: Date.now() }
  : game

