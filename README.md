# Karen's Sudoku

No ads! Fuck Ads! 
Snappy fast (all data stored in your browser).
www.karens-sudoku.vercel.app
Coded with Claude.

## Technology

- React and strict TypeScript for the interface and domain model
- Vite for development and production builds
- Vitest for unit and property-style tests
- A Web Worker for puzzle generation and validation
- Browser `localStorage` for versioned persistence

End-to-end user flows are covered by a manual test checklist rather than Playwright.

The persisted document uses a top-level schema version. Future changes must add sequential, pure migrations (`v1 → v2 → v3`) and retain individual attempt records so summaries can be recalculated. Unknown future versions and invalid puzzles are rejected rather than partially loaded.

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
