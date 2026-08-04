/// <reference lib="webworker" />
import { generatePuzzle } from './generator'
import type { Difficulty } from './types'

self.onmessage = ({ data }: MessageEvent<{ difficulty: Difficulty; seed: number }>) => {
  try { self.postMessage({ difficulty: data.difficulty, puzzle: generatePuzzle(data.difficulty, data.seed) }) }
  catch (error) { self.postMessage({ difficulty: data.difficulty, error: error instanceof Error ? error.message : 'Generation failed' }) }
}
