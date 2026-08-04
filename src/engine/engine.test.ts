import { describe, expect, it } from 'vitest'
import { generatePuzzle } from '../generator'
import { isValidSolution, orthogonalNeighbours } from './grid'
import { countSolutions } from './solver'
import { validatePuzzle } from './validate'

describe('puzzle engine', () => {
  it.each(['easy', 'medium', 'hard', 'expert'] as const)(
    'generates a valid unique %s puzzle',
    (difficulty) => {
      const puzzle = generatePuzzle(difficulty, 123456)
      expect(isValidSolution(puzzle.solution)).toBe(true)
      expect(validatePuzzle(puzzle)).toBe(true)
      expect(countSolutions(puzzle).count).toBe(1)
    },
    20_000,
  )

  it('is deterministic from a seed', () => {
    expect(generatePuzzle('medium', 98765)).toEqual(generatePuzzle('medium', 98765))
  })

  it('covers every cell once with connected cages and unique digits', () => {
    const puzzle = generatePuzzle('hard', 42)
    expect(puzzle.cages.flatMap((cage) => cage.cells).sort((a, b) => a - b)).toEqual(Array.from({ length: 81 }, (_, index) => index))
    for (const cage of puzzle.cages) {
      const reached = new Set([cage.cells[0]!])
      while ([...cage.cells].some((cell) => !reached.has(cell) && orthogonalNeighbours(cell).some((peer) => reached.has(peer)))) {
        for (const cell of cage.cells) if (orthogonalNeighbours(cell).some((peer) => reached.has(peer))) reached.add(cell)
      }
      expect(reached.size).toBe(cage.cells.length)
      expect(new Set(cage.cells.map((cell) => puzzle.solution[cell])).size).toBe(cage.cells.length)
    }
  })

  it('keeps a deterministic multi-seed corpus valid and unique', () => {
    for (const difficulty of ['easy', 'medium', 'hard', 'expert'] as const) {
      for (const seed of [3, 101, 9001, 65537, 424242]) {
        const puzzle = generatePuzzle(difficulty, seed)
        expect(validatePuzzle(puzzle)).toBe(true)
        expect(countSolutions(puzzle).count).toBe(1)
      }
    }
  }, 30_000)
})
