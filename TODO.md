# Karen's Sudoku — Implementation Plan

## Product decisions

- [x] Build a mobile-first Killer Sudoku web app hosted on Vercel.
- [x] Optimize primarily for iPhone Safari.
- [x] Keep game data, settings, and statistics in `localStorage`.
- [x] Use one implicit local player per browser, with no accounts or profile selection.
- [x] Accept that clearing the browser's site data clears the player and all local progress.
- [x] Generate puzzles locally rather than relying on a fixed puzzle catalogue.
- [x] Support Easy, Medium, Hard, and Expert difficulty levels.
- [x] Do not provide hints or reveal solutions.
- [x] Check final entries immediately against the stored solution.
- [x] Support current modern browsers; do not add workarounds for obsolete Safari versions.
- [x] Allow foreground puzzle generation to take several seconds with a spinner and the message “Puzzle generating”.
- [x] Pre-generate one puzzle for every difficulty in the background while the app is open and the player is playing.
- [x] Use React, TypeScript, Vite, Vitest, and a dedicated generation Web Worker.
- [x] Use a calm, warm, highly legible visual design chosen during implementation.
- [x] Prepare Vercel configuration but defer connecting and deploying the project until the owner is ready.
- [x] Rely on manual user testing rather than Playwright end-to-end tests.
- [x] Target WCAG 2.2 AA for contrast, focus handling, accessible labels, and touch targets.

## Delivery milestones

### Milestone 1 — Playable MVP

- [x] Generate and display a valid Killer Sudoku puzzle.
- [x] Support final entries, notes, erasing, mistakes, undo, and redo.
- [x] Implement the active-play timer, pause behavior, autosave, and resume.
- [x] Provide a functional mobile-first home screen and game board.

### Milestone 2 — Reliable release candidate

- [x] Verify unique solutions independently of the stored solution.
- [ ] Calibrate all four difficulty levels using solver techniques and a representative corpus.
- [x] Complete persistent background generation for all four difficulties.
- [x] Complete statistics, data export/import, storage recovery, and automated tests.
- [x] Complete the written manual test checklist.

### Milestone 3 — Production PWA

- [x] Complete offline support, installation metadata, icons, themes, onboarding, and visual polish.
- [ ] Complete accessibility and performance audits.
- [ ] Add Vercel configuration and complete the production release checklist.
- [ ] Connect and deploy to Vercel when the owner is ready.

## 1. Project foundation

- [x] Record the React, TypeScript, Vite, and Vitest stack decision in the README.
- [x] Scaffold the application with TypeScript and strict type checking.
- [x] Configure linting, formatting, and automated tests.
- [x] Define domain types for puzzles, cages, cells, moves, attempts, statistics, and settings.
- [x] Define a versioned `localStorage` schema and migration strategy.
- [x] Add development, production build, and test scripts.
- [x] Add Vercel-ready configuration; connect the repository and configure deployments later.

## 2. Killer Sudoku rules and puzzle format

- [x] Enforce standard Sudoku rules: digits 1–9 appear once in every row, column, and 3×3 box.
- [x] Enforce cage rules: every cage reaches its target sum and contains no repeated digit.
- [x] Require cages to contain orthogonally connected cells.
- [x] Limit cages to 1–5 cells, with most cages containing 2–4 cells.
- [x] Permit sparse single-cell cages on Easy puzzles only.
- [x] Define a serializable puzzle format containing a stable puzzle ID, seed, difficulty, cages, solution, and format version.
- [x] Validate imported or restored puzzle data before using it.

## 3. Puzzle engine

- [x] Generate complete valid 9×9 Sudoku solution grids.
- [x] Generate connected cage layouts covering all 81 cells exactly once.
- [x] Calculate cage sums and reject cages containing duplicate solution digits.
- [x] Avoid excessively large, awkward, or visually confusing cages.
- [x] Build a Killer Sudoku solver that does not depend on the stored solution.
- [x] Verify that every generated puzzle has exactly one solution before it enters either the foreground game or background queue.
- [x] Make generation deterministic from a seed for reproducibility and debugging.
- [x] Run generation and validation in a Web Worker so the interface remains responsive.
- [x] Show a loading spinner and the message “Puzzle generating” while generating a foreground puzzle.
- [x] Allow the player to cancel foreground generation and return home.
- [x] Never silently lower the requested difficulty when generation takes a long time; continue retrying valid seeds until successful or cancelled.
- [x] Maintain a background queue containing the next puzzle for Easy, Medium, Hard, and Expert.
- [x] Refill a difficulty's queue slot in the background after its prepared puzzle is consumed.
- [x] Schedule background generation so it does not interfere with touch input, timer accuracy, or active play.
- [x] Persist one queued puzzle per difficulty in `localStorage` so prepared puzzles survive refresh or browser closure.
- [x] Validate every restored queued puzzle before making it available to play.
- [x] Prevent recently played puzzle IDs from being generated again.
- [x] Save a generated puzzle before play begins so a refresh cannot replace it.

