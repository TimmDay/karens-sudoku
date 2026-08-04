import type { Puzzle } from '../types'
import { PEERS } from './grid'

export interface SolveResult {
  count: number
  solution: number[] | null
  nodes: number
}

const FULL_MASK = 0b1111111110
const digitMask = (digit: number) => 1 << digit
const digitsFromMask = (mask: number) => Array.from({ length: 9 }, (_, index) => index + 1).filter((digit) => mask & digitMask(digit))

const combinationMasks = (size: number, sum: number): number[] => {
  const masks: number[] = []
  const visit = (digit: number, left: number, remaining: number, mask: number) => {
    if (left === 0) {
      if (remaining === 0) masks.push(mask)
      return
    }
    for (let next = digit; next <= 9; next++) {
      if (next > remaining) break
      visit(next + 1, left - 1, remaining - next, mask | digitMask(next))
    }
  }
  visit(1, size, sum, 0)
  return masks
}

export const countSolutions = (puzzle: Pick<Puzzle, 'cages' | 'cageByCell'>, limit = 2): SolveResult => {
  const grid = Array<number>(81).fill(0)
  let count = 0
  let first: number[] | null = null
  let nodes = 0
  const cageMasks = puzzle.cages.map((cage) => combinationMasks(cage.cells.length, cage.sum))

  const candidates = (cell: number): number[] => {
    let mask = FULL_MASK
    for (const peer of PEERS[cell]!) {
      const value = grid[peer]!
      if (value) mask &= ~digitMask(value)
    }
    const cage = puzzle.cages[puzzle.cageByCell[cell]!]!
    let usedMask = 0
    for (const member of cage.cells) if (grid[member]) usedMask |= digitMask(grid[member]!)
    return digitsFromMask(mask).filter((digit) => {
      const withDigit = usedMask | digitMask(digit)
      if (withDigit === usedMask) return false
      return cageMasks[cage.id]!.some((combination) => (combination & withDigit) === withDigit)
    })
  }

  const search = () => {
    if (count >= limit) return
    let chosen = -1
    let options: number[] = []
    for (let cell = 0; cell < 81; cell++) {
      if (grid[cell] !== 0) continue
      const next = candidates(cell)
      if (!next.length) return
      if (chosen < 0 || next.length < options.length) {
        chosen = cell
        options = next
        if (next.length === 1) break
      }
    }
    if (chosen < 0) {
      count++
      first ??= [...grid]
      return
    }
    nodes++
    for (const digit of options) {
      grid[chosen] = digit
      search()
      grid[chosen] = 0
      if (count >= limit) return
    }
  }

  search()
  return { count, solution: first, nodes }
}
