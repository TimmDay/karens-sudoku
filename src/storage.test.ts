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
})
