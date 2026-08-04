import { useEffect, useMemo, useRef, useState } from 'react'
import { createGame, enterDigit, eraseCell, redo, tick, toggleNote, undo } from './game'
import { difficulties, loadData, saveData } from './storage'
import type { AppData, Difficulty, GameState, Puzzle } from './types'

type Screen = 'home' | 'game'
type Mode = 'entry' | 'notes'

const titleCase = (value: string) => value[0]!.toUpperCase() + value.slice(1)
const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`

const cellBorders = (puzzle: Puzzle, cell: number) => {
  const cage = puzzle.cageByCell[cell]
  const row = Math.floor(cell / 9)
  const col = cell % 9
  return {
    '--cage-top': row === 0 || puzzle.cageByCell[cell - 9] !== cage ? '2px' : '0px',
    '--cage-right': col === 8 || puzzle.cageByCell[cell + 1] !== cage ? '2px' : '0px',
    '--cage-bottom': row === 8 || puzzle.cageByCell[cell + 9] !== cage ? '2px' : '0px',
    '--cage-left': col === 0 || puzzle.cageByCell[cell - 1] !== cage ? '2px' : '0px',
  } as React.CSSProperties
}

function GameBoard({ game, setGame, onHome }: { game: GameState; setGame: (game: GameState) => void; onHome: () => void }) {
  const [selected, setSelected] = useState(0)
  const [mode, setMode] = useState<Mode>('entry')
  const selectedValue = game.cells[selected]?.value
  const selectedCage = game.puzzle.cageByCell[selected]
  const selectedRow = Math.floor(selected / 9)
  const selectedCol = selected % 9

  const input = (digit: number) => setGame(mode === 'notes' ? toggleNote(game, selected, digit) : enterDigit(game, selected, digit))

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (/^[1-9]$/.test(event.key)) input(Number(event.key))
      else if (event.key === 'Backspace' || event.key === 'Delete') setGame(eraseCell(game, selected))
      else if (event.key.toLowerCase() === 'n') setMode((value) => value === 'entry' ? 'notes' : 'entry')
      else if (event.key === 'ArrowLeft') setSelected((value) => Math.max(0, value - 1))
      else if (event.key === 'ArrowRight') setSelected((value) => Math.min(80, value + 1))
      else if (event.key === 'ArrowUp') setSelected((value) => Math.max(0, value - 9))
      else if (event.key === 'ArrowDown') setSelected((value) => Math.min(80, value + 9))
      else return
      event.preventDefault()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  })

  return <main className="game-screen">
    <header className="game-header">
      <button className="icon-button" onClick={onHome} aria-label="Return home">‹</button>
      <div><p>{titleCase(game.puzzle.difficulty)}</p><strong>{formatTime(game.elapsedSeconds)}</strong></div>
      <button className="icon-button" onClick={() => setGame({ ...game, paused: !game.paused })} aria-label={game.paused ? 'Resume game' : 'Pause game'}>{game.paused ? '▶' : 'Ⅱ'}</button>
    </header>
    <div className="mistakes" aria-live="polite">Mistakes <strong>{game.mistakes} / 3</strong></div>

    <div className="board-wrap">
      <div className="board" role="grid" aria-label="Killer Sudoku board">
        {game.cells.map((cell, index) => {
          const row = Math.floor(index / 9), col = index % 9
          const cage = game.puzzle.cages[game.puzzle.cageByCell[index]!]!
          const first = Math.min(...cage.cells) === index
          const related = row === selectedRow || col === selectedCol || (Math.floor(row / 3) === Math.floor(selectedRow / 3) && Math.floor(col / 3) === Math.floor(selectedCol / 3)) || game.puzzle.cageByCell[index] === selectedCage
          const matching = selectedValue && cell.value === selectedValue
          return <button
            type="button" role="gridcell" key={index} aria-label={`Row ${row + 1}, column ${col + 1}${cell.value ? `, ${cell.value}${cell.wrong ? ', incorrect' : ''}` : ''}`}
            className={`cell ${index === selected ? 'selected' : ''} ${related ? 'related' : ''} ${matching ? 'matching' : ''} ${cell.wrong ? 'wrong' : ''}`}
            style={cellBorders(game.puzzle, index)} onClick={() => setSelected(index)}
          >
            {first && <span className="cage-sum">{cage.sum}</span>}
            {cell.value ? <span className="cell-value">{cell.value}</span> : <span className="notes">{Array.from({ length: 9 }, (_, digit) => <i key={digit}>{cell.notes.includes(digit + 1) ? digit + 1 : ''}</i>)}</span>}
          </button>
        })}
      </div>
      {game.paused && <div className="board-cover"><strong>Paused</strong><button onClick={() => setGame({ ...game, paused: false })}>Resume</button></div>}
      {game.status !== 'playing' && <div className="board-cover"><strong>{game.status === 'won' ? 'Beautifully done!' : 'Three mistakes'}</strong><p>{formatTime(game.elapsedSeconds)} · {game.mistakes} mistakes</p><button onClick={onHome}>Continue</button></div>}
    </div>

    <div className="edit-tools">
      <button onClick={() => setGame(undo(game))} disabled={!game.past.length}>↶<span>Undo</span></button>
      <button onClick={() => setGame(eraseCell(game, selected))}>⌫<span>Erase</span></button>
      <button className={mode === 'notes' ? 'active' : ''} onClick={() => setMode((value) => value === 'entry' ? 'notes' : 'entry')}>✎<span>Notes {mode === 'notes' ? 'on' : 'off'}</span></button>
      <button onClick={() => setGame(redo(game))} disabled={!game.future.length}>↷<span>Redo</span></button>
    </div>
    <div className="number-pad" aria-label="Number pad">
      {Array.from({ length: 9 }, (_, index) => index + 1).map((digit) => <button key={digit} onClick={() => input(digit)}>{digit}</button>)}
    </div>
  </main>
}

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData())
  const [screen, setScreen] = useState<Screen>('home')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [generating, setGenerating] = useState<Difficulty | null>(null)
  const [storageOkay, setStorageOkay] = useState(true)
  const worker = useRef<Worker | null>(null)
  const foreground = useRef<Difficulty | null>(null)
  const game = data.games[difficulty]

  useEffect(() => {
    const saved = saveData(data)
    queueMicrotask(() => setStorageOkay(saved))
  }, [data])
  useEffect(() => {
    document.documentElement.dataset.theme = data.settings.theme
  }, [data.settings.theme])

  useEffect(() => {
    const instance = new Worker(new URL('./puzzle.worker.ts', import.meta.url), { type: 'module' })
    worker.current = instance
    instance.onmessage = ({ data: message }: MessageEvent<{ difficulty: Difficulty; puzzle?: Puzzle }>) => {
      if (!message.puzzle) { setGenerating(null); return }
      const puzzle = message.puzzle
      setData((current) => {
        if (foreground.current === message.difficulty) {
          foreground.current = null
          setGenerating(null)
          setScreen('game')
          return { ...current, games: { ...current.games, [message.difficulty]: createGame(puzzle) }, recentPuzzleIds: [...current.recentPuzzleIds, puzzle.id].slice(-100) }
        }
        return { ...current, queued: { ...current.queued, [message.difficulty]: puzzle } }
      })
    }
    return () => instance.terminate()
  }, [])

  useEffect(() => {
    if (!worker.current || generating) return
    const missing = difficulties.find((level) => !data.queued[level])
    if (missing) worker.current.postMessage({ difficulty: missing, seed: (Date.now() + difficulties.indexOf(missing) * 1009) >>> 0 })
  }, [data.queued, generating])

  useEffect(() => {
    if (screen !== 'game' || !game || game.paused || game.status !== 'playing') return
    const timer = window.setInterval(() => setData((current) => ({ ...current, games: { ...current.games, [difficulty]: tick(current.games[difficulty]!) } })), 1000)
    return () => window.clearInterval(timer)
  }, [difficulty, game, screen])

  useEffect(() => {
    const visibility = () => {
      if (document.hidden && game && !game.paused) setData((current) => ({ ...current, games: { ...current.games, [difficulty]: { ...current.games[difficulty]!, paused: true } } }))
    }
    document.addEventListener('visibilitychange', visibility)
    return () => document.removeEventListener('visibilitychange', visibility)
  }, [difficulty, game])

  const stats = useMemo(() => ({ completed: data.attempts.filter((attempt) => attempt.outcome === 'completed').length, played: data.attempts.length }), [data.attempts])

  const newGame = (level: Difficulty) => {
    setDifficulty(level)
    const existing = data.games[level]
    if (existing?.status === 'playing' && existing.started) {
      setScreen('game')
      return
    }
    const queued = data.queued[level]
    if (queued) {
      setData((current) => ({ ...current, queued: { ...current.queued, [level]: undefined }, games: { ...current.games, [level]: createGame(queued) }, recentPuzzleIds: [...current.recentPuzzleIds, queued.id].slice(-100) }))
      setScreen('game')
    } else {
      foreground.current = level
      setGenerating(level)
      // The seed is intentionally sampled at the user-action boundary.
      // eslint-disable-next-line react-hooks/purity
      worker.current?.postMessage({ difficulty: level, seed: Date.now() >>> 0 })
    }
  }

  const updateGame = (next: GameState) => setData((current) => ({ ...current, games: { ...current.games, [difficulty]: next } }))

  if (screen === 'game' && game) return <GameBoard game={game} setGame={updateGame} onHome={() => { updateGame({ ...game, paused: true }); setScreen('home') }} />

  return <main className="app-shell">
    {!storageOkay && <div className="storage-warning" role="alert">Progress cannot be saved on this device. Keep this page open.</div>}
    <header className="brand"><span className="brand-mark" aria-hidden="true">9</span><div><p className="eyebrow">A quiet daily challenge</p><h1>Karen’s Sudoku</h1></div></header>
    <section className="welcome-card" aria-labelledby="welcome-title">
      <p className="kicker">Killer Sudoku</p><h2 id="welcome-title">Ready when you are.</h2><p>Choose a difficulty and settle into a new puzzle.</p>
      <div className="difficulty-list">
        {difficulties.map((level) => <button key={level} onClick={() => newGame(level)}><span>{titleCase(level)}</span><small>{data.games[level]?.status === 'playing' && data.games[level]?.started ? `Resume · ${formatTime(data.games[level]!.elapsedSeconds)}` : data.queued[level] ? 'Ready to play' : 'New puzzle'}</small><b>›</b></button>)}
      </div>
    </section>
    <footer className="home-footer"><span>{stats.completed} completed</span><span>Stored only on this device</span></footer>
    {generating && <div className="modal-backdrop"><div className="generating" role="status"><span className="spinner"/><strong>Puzzle generating</strong><p>Finding a unique {generating} puzzle…</p><button onClick={() => { foreground.current = null; setGenerating(null) }}>Cancel</button></div></div>}
  </main>
}
