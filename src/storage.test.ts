// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { generatePuzzle } from './generator'
import { createGame } from './game'
import { defaultData, loadData, parseImport, saveData } from './storage'

describe('versioned storage', () => {
  beforeEach(() => localStorage.clear())

  it('round trips app data', () => {
    const data = defaultData()
    data.games.easy = createGame(generatePuzzle('easy', 77))
    expect(saveData(data)).toBe(true)
    expect(loadData().games.easy?.puzzle.id).toBe(data.games.easy.puzzle.id)
  })

  it('recovers from corrupt data', () => {
    localStorage.setItem('karens-sudoku:data:v1', '{oops')
    expect(loadData()).toEqual(defaultData())
  })

  it('rejects invalid imports', () => {
    expect(parseImport('{}')).toBeNull()
    expect(parseImport('{oops')).toBeNull()
  })

  it('does not persist finished games, only in-progress ones', () => {
    const data = defaultData()
    data.games.easy = { ...createGame(generatePuzzle('easy', 77)), status: 'won' }
    data.games.medium = createGame(generatePuzzle('medium', 78))
    expect(saveData(data)).toBe(true)
    const loaded = loadData()
    expect(loaded.games.easy).toBeUndefined()
    expect(loaded.games.medium?.puzzle.id).toBe(data.games.medium.puzzle.id)
  })

  it('migrates a legacy flat attempts log into per-difficulty statistics', () => {
    localStorage.setItem(
      'karens-sudoku:data:v1',
      JSON.stringify({
        version: 1,
        games: {},
        queued: {},
        recentPuzzleIds: [],
        settings: { theme: 'system', introductionSeen: false },
        attempts: [
          { difficulty: 'easy', outcome: 'completed', elapsedSeconds: 100, mistakes: 0 },
          { difficulty: 'easy', outcome: 'failed', elapsedSeconds: 40, mistakes: 3 },
          { difficulty: 'easy', outcome: 'playing', elapsedSeconds: 0, mistakes: 0 },
        ],
      }),
    )
    const loaded = loadData()
    expect(loaded.statistics.easy).toEqual({ completed: 1, failed: 1, abandoned: 0, clean: 1, totalSeconds: 100, best: 100 })
  })

  it('cleans up a legacy blob in one load+save cycle, without losing its statistics', () => {
    const finishedGame = { ...createGame(generatePuzzle('easy', 77)), status: 'won' as const }
    localStorage.setItem(
      'karens-sudoku:data:v1',
      JSON.stringify({
        version: 1,
        games: { easy: finishedGame },
        queued: {},
        recentPuzzleIds: [],
        settings: { theme: 'system', introductionSeen: false },
        attempts: [
          { difficulty: 'easy', outcome: 'completed', elapsedSeconds: 100, mistakes: 0 },
          { difficulty: 'hard', outcome: 'abandoned', elapsedSeconds: 15, mistakes: 0 },
        ],
      }),
    )
    // This mirrors what App does on mount: read the legacy blob, then immediately
    // write it straight back out — which is enough to strip the old cruft.
    const loaded = loadData()
    expect(saveData(loaded)).toBe(true)

    const raw = JSON.parse(localStorage.getItem('karens-sudoku:data:v1')!)
    expect(raw.attempts).toBeUndefined()
    expect(raw.games.easy).toBeUndefined()
    expect(raw.statistics.easy).toEqual({ completed: 1, failed: 0, abandoned: 0, clean: 1, totalSeconds: 100, best: 100 })
    expect(raw.statistics.hard).toEqual({ completed: 0, failed: 0, abandoned: 1, clean: 0, totalSeconds: 0, best: null })
  })
})
