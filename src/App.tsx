import { useEffect, useMemo, useRef, useState } from 'react'
import { createGame, enterDigit, eraseCell, redo, tick, toggleNote, undo } from './game'
import { defaultData, difficulties, exportData, loadData, parseImport, saveData } from './storage'
import type { AppData, Attempt, Difficulty, GameState, Puzzle } from './types'

type Screen = 'home' | 'game' | 'stats' | 'settings'
type Mode = 'entry' | 'notes'

const titleCase = (value: string) => value[0]!.toUpperCase() + value.slice(1)
const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`

const cellBorders = (puzzle: Puzzle, cell: number) => {
  const cage = puzzle.cageByCell[cell]
  const row = Math.floor(cell / 9)
  const col = cell % 9
  return {
    '--cage-top': row === 0 || puzzle.cageByCell[cell - 9] !== cage ? '3px' : '0px',
    '--cage-right': col === 8 || puzzle.cageByCell[cell + 1] !== cage ? '3px' : '0px',
    '--cage-bottom': row === 8 || puzzle.cageByCell[cell + 9] !== cage ? '3px' : '0px',
    '--cage-left': col === 0 || puzzle.cageByCell[cell - 1] !== cage ? '3px' : '0px',
  } as React.CSSProperties
}

function GameBoard({ game, setGame, onHome, onRestart, onNewPuzzle, sound, haptics }: { game: GameState; setGame: (game: GameState) => void; onHome: () => void; onRestart: () => void; onNewPuzzle: () => void; sound: boolean; haptics: boolean }) {
  const [selected, setSelected] = useState(0)
  const [mode, setMode] = useState<Mode>('entry')
  const selectedValue = game.cells[selected]?.value
  const selectedCage = game.puzzle.cageByCell[selected]
  const selectedRow = Math.floor(selected / 9)
  const selectedCol = selected % 9

  const input = (digit: number) => {
    const next = mode === 'notes' ? toggleNote(game, selected, digit) : enterDigit(game, selected, digit)
    if (next === game) return
    if (haptics) navigator.vibrate?.(next.cells[selected]?.wrong ? [30, 30, 30] : 12)
    if (sound) {
      const AudioContextClass = window.AudioContext
      const context = new AudioContextClass()
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.frequency.value = next.cells[selected]?.wrong ? 180 : 520
      gain.gain.setValueAtTime(.025, context.currentTime)
      gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .08)
      oscillator.connect(gain).connect(context.destination)
      oscillator.start(); oscillator.stop(context.currentTime + .08)
    }
    setGame(next)
  }
  const completeDigits = new Set(Array.from({ length: 9 }, (_, index) => index + 1).filter((digit) => game.cells.filter((cell) => cell.value === digit && !cell.wrong).length === 9))

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
      {game.status !== 'playing' && <div className="board-cover"><strong>{game.status === 'won' ? 'Beautifully done!' : 'Three mistakes'}</strong><p>{formatTime(game.elapsedSeconds)} · {game.mistakes} mistakes</p><div className="result-actions"><button onClick={onRestart}>Restart same puzzle</button><button onClick={onNewPuzzle}>New puzzle</button><button className="secondary" onClick={onHome}>Home</button></div></div>}
    </div>

    <div className="edit-tools">
      <button onClick={() => setGame(undo(game))} disabled={!game.past.length}>↶<span>Undo</span></button>
      <button onClick={() => setGame(eraseCell(game, selected))}>⌫<span>Erase</span></button>
      <button className={mode === 'notes' ? 'active' : ''} onClick={() => setMode((value) => value === 'entry' ? 'notes' : 'entry')}>✎<span>Notes {mode === 'notes' ? 'on' : 'off'}</span></button>
      <button onClick={() => setGame(redo(game))} disabled={!game.future.length}>↷<span>Redo</span></button>
    </div>
    <div className="number-pad" aria-label="Number pad">
      {Array.from({ length: 9 }, (_, index) => index + 1).map((digit) => <button className={completeDigits.has(digit) ? 'complete' : ''} disabled={completeDigits.has(digit)} aria-label={completeDigits.has(digit) ? `${digit}, complete` : `${digit}`} key={digit} onClick={() => input(digit)}>{digit}</button>)}
    </div>
  </main>
}

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData())
  const [screen, setScreen] = useState<Screen>('home')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [statsFilter, setStatsFilter] = useState<'overall' | Difficulty>('overall')
  const [generating, setGenerating] = useState<Difficulty | null>(null)
  const [storageOkay, setStorageOkay] = useState(true)
  const worker = useRef<Worker | null>(null)
  const foreground = useRef<Difficulty | null>(null)
  const game = data.games[difficulty]

  const closeIntroduction = () => setData((current) => ({ ...current, settings: { ...current.settings, introductionSeen: true } }))

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
    if (missing) worker.current.postMessage({ difficulty: missing, seed: (Date.now() + difficulties.indexOf(missing) * 1009) >>> 0, recentPuzzleIds: data.recentPuzzleIds })
  }, [data.queued, data.recentPuzzleIds, generating])

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

  const stats = useMemo(() => {
    const attempts = statsFilter === 'overall' ? data.attempts : data.attempts.filter((attempt) => attempt.difficulty === statsFilter)
    const finished = attempts.filter((attempt) => attempt.outcome === 'completed')
    return {
      completed: finished.length,
      played: attempts.length,
      failed: attempts.filter((attempt) => attempt.outcome === 'failed').length,
      abandoned: attempts.filter((attempt) => attempt.outcome === 'abandoned').length,
      clean: finished.filter((attempt) => attempt.mistakes === 0).length,
      average: finished.length ? Math.round(finished.reduce((sum, attempt) => sum + attempt.elapsedSeconds, 0) / finished.length) : 0,
      best: finished.length ? Math.min(...finished.map((attempt) => attempt.elapsedSeconds)) : 0,
    }
  }, [data.attempts, statsFilter])

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
      worker.current?.postMessage({ difficulty: level, seed: Date.now() >>> 0, recentPuzzleIds: data.recentPuzzleIds })
    }
  }

  const updateGame = (next: GameState) => setData((current) => {
    const previous = current.games[difficulty]
    let attempts = current.attempts
    if (previous && !previous.started && next.started) {
      const now = Date.now()
      attempts = [...attempts, { id: `${next.puzzle.id}-${now}`, puzzleId: next.puzzle.id, difficulty, startedAt: now, endedAt: null, elapsedSeconds: 0, mistakes: 0, outcome: 'playing' }]
    }
    if (previous?.status === 'playing' && next.status !== 'playing') {
      const endedAt = Date.now()
      const outcome: Attempt['outcome'] = next.status === 'won' ? 'completed' : 'failed'
      const index = [...attempts].reverse().findIndex((attempt) => attempt.puzzleId === next.puzzle.id && attempt.outcome === 'playing')
      if (index >= 0) {
        const actual = attempts.length - index - 1
        attempts = attempts.map((attempt, attemptIndex) => attemptIndex === actual ? { ...attempt, endedAt, elapsedSeconds: next.elapsedSeconds, mistakes: next.mistakes, outcome } : attempt)
      }
    }
    return { ...current, attempts, games: { ...current.games, [difficulty]: next } }
  })

  const downloadBackup = () => {
    const url = URL.createObjectURL(exportData(data))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `karens-sudoku-backup-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const importBackup = async (file: File) => {
    const imported = parseImport(await file.text())
    if (!imported) { window.alert('That file is not a valid Karen’s Sudoku backup.'); return }
    if (window.confirm('This will replace all games, statistics, and settings on this device. Continue?')) setData(imported)
  }

  const startFreshPuzzle = (level: Difficulty, abandon = false) => {
    const queued = data.queued[level]
    if (queued) {
      setData((current) => {
        let attempts = current.attempts
        const oldGame = current.games[level]
        if (abandon && oldGame?.started && oldGame.status === 'playing') {
          const reverseIndex = [...attempts].reverse().findIndex((attempt) => attempt.puzzleId === oldGame.puzzle.id && attempt.outcome === 'playing')
          if (reverseIndex >= 0) {
            const actual = attempts.length - reverseIndex - 1
            attempts = attempts.map((attempt, index) => index === actual ? { ...attempt, outcome: 'abandoned', endedAt: Date.now(), elapsedSeconds: oldGame.elapsedSeconds, mistakes: oldGame.mistakes } : attempt)
          }
        }
        return { ...current, attempts, queued: { ...current.queued, [level]: undefined }, games: { ...current.games, [level]: createGame(queued) }, recentPuzzleIds: [...current.recentPuzzleIds, queued.id].slice(-100) }
      })
      setScreen('game')
    } else {
      foreground.current = level
      setGenerating(level)
      worker.current?.postMessage({ difficulty: level, seed: Date.now() >>> 0, recentPuzzleIds: data.recentPuzzleIds })
      setScreen('home')
    }
  }

  if (screen === 'game' && game) return <GameBoard game={game} setGame={updateGame} onHome={() => { updateGame({ ...game, paused: true }); setScreen('home') }} onRestart={() => setData((current) => ({ ...current, games: { ...current.games, [difficulty]: createGame(game.puzzle) } }))} onNewPuzzle={() => startFreshPuzzle(difficulty)} sound={data.settings.sound} haptics={data.settings.haptics} />

  if (screen === 'stats') return <main className="app-shell panel-screen"><button className="back-link" onClick={() => setScreen('home')}>‹ Home</button><p className="kicker">Your progress</p><h2>Statistics</h2><div className="stats-filter" role="group" aria-label="Filter statistics by difficulty">{(['overall', ...difficulties] as const).map((filter) => <button key={filter} className={statsFilter === filter ? 'active' : ''} aria-pressed={statsFilter === filter} onClick={() => setStatsFilter(filter)}>{titleCase(filter)}</button>)}</div><h3 className="stats-heading">{titleCase(statsFilter)}</h3><div className="stat-grid"><div><strong>{stats.played}</strong><span>Attempts</span></div><div><strong>{stats.completed}</strong><span>Completed</span></div><div><strong>{stats.played ? `${Math.round(stats.completed / stats.played * 100)}%` : '—'}</strong><span>Completion rate</span></div><div><strong>{stats.failed}</strong><span>Failed</span></div><div><strong>{stats.abandoned}</strong><span>Abandoned</span></div><div><strong>{stats.clean}</strong><span>No mistakes</span></div><div><strong>{stats.average ? formatTime(stats.average) : '—'}</strong><span>Average</span></div><div><strong>{stats.best ? formatTime(stats.best) : '—'}</strong><span>Best time</span></div></div></main>

  if (screen === 'settings') return <main className="app-shell panel-screen"><button className="back-link" onClick={() => setScreen('home')}>‹ Home</button><p className="kicker">On this device</p><h2>Settings & data</h2><label className="setting-row"><span>Appearance</span><select value={data.settings.theme} onChange={(event) => setData((current) => ({ ...current, settings: { ...current.settings, theme: event.target.value as AppData['settings']['theme'] } }))}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label><label className="setting-row"><span>Sound feedback</span><input type="checkbox" checked={data.settings.sound} onChange={(event) => setData((current) => ({ ...current, settings: { ...current.settings, sound: event.target.checked } }))}/></label><label className="setting-row"><span>Haptic feedback</span><input type="checkbox" checked={data.settings.haptics} onChange={(event) => setData((current) => ({ ...current, settings: { ...current.settings, haptics: event.target.checked } }))}/></label><button className="data-button" onClick={() => setData((current) => ({ ...current, settings: { ...current.settings, introductionSeen: false } }))}>How to play</button><button className="data-button" onClick={downloadBackup}>Download backup</button><label className="data-button file-button">Import backup<input type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importBackup(file) }}/></label><button className="data-button danger" onClick={() => { if (window.confirm('Reset statistics? Games and settings will remain.')) setData((current) => ({ ...current, attempts: [] })) }}>Reset statistics</button><button className="data-button danger" onClick={() => { if (window.confirm('Reset the entire app on this device? This cannot be undone.')) setData(defaultData()) }}>Reset entire app</button><p className="privacy-note">All data stays in this browser. Clearing browser site data removes it unless you download a backup first.</p></main>

  return <main className="app-shell">
    {!storageOkay && <div className="storage-warning" role="alert">Progress cannot be saved on this device. Keep this page open.</div>}
    <header className="brand"><span className="brand-mark" aria-hidden="true">9</span><div><p className="eyebrow">A quiet daily challenge</p><h1>Karen’s Sudoku</h1></div></header>
    <section className="welcome-card" aria-labelledby="welcome-title">
      <p className="kicker">Killer Sudoku</p><h2 id="welcome-title">Ready when you are.</h2><p>Choose a difficulty and settle into a new puzzle.</p>
      <div className="difficulty-list">
        {difficulties.map((level) => { const active = data.games[level]?.status === 'playing' && data.games[level]?.started; return <div className="difficulty-choice" key={level}><button onClick={() => newGame(level)}><span>{titleCase(level)}</span><small>{active ? `Resume · ${formatTime(data.games[level]!.elapsedSeconds)}` : data.queued[level] ? 'Ready to play' : 'New puzzle'}</small><b>›</b></button>{active && <button className="replace-game" onClick={() => { if (window.confirm(`Abandon this ${level} attempt and start a new puzzle?`)) startFreshPuzzle(level, true) }}>New</button>}</div> })}
      </div>
    </section>
    <nav className="home-nav" aria-label="App navigation"><button onClick={() => setScreen('stats')}>Statistics</button><button onClick={() => setScreen('settings')}>Settings & data</button></nav>
    <footer className="home-footer"><span>{stats.completed} completed</span><span>Stored only on this device</span></footer>
    {generating && <div className="modal-backdrop"><div className="generating" role="status"><span className="spinner"/><strong>Puzzle generating</strong><p>Finding a unique {generating} puzzle…</p><button onClick={() => { foreground.current = null; setGenerating(null) }}>Cancel</button></div></div>}
    {!data.settings.introductionSeen && <div className="modal-backdrop"><section className="introduction" role="dialog" aria-modal="true" aria-labelledby="intro-title"><p className="kicker">Welcome</p><h2 id="intro-title">How Killer Sudoku works</h2><ul><li>Place 1–9 once in every row, column, and 3×3 box.</li><li>Digits inside each dotted cage add up to its small target.</li><li>A cage cannot repeat a digit.</li><li>Use Notes for candidates. Three incorrect final entries end an attempt.</li></ul><p>Your games stay in this browser and do not sync between devices.</p><button onClick={closeIntroduction}>Let’s play</button></section></div>}
  </main>
}
