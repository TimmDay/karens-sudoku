import type { Cage, Difficulty, Puzzle } from './types'
import { generateSolution, orthogonalNeighbours } from './engine/grid'
import { hashNumbers, randomFor, shuffle, type Random } from './engine/random'
import { countSolutions } from './engine/solver'

const sizeWeights: Record<Difficulty, readonly number[]> = {
  easy: [1, 2, 2, 2, 3],
  medium: [2, 2, 2, 3, 3],
  hard: [2, 2, 2, 3, 3],
  expert: [2, 2, 2, 3, 3],
}

const makeCages = (solution: readonly number[], difficulty: Difficulty, random: Random): Cage[] => {
  const remaining = new Set(Array.from({ length: 81 }, (_, index) => index))
  const cages: Cage[] = []
  while (remaining.size) {
    const start = shuffle([...remaining], random)[0]!
    const weights = sizeWeights[difficulty]
    const target = weights[Math.floor(random() * weights.length)]!
    const cells = [start]
    remaining.delete(start)
    while (cells.length < target) {
      const options = shuffle([...new Set(cells.flatMap(orthogonalNeighbours))], random).filter(
        (cell) => remaining.has(cell) && !cells.some((used) => solution[used] === solution[cell]),
      )
      if (!options.length) break
      cells.push(options[0]!)
      remaining.delete(options[0]!)
    }
    cages.push({ id: cages.length, cells, sum: cells.reduce((sum, cell) => sum + solution[cell]!, 0) })
  }
  if (difficulty !== 'easy') {
    for (const cage of [...cages]) {
      if (cage.cells.length !== 1) continue
      const cell = cage.cells[0]!
      const adjacent = shuffle(cages, random).find(
        (candidate) =>
          candidate !== cage &&
          candidate.cells.length < 5 &&
          candidate.cells.some((member) => orthogonalNeighbours(cell).includes(member)) &&
          candidate.cells.every((member) => solution[member] !== solution[cell]),
      )
      if (adjacent) {
        adjacent.cells.push(cell)
        adjacent.sum += solution[cell]!
        cages.splice(cages.indexOf(cage), 1)
      }
    }
  }
  return cages.map((cage, id) => ({ ...cage, id }))
}

const createCandidate = (difficulty: Difficulty, seed: number): Puzzle => {
  const random = randomFor(seed)
  const solution = generateSolution(random)
  const cages = makeCages(solution, difficulty, random)
  const cageByCell = Array<number>(81)
  for (const cage of cages) for (const cell of cage.cells) cageByCell[cell] = cage.id
  return {
    version: 1,
    id: `${difficulty}-${seed.toString(36)}-${hashNumbers(solution).toString(36)}`,
    seed,
    difficulty,
    solution,
    cages,
    cageByCell,
  }
}

export const generatePuzzle = (difficulty: Difficulty, initialSeed = Date.now() >>> 0, maxAttempts = 100): Puzzle => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const seed = (initialSeed + Math.imul(attempt, 0x9e3779b1)) >>> 0
    const puzzle = createCandidate(difficulty, seed)
    if (difficulty !== 'easy' && puzzle.cages.some((cage) => cage.cells.length === 1)) continue
    const result = countSolutions(puzzle, 2)
    if (result.count === 1) return puzzle
  }
  throw new Error(`Could not generate a unique ${difficulty} puzzle after ${maxAttempts} attempts`)
}

export { countSolutions } from './engine/solver'
export { validatePuzzle } from './engine/validate'
