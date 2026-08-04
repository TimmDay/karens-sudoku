import type { Cage, Difficulty, Puzzle } from './types'

const hash = (text: string) => {
  let value = 2166136261
  for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619)
  return value >>> 0
}

const randomFor = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let n = state
    n = Math.imul(n ^ (n >>> 15), n | 1)
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61)
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296
  }
}

const shuffle = <T,>(values: T[], random: () => number) => {
  const result = [...values]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}

const makeSolution = (random: () => number) => {
  const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], random)
  const bands = shuffle([0, 1, 2], random)
  const stacks = shuffle([0, 1, 2], random)
  const rows = bands.flatMap((band) => shuffle([0, 1, 2], random).map((row) => band * 3 + row))
  const cols = stacks.flatMap((stack) => shuffle([0, 1, 2], random).map((col) => stack * 3 + col))
  return rows.flatMap((row) => cols.map((col) => digits[(row * 3 + Math.floor(row / 3) + col) % 9]!))
}

const neighbours = (cell: number) => {
  const row = Math.floor(cell / 9)
  const col = cell % 9
  return [row > 0 ? cell - 9 : -1, row < 8 ? cell + 9 : -1, col > 0 ? cell - 1 : -1, col < 8 ? cell + 1 : -1].filter((n) => n >= 0)
}

const sizeRanges: Record<Difficulty, [number, number]> = {
  easy: [1, 3], medium: [2, 4], hard: [2, 5], expert: [2, 5],
}

const makeCages = (solution: number[], difficulty: Difficulty, random: () => number) => {
  const remaining = new Set(Array.from({ length: 81 }, (_, index) => index))
  const cages: Cage[] = []
  const [minSize, maxSize] = sizeRanges[difficulty]
  while (remaining.size) {
    const start = shuffle([...remaining], random)[0]!
    const target = minSize + Math.floor(random() * (maxSize - minSize + 1))
    const cells = [start]
    remaining.delete(start)
    while (cells.length < target) {
      const options = shuffle(
        [...new Set(cells.flatMap(neighbours))].filter(
          (cell) => remaining.has(cell) && !cells.some((used) => solution[used] === solution[cell]),
        ),
        random,
      )
      if (!options.length) break
      cells.push(options[0]!)
      remaining.delete(options[0]!)
    }
    cages.push({ id: cages.length, cells, sum: cells.reduce((sum, cell) => sum + solution[cell]!, 0) })
  }
  return cages
}

export const generatePuzzle = (difficulty: Difficulty, seed = Date.now() >>> 0): Puzzle => {
  const random = randomFor(seed)
  const solution = makeSolution(random)
  const cages = makeCages(solution, difficulty, random)
  const cageByCell = Array<number>(81)
  cages.forEach((cage) => cage.cells.forEach((cell) => { cageByCell[cell] = cage.id }))
  return { version: 1, id: `${difficulty}-${seed.toString(36)}-${hash(solution.join('')).toString(36)}`, seed, difficulty, solution, cages, cageByCell }
}
