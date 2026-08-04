import { describe, expect, it } from 'vitest'
import { generatePuzzle } from './generator'
import { createGame, enterDigit, eraseCell, redo, toggleNote, undo } from './game'

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
})
