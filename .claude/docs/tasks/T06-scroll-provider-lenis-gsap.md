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
- [ ] Wheel/trackpad scrolling is smooth; keyboard (Space/PageDown/arrows) and the scrollbar keep working.
- [ ] `lockScroll()` ×2 and `unlockScroll()` ×1 stays locked; the second `unlock` releases.
- [ ] Resizing the window, loading fonts or changing the body height triggers **one** refresh (debounce) — verify with a temporary log.
- [ ] With `prefers-reduced-motion`, there is no Lenis and `to()` still reaches the target.
- [ ] Mounting/unmounting 10× (HMR/StrictMode) leaves no orphaned tickers or listeners (`gsap.ticker` with no extra callbacks; `getEventListeners(window)` stable).
- [ ] Content with `data-lenis-prevent` scrolls natively.

## Technical notes
- `ScrollTrigger.update` must also run without Lenis (reduced-motion): ScrollTrigger uses native scroll.
- Do not use `window.__lenis`; expose it only through the context.

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F07–F08 · `.claude/docs/ARCHITECTURE.md` §5, §11.
