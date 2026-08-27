# Karen's Sudoku

No ads! Fuck Ads! 
Snappy fast (all data stored in your browser).
www.karens-sudoku.vercel.app
Coded with Claude.

A single-page Killer Sudoku game: standard 9x9 rows/columns/boxes plus dotted "cages" of cells that must sum to a target and can't repeat a digit. Four difficulties, undo/redo, notes, a mistake counter, and per-difficulty statistics — all client-side, no backend.

## Technology

- React and strict TypeScript for the interface and domain model
- Vite for development and production builds
- Vitest for unit and property-style tests
- A Web Worker for puzzle generation and validation
- Browser `localStorage` for versioned persistence

End-to-end user flows are covered by a manual test checklist rather than Playwright.

The persisted document uses a top-level schema version. Future changes must add sequential, pure migrations (`v1 → v2 → v3`) and retain individual attempt records so summaries can be recalculated. Unknown future versions and invalid puzzles are rejected rather than partially loaded.

## Code layout

- `src/engine/` — pure, puzzle-agnostic primitives: `grid.ts` (rows/cols/boxes/peers, base solution generation), `solver.ts` (constraint-propagation + backtracking solver used to count solutions and pick a difficulty), `random.ts` (seeded PRNG).
- `src/generator.ts` — builds a `Puzzle` (a base grid plus cages) from a seed and difficulty, using the solver to guarantee a unique solution.
- `src/puzzle.worker.ts` — runs generation off the main thread; `App.tsx` posts a `{difficulty, seed}` request and gets a `Puzzle` back.
- `src/game.ts` — pure reducer-style functions over `GameState` (enter digit, toggle note, undo/redo, tick clock); no React or storage dependencies.
- `src/statistics.ts` — folds a completed/failed/abandoned outcome into per-difficulty aggregate stats.
- `src/storage.ts` — versioned load/save of `AppData` to `localStorage`, including one-time migration of a legacy attempt log into the current summary shape.
- `src/App.tsx` — the whole UI (home, board, stats, settings screens) as one component tree.
- `src/types.ts` — shared domain types (`Puzzle`, `Cage`, `GameState`, `AppData`, etc.).

## Development

Requires a current Node.js release.

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

The service worker is registered only in production builds. To test installation and offline behavior locally, run `npm run build` followed by `npm run preview`.

Other checks:

```bash
npm test
npm run lint
npm run format:check
npm run build
```

## Data and privacy

Game data never leaves the browser. Clearing site data removes all progress unless it has first been exported from the app.

## Deployment

The repository includes `vercel.json` and is ready to import into Vercel. Account connection and production deployment are intentionally deferred. Vite's default build command (`npm run build`) and output directory (`dist`) are suitable for Vercel's Vite preset.
