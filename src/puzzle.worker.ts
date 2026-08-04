/// <reference lib="webworker" />
import { generatePuzzle } from './generator'
import type { Difficulty } from './types'

self.onmessage = ({ data }: MessageEvent<{ difficulty: Difficulty; seed: number; recentPuzzleIds?: string[] }>) => {
  try {
    let seed = data.seed
    let puzzle = generatePuzzle(data.difficulty, seed)
    while (data.recentPuzzleIds?.includes(puzzle.id)) puzzle = generatePuzzle(data.difficulty, ++seed)
    self.postMessage({ difficulty: data.difficulty, puzzle })
  }
  catch (error) { self.postMessage({ difficulty: data.difficulty, error: error instanceof Error ? error.message : 'Generation failed' }) }
}
