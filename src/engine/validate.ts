import type { Puzzle } from '../types'
import { isValidSolution, orthogonalNeighbours } from './grid'

export const validatePuzzle = (value: unknown): value is Puzzle => {
  if (!value || typeof value !== 'object') return false
  const puzzle = value as Partial<Puzzle>
  if (puzzle.version !== 1 || typeof puzzle.id !== 'string' || typeof puzzle.seed !== 'number') return false
  if (!['easy', 'medium', 'hard', 'expert'].includes(puzzle.difficulty ?? '')) return false
  if (!puzzle.solution || !isValidSolution(puzzle.solution)) return false
  if (!Array.isArray(puzzle.cages) || !Array.isArray(puzzle.cageByCell) || puzzle.cageByCell.length !== 81) return false
  const covered = new Set<number>()
  for (const cage of puzzle.cages) {
    if (!Number.isInteger(cage.id) || cage.id < 0 || cage.id >= puzzle.cages.length) return false
    if (!Array.isArray(cage.cells) || cage.cells.length < 1 || cage.cells.length > 5) return false
    if (puzzle.difficulty !== 'easy' && cage.cells.length === 1) return false
    if (new Set(cage.cells.map((cell) => puzzle.solution![cell])).size !== cage.cells.length) return false
    if (cage.cells.reduce((sum, cell) => sum + puzzle.solution![cell]!, 0) !== cage.sum) return false
    const connected = new Set([cage.cells[0]!])
    let changed = true
    while (changed) {
      changed = false
      for (const cell of cage.cells) {
        if (!connected.has(cell) && orthogonalNeighbours(cell).some((peer) => connected.has(peer))) {
          connected.add(cell)
          changed = true
        }
      }
    }
    if (connected.size !== cage.cells.length) return false
    for (const cell of cage.cells) {
      if (!Number.isInteger(cell) || cell < 0 || cell >= 81 || covered.has(cell) || puzzle.cageByCell[cell] !== cage.id) return false
      covered.add(cell)
    }
  }
  return covered.size === 81
}
