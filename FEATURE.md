# Feature: Investigate slow PWA startup time on iOS/Safari

## Background

The original theory was that Vercel's free tier was serving the app from a US datacenter, adding
network latency for an Australia-based user. **This has been tested and ruled out**: the
`x-vercel-id` response header on the live site reads `syd1::vsrpx-1787874766793-6ec09ebe4b01` — the
`syd1` prefix confirms Vercel is already serving from Sydney. So edge/hosting latency is not the
cause, and moving to Cloudflare Pages would not fix the slow startup (see git history for the
fuller writeup of that investigation, since dropped from this file).

A Lighthouse run (Brave, desktop) scored 100 Performance, 1.2s FCP/LCP. That's a real result, but
it doesn't settle the question either — Lighthouse audits a **fresh tab load in a desktop browser**,
which is a different code path from **launching an already-installed PWA from the iOS home screen**,
the actual scenario that feels slow. Specifically, a desktop Lighthouse run doesn't exercise:

- Standalone-mode launch overhead (WKWebView cold start on iOS)
- Real iPhone CPU (much slower than a desktop machine)
- The service worker's behavior on a *repeat* launch of an installed app, days after last use
- Real cellular/Wi-Fi conditions on the device

So the investigation moves to profiling and fixing the actual iOS PWA launch path.

## Suspected causes, iOS-specific

- **The service worker's navigation strategy is network-first, not cache-first.** In
  `public/sw.js`, the `fetch` handler for `event.request.mode === 'navigate'` always calls
  `fetch(event.request)` first and only falls back to the cached shell in the `.catch()` on
  network failure. That means **every single app launch pays a full network round-trip
  (DNS/TLS/TTFB/download) before anything renders**, even though a perfectly good cached shell is
  sitting right there. This is the single most likely, most fixable cause of "slow to open" — and
  it has nothing to do with hosting.
- **iOS's Service Worker/Cache Storage eviction.** WebKit evicts a site's service worker
  registration and Cache Storage after roughly a week of no activity in Safari. If the app isn't
  opened for several days, the *next* launch has to fully re-register the worker and re-populate
  the cache from network — a real, one-time-per-eviction slow launch that's a platform constraint,
  not a bug.
- **No perceived-startup mitigation.** `index.html` has `apple-touch-icon` and `theme-color` but no
  `apple-touch-startup-image` splash screens. Without one, iOS shows a blank white flash while
  WKWebView initializes and the app boots, which reads as "slow" even when the underlying load is
  fast.
- **JS parse/execute time on a real phone CPU** before React mounts — worth measuring directly
  rather than assuming, since desktop Lighthouse numbers don't transfer.
- **Cold WKWebView boot itself.** Some fixed overhead in spinning up a new standalone web view on
  home-screen launch is an iOS platform cost that can be minimized but not eliminated.

## How to profile it on a real iPhone

Desktop Lighthouse can't reach the actual failure mode — this needs Safari's remote Web Inspector:

1. On the iPhone: Settings → Safari → Advanced → enable **Web Inspector**.
2. Connect the iPhone to a Mac via cable, open Safari on the Mac → **Develop** menu → select the
   iPhone → find the installed PWA's session (it shows up once the PWA is open on the phone).
3. Force-quit the PWA on the phone (swipe it away from the app switcher) for a true cold start,
   then relaunch it from the home screen icon while the **Timelines** tab is recording in Web
   Inspector.
4. Read the trace: time to first script evaluation, time to first paint, and whether the `fetch`
   handler in `sw.js` is visibly blocking the navigation on a network round-trip (this should be
   directly visible as a network request preceding first render).
5. Repeat once immediately (warm cache, worker already active) versus after force-quitting and
   waiting — the difference between those two tells you how much of the delay is the network-first
   navigation fetch versus fixed WKWebView boot cost.
6. Cheap addition: drop a few `performance.mark()` calls into `src/main.tsx` (before
   `createRoot(...).render`, right after it, and around the service worker registration) — they
   show up automatically in the Web Inspector's timeline without extra tooling.

## Strategies to improve it, in priority order

1. **Switch the service worker's navigation handler from network-first to cache-first
   (stale-while-revalidate).** In `public/sw.js`, respond to `navigate` requests immediately from
   `caches.match('/')` when available, and update the cache from the network in the background
   (rather than blocking the response on the network call). This removes the full network
   round-trip from the critical path on every repeat launch — the app is 100% client-side with no
   server data to stay fresh against, so there's no correctness reason to wait on the network
   first. This is the highest-leverage, lowest-risk fix and doesn't depend on iOS specifics at all.
2. **Add `apple-touch-startup-image` splash screens** (or confirm the manifest's `background_color`
   is enough for iOS to auto-generate a reasonable one) so the boot period shows a branded screen
   instead of a white flash — improves perceived speed even where actual load time is unchanged.
3. **Measure and reduce JS payload/parse time** on a real device: check the `dist/assets` bundle
   size after `npm run build`, and consider code-splitting rarely-needed screens (e.g. the stats
   view) with `React.lazy` so the initial bundle needed for first paint is smaller.
4. **Add `rel="modulepreload"` for the main entry script in `index.html`** so the browser starts
   fetching the JS bundle as early as possible instead of discovering it only after parsing the
   HTML.
5. **Accept the iOS 7-day service worker eviction as a platform constraint**, but make sure
   re-registration after eviction is as cheap as possible (the current shell precache list is
   already small — five files — so this is likely already close to fine; re-verify after fix #1).

## Plan

1. ~~Apply fix #1 (cache-first navigation in `sw.js`)~~ **Done.** `public/sw.js`'s `navigate`
   handler now serves the cached shell immediately when present and refreshes the cache from the
   network in the background, instead of blocking every launch on a network round-trip. Verified
   `npm test`, `npm run lint`, and `npm run build` all still pass. Not yet profiled on a real
   device.
2. Profile a real iPhone cold launch (steps above) *before and after* fix #1 to confirm it actually
   moves the needle, since the current belief that the SW is the bottleneck is still a hypothesis,
   not a measurement. Since fix #1 is already applied, this now means comparing against memory/
   expectation of the old behavior, or checking out the previous `sw.js` temporarily for an A/B.
3. If a meaningful gap remains after #1, add the splash screen images (#2) to address perceived
   speed, then re-measure real JS parse time (#3/#4) on-device before doing any bundle-size work —
   no point optimizing a bundle that isn't actually the bottleneck.
4. Re-test after each change rather than bundling them all at once, so it's clear which change (if
   any) actually helped.
