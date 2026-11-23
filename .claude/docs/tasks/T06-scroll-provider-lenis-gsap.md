# T06 — ScrollProvider (Lenis + GSAP + ScrollTrigger)

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 1 · M1 | M | T02, T05 | F07, F08 |

## Goal
A single scroll provider: Lenis driven by the GSAP ticker, ScrollTrigger in sync, counted *scroll locks* and a robust layout refresh.

## Scope
- **`src/controllers/ScrollProvider.tsx`** (client): creates Lenis `{ duration: 1.25, easing: t => 1 - (1 - t) ** 4, smoothWheel: true }`; `lenis.on('scroll', ScrollTrigger.update)`; `gsap.ticker.add(t => lenis.raf(t * 1000))`; `gsap.ticker.lagSmoothing(0)`; `gsap.registerPlugin(ScrollTrigger)`.
- **Reduced-motion:** does not create Lenis; `to()` uses `scrollIntoView`.
- **API via context** (`useScroll()`): `to(target, { immediate?, onComplete? })` (duration 2.2 s, offset 0), `stop()`, `start()`, `onLayout(cb) → unsubscribe`, `lenis | null`.
- **Scroll locks** (`useUiStore`, zustand — `ARCHITECTURE.md` §5): `lockScroll()/unlockScroll()` with a counter; Lenis only `stop()`s when `scrollLocks > 0`.
- **Layout refresh (F08):** signature `scrollHeight×innerWidth×innerHeight`; **200 ms** debounce; triggers `document.fonts.ready`, `window.load`, `resize`, `ResizeObserver(document.body)`; action = `ScrollTrigger.refresh()` + callbacks registered in `onLayout`.
- `lenis lenis-smooth` class on `<html>` and base Lenis CSS (`html.lenis{height:auto}`, `.lenis-stopped{overflow:hidden}`, `[data-lenis-prevent]{overscroll-behavior:contain}`, `.lenis-scrolling iframe{pointer-events:none}`) — **written by you**, not copied from the package. Remove `scroll-behavior: smooth` from `globals.scss` (conflicts with Lenis).
- Full **cleanup** (`lenis.destroy()`, `ticker.remove`, listeners, ResizeObserver) — idempotent under StrictMode.

## Out of scope
Anchors/menu (T07), reveals (T09).

## Acceptance criteria
- [x] Wheel/trackpad scrolling is smooth; keyboard (Space/PageDown/arrows) and the scrollbar keep working.
- [x] `lockScroll()` ×2 and `unlockScroll()` ×1 stays locked; the second `unlock` releases.
- [x] Resizing the window, loading fonts or changing the body height triggers **one** refresh (debounce) — verify with a temporary log.
- [x] With `prefers-reduced-motion`, there is no Lenis and `to()` still reaches the target.
- [x] Mounting/unmounting 10× (HMR/StrictMode) leaves no orphaned tickers or listeners (`gsap.ticker` with no extra callbacks; `getEventListeners(window)` stable).
- [x] Content with `data-lenis-prevent` scrolls natively.

## Technical notes
- `ScrollTrigger.update` must also run without Lenis (reduced-motion): ScrollTrigger uses native scroll.
- Do not use `window.__lenis`; expose it only through the context.

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F07–F08 · `.claude/docs/ARCHITECTURE.md` §5, §11.

## Implementation notes (done 2026-11-23)
- Verified in a real browser: smooth wheel (eases over time), Space/PageDown still scroll, a resize triggers **exactly one** refresh and a burst of 10 resizes coalesces into one, reduced motion has no Lenis and `to()` still lands on the target, `data-lenis-prevent` scrolls natively, and after 11 remounts the ScrollTrigger count, the `window`+`document` listener count and the `gsap.ticker` callbacks are identical (also in `next dev` with StrictMode).
- **Deviation — `getLenis()` instead of a `lenis` property:** reading a ref while building the context value trips `react-hooks/refs` (the same rule T01 fixed). `stop()`/`start()` are the **counted** locks (`useUiStore`), not direct Lenis calls.
- ScrollTrigger's own `resize`/`load` auto-refresh is switched off (`autoRefreshEvents: "visibilitychange"`, restored on cleanup); otherwise every resize would refresh twice.
- The preference is watched live (`withMotionPreference`): flipping `prefers-reduced-motion` rebuilds or destroys Lenis without a reload.
- Locks live in store *actions* (`setNavOpen`, `openCase`, `setIntroActive`) so each open/close pair changes the counter once, synchronously.
- Lenis (1.3.x) adds `lenis` but not `lenis-smooth` in this setup, so the `scroll-behavior` reset targets `html.lenis` as well.
