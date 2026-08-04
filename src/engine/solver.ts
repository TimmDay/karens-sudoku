import type { Puzzle } from '../types'
import { BOXES, COLS, PEERS, ROWS } from './grid'

export type SolveTechnique = 'naked-single' | 'hidden-single' | 'cage-combination' | 'search'

export interface SolveResult {
  count: number
  solution: number[] | null
  nodes: number
  techniques: Partial<Record<SolveTechnique, number>>
}

const FULL_MASK = 0b1111111110
const digitMask = (digit: number) => 1 << digit
const digitsFromMask = (mask: number) => Array.from({ length: 9 }, (_, index) => index + 1).filter((digit) => mask & digitMask(digit))
const singleDigit = (mask: number) => (mask !== 0 && (mask & (mask - 1)) === 0 ? Math.log2(mask) : 0)

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
  let count = 0
  let first: number[] | null = null
  let nodes = 0
  const techniques: Partial<Record<SolveTechnique, number>> = {}
  const cageMasks = puzzle.cages.map((cage) => combinationMasks(cage.cells.length, cage.sum))

  const candidateMask = (grid: readonly number[], cell: number): number => {
    let mask = FULL_MASK
    for (const peer of PEERS[cell]!) if (grid[peer]) mask &= ~digitMask(grid[peer]!)
    const cage = puzzle.cages[puzzle.cageByCell[cell]!]!
    let usedMask = 0
    for (const member of cage.cells) if (grid[member]) usedMask |= digitMask(grid[member]!)
    let cageAllowed = 0
    for (const combination of cageMasks[cage.id]!) if ((combination & usedMask) === usedMask) cageAllowed |= combination & ~usedMask
    return mask & cageAllowed
  }

  const assign = (grid: number[], cell: number, digit: number): boolean => {
    if (grid[cell] && grid[cell] !== digit) return false
    grid[cell] = digit
    return true
  }

  const propagate = (grid: number[]): boolean => {
    let changed = true
    while (changed) {
      changed = false
      const masks = grid.map((value, cell) => (value ? 0 : candidateMask(grid, cell)))
      if (masks.some((mask, cell) => !grid[cell] && mask === 0)) return false
      for (let cell = 0; cell < 81; cell++) {
        if (grid[cell]) continue
        const digit = singleDigit(masks[cell]!)
        if (digit) {
          assign(grid, cell, digit)
          techniques['naked-single'] = (techniques['naked-single'] ?? 0) + 1
          changed = true
          break
        }
      }
      if (changed) continue
      for (const unit of [...ROWS, ...COLS, ...BOXES]) {
        for (let digit = 1; digit <= 9; digit++) {
          if (unit.some((cell) => grid[cell] === digit)) continue
          const places = unit.filter((cell) => !grid[cell] && masks[cell]! & digitMask(digit))
          if (places.length === 0) return false
          if (places.length === 1) {
            assign(grid, places[0]!, digit)
            techniques['hidden-single'] = (techniques['hidden-single'] ?? 0) + 1
            changed = true
            break
          }
        }
        if (changed) break
      }
    }
    return true
  }

  const search = (input: number[]) => {
    if (count >= limit) return
    const grid = [...input]
    if (!propagate(grid)) return
    let chosen = -1
    let chosenMask = 0
    for (let cell = 0; cell < 81; cell++) {
      if (grid[cell]) continue
      const mask = candidateMask(grid, cell)
      if (chosen < 0 || digitsFromMask(mask).length < digitsFromMask(chosenMask).length) {
        chosen = cell
        chosenMask = mask
      }
    }
    if (chosen < 0) {
      count++
      first ??= grid
      return
    }
    nodes++
    techniques.search = (techniques.search ?? 0) + 1
    for (const digit of digitsFromMask(chosenMask)) {
      const branch = [...grid]
      branch[chosen] = digit
      search(branch)
      if (count >= limit) return
    }
  }

  techniques['cage-combination'] = puzzle.cages.length
  search(Array<number>(81).fill(0))
  return { count, solution: first, nodes, techniques }
}