## 4. Difficulty system

- [ ] Define a measurable technique-based difficulty model.
- [ ] Classify Easy puzzles using straightforward cage combinations and singles.
- [ ] Classify Medium puzzles using candidate elimination and cage/region interactions.
- [ ] Classify Hard puzzles using multi-cage reasoning and advanced Sudoku eliminations.
- [ ] Classify Expert puzzles using longer deduction chains without requiring guesses.
- [ ] Record solver techniques and a difficulty score during validation.
- [ ] Generate a representative test corpus for all four levels.
- [ ] Play-test and tune difficulty thresholds on iPhone.

## 5. Local player data

- [x] Create one implicit player data set per browser with no profile UI, name, or avatar.
- [x] Keep active games, settings, history, and statistics together in that local data set.
- [x] Require strong confirmation before resetting local player data.
- [x] Make it clear that data does not sync between devices and is removed when browser site data is cleared.

## 6. Home and game setup

- [x] Create a home screen for the local player.
- [x] Provide a prominent New Game action.
- [x] Let the player select Easy, Medium, Hard, or Expert.
- [x] Show resumable games with elapsed time, mistakes, and difficulty.
- [x] Support one active unfinished game per difficulty.
- [x] Confirm before replacing or abandoning an unfinished game.
- [x] Record replacement or voluntary restart of a started game as an abandoned attempt.
- [x] Do not record abandonment when replacing a game in which no entry or note was made.
- [x] Add navigation to statistics, settings, and data management.

## 7. Mobile-first game board

- [x] Render the 9×9 grid with clear 3×3 region boundaries.
- [x] Render cage outlines and target sums legibly at small iPhone sizes.
- [x] Ensure all controls have comfortable touch targets.
- [x] Prevent accidental page zooming, text selection, and unwanted scrolling during play.
- [x] Support portrait and landscape orientations.
- [x] Highlight the selected cell and its row, column, box, and cage.
- [x] Highlight matching entered digits and notes.
- [x] Distinguish correct entries, wrong entries, notes, and selected states without relying only on colour.
- [x] Show when all nine instances of a digit have been correctly placed.
- [x] Add a number pad for digits 1–9.
- [x] Add accessible labels and logical keyboard controls for desktop use.

## 8. Entry, notes, and editing

- [x] Provide clearly visible Entry and Notes modes.
- [x] Allow Notes mode to toggle candidate digits 1–9 in an empty cell.
- [x] Allow Entry mode to place a final digit in a cell.
- [x] Clear all notes in a cell when a final digit is entered there.
- [x] Leave an incorrect digit visible and mark it as wrong until erased.
- [x] Do not remove peer notes after an incorrect entry.
- [x] After a correct entry, remove that digit from notes in the same row, column, box, and cage.
- [x] Allow notes that are currently invalid; do not treat notes as mistakes.
- [x] Make Erase clear either the cell entry or all notes in the selected cell.
- [x] Implement undo and redo for entries, erasures, and note changes.
- [x] Restore automatically removed notes when the triggering move is undone.
- [ ] Consider an optional long-press gesture to highlight a digit across the board.

## 9. Timer and play state

- [x] Display a small, readable timer above the game board.
- [x] Start an attempt and its timer on the player's first entry or note.
- [x] Measure active play time rather than simple wall-clock time.
- [x] Pause when the page is hidden or the phone is locked.
- [x] Provide an explicit pause control.
- [x] Hide the board while explicitly paused.
- [x] Pause active time whenever the board is hidden, the page is not visible, or another in-app screen is active.
- [x] Restore timer state accurately after refresh, browser closure, or a crash.
- [x] Autosave after every game action.

## 10. Mistakes, wins, and losses

