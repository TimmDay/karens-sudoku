import { describe, expect, it } from 'vitest'
import { generatePuzzle } from './generator'
import { createGame, enterDigit, eraseCell, redo, tick, toggleNote, undo } from './game'

describe('game state', () => {
  const puzzle = generatePuzzle('easy', 12)

  it('starts on the first note and toggles candidates', () => {
    const game = toggleNote(createGame(puzzle), 0, 4)
    expect(game.started).toBe(true)
    expect(game.cells[0]?.notes).toEqual([4])
    expect(toggleNote(game, 0, 4).cells[0]?.notes).toEqual([])
  })

  it('marks and counts incorrect final entries', () => {
    const wrong = puzzle.solution[0] === 1 ? 2 : 1
    const game = enterDigit(createGame(puzzle), 0, wrong)
    expect(game.cells[0]).toMatchObject({ value: wrong, wrong: true })
    expect(game.mistakes).toBe(1)
  })

  it('removes peer notes after a correct entry and restores them on undo', () => {
    const digit = puzzle.solution[0]!
    const noted = toggleNote(createGame(puzzle), 1, digit)
    const entered = enterDigit(noted, 0, digit)
    expect(entered.cells[1]?.notes).toEqual([])
    expect(undo(entered).cells[1]?.notes).toEqual([digit])
    expect(redo(undo(entered)).cells[1]?.notes).toEqual([])
  })

  it('erases a value without refunding a mistake', () => {
    const wrong = puzzle.solution[0] === 1 ? 2 : 1
    expect(eraseCell(enterDigit(createGame(puzzle), 0, wrong), 0).mistakes).toBe(1)
  })

  it('requires erasing before replacing an incorrect entry', () => {
    const wrong = puzzle.solution[0] === 1 ? 2 : 1
    const game = enterDigit(createGame(puzzle), 0, wrong)
    expect(enterDigit(game, 0, puzzle.solution[0]!).cells[0]?.value).toBe(wrong)
  })

  it('locks after the third mistake', () => {
    let game = createGame(puzzle)
    for (let cell = 0; cell < 3; cell++) game = enterDigit(game, cell, puzzle.solution[cell] === 1 ? 2 : 1)
    expect(game.status).toBe('lost')
    expect(eraseCell(game, 0)).toBe(game)
  })

  it('counts only active started play time', () => {
    const untouched = createGame(puzzle)
    expect(tick(untouched).elapsedSeconds).toBe(0)
    const started = toggleNote(untouched, 0, 1)
    expect(tick(started).elapsedSeconds).toBe(1)
    expect(tick({ ...started, paused: true }).elapsedSeconds).toBe(0)
  })
})
