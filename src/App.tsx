export default function App() {
  return (
    <main className="app-shell">
      <header className="brand">
        <span className="brand-mark" aria-hidden="true">9</span>
        <div>
          <p className="eyebrow">A quiet daily challenge</p>
          <h1>Karen’s Sudoku</h1>
        </div>
      </header>
      <section className="welcome-card" aria-labelledby="welcome-title">
        <p className="kicker">Killer Sudoku</p>
        <h2 id="welcome-title">Ready when you are.</h2>
        <p>Choose a difficulty and settle into a new puzzle.</p>
        <button type="button">New game</button>
      </section>
    </main>
  )
}

