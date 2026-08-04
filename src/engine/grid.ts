import type { Random } from './random'
import { shuffle } from './random'

export const ROWS = Array.from({ length: 9 }, (_, row) => Array.from({ length: 9 }, (_, col) => row * 9 + col))
export const COLS = Array.from({ length: 9 }, (_, col) => Array.from({ length: 9 }, (_, row) => row * 9 + col))
export const BOXES = Array.from({ length: 9 }, (_, box) => {
  const top = Math.floor(box / 3) * 3
  const left = (box % 3) * 3
  return Array.from({ length: 9 }, (_, offset) => (top + Math.floor(offset / 3)) * 9 + left + (offset % 3))
})

export const PEERS = Array.from({ length: 81 }, (_, cell) => {
  const row = Math.floor(cell / 9)
  const col = cell % 9
  const box = Math.floor(row / 3) * 3 + Math.floor(col / 3)
  return [...new Set([...ROWS[row]!, ...COLS[col]!, ...BOXES[box]!])].filter((peer) => peer !== cell)
})

export const orthogonalNeighbours = (cell: number): number[] => {
  const row = Math.floor(cell / 9)
  const col = cell % 9
  return [row > 0 ? cell - 9 : -1, row < 8 ? cell + 9 : -1, col > 0 ? cell - 1 : -1, col < 8 ? cell + 1 : -1].filter((value) => value >= 0)
}

export const generateSolution = (random: Random): number[] => {
  const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], random)
  const bands = shuffle([0, 1, 2], random)
  const stacks = shuffle([0, 1, 2], random)
  const rows = bands.flatMap((band) => shuffle([0, 1, 2], random).map((row) => band * 3 + row))
  const cols = stacks.flatMap((stack) => shuffle([0, 1, 2], random).map((col) => stack * 3 + col))
  return rows.flatMap((row) => cols.map((col) => digits[(row * 3 + Math.floor(row / 3) + col) % 9]!))
}

export const isValidSolution = (grid: readonly number[]): boolean => {
  const validGroup = (group: readonly number[]) => new Set(group.map((cell) => grid[cell])).size === 9
  return (
    grid.length === 81 &&
    grid.every((digit) => Number.isInteger(digit) && digit >= 1 && digit <= 9) &&
    [...ROWS, ...COLS, ...BOXES].every(validGroup)
  )
}
