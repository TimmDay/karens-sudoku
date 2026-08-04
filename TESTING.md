# Manual release checklist

Automated checks must pass before starting this checklist:

```bash
npm test
npm run lint
npm run build
```

## Core game flows

- [ ] Start each difficulty and confirm a puzzle appears with a stable 9×9 board.
- [ ] Enter a correct digit and confirm related notes are removed.
- [ ] Enter an incorrect digit and confirm it remains visible, is marked without colour alone, and increments mistakes once.
- [ ] Confirm an incorrect digit must be erased before replacement.
- [ ] Toggle notes, erase notes, undo, and redo; confirm automatically removed notes return after undo.
- [ ] Confirm the timer starts on the first entry or note, pauses when hidden, and resumes accurately.
- [ ] Refresh and close/reopen the browser; confirm the active game, timer, notes, mistakes, and history survive.
- [ ] Complete a puzzle and confirm time, mistakes, and statistics are recorded.
- [ ] Reach three mistakes and confirm the attempt locks and is recorded as failed.
- [ ] Restart the same puzzle and confirm a separate zero-time, zero-mistake attempt begins.
- [ ] Abandon a started game for a new puzzle and confirm it is recorded as abandoned.
- [ ] Replace an untouched game and confirm no attempt is recorded.

## Data and settings

- [ ] Filter statistics by Overall and every difficulty; confirm all metrics change with the filter.
- [ ] Switch system, light, and dark themes and refresh to confirm persistence.
- [ ] Enable sound and haptics separately and confirm feedback remains subtle on supported hardware.
- [ ] Export a backup, change local data, import the backup, review the preview, and confirm restoration.
- [ ] Try importing malformed JSON and valid JSON with an invalid puzzle; confirm both are rejected safely.
- [ ] Reset statistics and confirm games/settings remain; reset the app and confirm strong confirmation appears.
- [ ] Block or fill browser storage and confirm play continues with a persistent save warning.

## Current iPhone Safari

- [ ] Test the smallest and largest currently supported iPhone portrait widths.
- [ ] Test landscape orientation; confirm board and controls remain usable without accidental page scrolling.
- [ ] Confirm cage dots, sums, notes, correct digits, wrong digits, selection, and 3×3 regions are distinguishable.
- [ ] Confirm touch targets are comfortable and double-tap does not zoom the game controls.
- [ ] Background the page and lock the phone; confirm active time does not advance.
- [ ] Add to Home Screen, launch standalone, and confirm safe-area spacing and icon appearance.
- [ ] Load once online, enable airplane mode, reopen, and play offline.
- [ ] Install a newer deployment and confirm saved games survive the service-worker update.

## Accessibility and release

- [ ] Navigate the full app using a hardware keyboard; verify focus order and visible focus.
- [ ] Use VoiceOver to identify the board, cells, values, errors, controls, timer, and result dialog.
- [ ] Verify WCAG 2.2 AA colour contrast in light and dark themes.
- [ ] Enable Reduce Motion and confirm the loading indicator is not distracting.
- [ ] Confirm the compressed initial JavaScript remains under 200 KB in `npm run build` output.
- [ ] Verify the deployed production site, manifest, service worker, metadata, backup download, and restore.