- [x] Validate final entries immediately against the puzzle solution.
- [x] Count each incorrect final entry as one mistake.
- [x] Display the current mistake count out of three.
- [x] Keep an incorrect digit visible until the player uses Erase.
- [x] End and lock the attempt immediately after the third mistake.
- [x] Record the failed attempt before showing post-game actions.
- [x] After a loss, offer Restart Same Puzzle and New Puzzle.
- [x] Treat a same-puzzle restart as a new attempt with zero time and mistakes.
- [x] Detect puzzle completion and stop the timer.
- [x] Record whether a completed attempt had zero mistakes.
- [x] Show a concise completion summary with time, mistakes, and any new best time.

## 11. Statistics

- [x] Record attempts when the first entry or note is made.
- [x] Track attempts started.
- [x] Track puzzles completed.
- [x] Track failed attempts.
- [x] Track completion rate.
- [x] Track completions with zero mistakes.
- [x] Track average completion time using completed attempts only.
- [x] Track best completion time using completed attempts only.
- [x] Present statistics overall and by difficulty with selectable filters.
- [x] Preserve individual attempt records needed to recalculate summaries after schema changes.
- [x] Record abandoned attempts separately; include them in attempts started but not failed attempts.
- [x] Ensure replaying a puzzle creates a separate attempt while retaining the puzzle ID.

## 12. Persistence and data management

- [x] Persist active games, move history, statistics, settings, and recently used puzzle IDs.
- [x] Handle unavailable, full, or corrupted browser storage gracefully.
- [x] Continue the current session in memory when storage is unavailable and show a persistent warning that progress cannot be saved.
- [ ] Add versioned migrations for stored data.
- [x] Export all local app data to a downloadable JSON backup.
- [x] Import a backup only after validation, a replacement preview, and explicit confirmation that all current local data will be replaced.
- [x] Offer to download a safety backup of current data before completing an import.
- [x] Provide separate controls to reset statistics or reset the entire app.
- [x] Explain that clearing Safari website data removes local progress unless it was exported.

## 13. PWA, offline use, and appearance

- [x] Add a web app manifest, icons, theme colours, and iPhone home-screen metadata.
- [x] Add a service worker so the app works offline after its first successful load.
- [x] Ensure new deployments update cached assets safely without losing game data.
- [x] Support light, dark, and system themes.
- [x] Respect reduced-motion preferences.
- [x] Add optional sound feedback.
- [x] Add optional haptic feedback where iOS browser support permits it.
- [x] Keep sound and haptics disabled or subtle by default.

## 14. Quality and testing

- [x] Unit-test Sudoku generation and rule validation.
- [x] Unit-test cage generation, connectivity, sums, and digit uniqueness.
- [x] Unit-test the solver and unique-solution verification.
- [ ] Unit-test difficulty classification against the test corpus.
- [x] Unit-test timer, mistake, note-cleanup, undo, statistics, and persistence logic.
- [x] Property-test generated puzzles across many deterministic seeds.
- [ ] Test storage migrations, corrupt data recovery, export, and import. (Corrupt-data recovery and import rejection are covered; migration coverage starts when schema v2 exists.)
- [x] Maintain a manual user-test checklist for new game, resume, win, loss, restart, and data reset.
- [ ] Test touch interactions on small and large iPhones.
- [ ] Test Safari refresh, backgrounding, phone locking, offline use, and home-screen installation.
- [ ] Audit colour contrast, screen-reader labels, focus order, touch targets, and reduced motion against WCAG 2.2 AA.
- [ ] Keep touch feedback under 100 ms during ordinary play.
- [x] Target an initial compressed JavaScript payload under 200 KB. (Current build: approximately 66 KB gzip.)
- [ ] Measure generation performance on current iPhones before setting final foreground and background generation-time budgets.
- [x] Keep automated unit and property tests separate from the written manual release checklist.

## 15. Release

- [x] Add privacy copy explaining that all personal game data remains in the browser.
- [x] Add a short, dismissible first-run introduction covering cages, modes, mistakes, and local storage.
- [x] Allow the introduction to be reopened from Settings.
- [x] Create production icons and app metadata.
- [ ] Run the full automated and manual release checklist.
- [ ] Deploy the production build to Vercel.
- [ ] Verify the production site on iPhone Safari and as an installed PWA.
- [ ] Export an initial backup after production setup and verification.

## Deferred ideas

- [ ] Cloud synchronization across devices.
- [ ] Multiple local profiles, secure user accounts, and authentication.
- [ ] Daily puzzles or shared puzzle challenges.
- [ ] Hint and solution-reveal systems.
- [ ] Public leaderboards or social features.
