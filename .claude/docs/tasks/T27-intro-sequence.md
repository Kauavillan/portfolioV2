# T27 — Intro sequence

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 3 · M4 | L | T06, T10, T15, T18 | F10 |

## Goal
The first visit opens with a minimal overlay, the world loads and the **camera flies** to the home while the hero name "rises" letter by letter — with a quick exit for anyone who does not want to wait.

## Scope
- **`Intro`** (client): `[data-intro]` overlay (z-index above the HUD) with a mono line (`data-intro-line`, e.g. "<your name> · <your world>"), status (`data-intro-status`) and a **Skip** button (`data-intro-skip`). Only acts if `html.is-intro` (set by the T05 script); otherwise it removes the state and exits.
- **Initial state** (`gsap.set`): `[data-hero-ch]` letters with `yPercent 110, opacity 0`; remaining `#home [data-reveal]` with `opacity 0, y 24`; the intro line animates `opacity 0 → 1` and wide → normal `letter-spacing` (≈ 1.4 s `expo.out`). After **600 ms** without the world ready, status "Loading the 3D world…" (i18n).
- **Wait:** `Promise.race([worldReady, timeout 4.5 s])` (`worldReady` comes from `WorldCanvas` — `null` if `no-webgl`).
- **Timeline:** overlay `autoAlpha 0` (≈ 1.1 s), `rig.intro.value 0 → 1` (**3.4 s** on the 1st visit, **1.9 s** on later ones, `power3.inOut`; **without 3D**: duration ≈ 0), letters `yPercent → 0` (1.2 s `expo.out`, stagger .06), remaining items reveal (1 s, stagger .08), CTAs last.
- **Visit memory:** `localStorage['<project>:intro-seen']` (try/catch); only affects the duration.
- **Skipping:** click on Skip, `wheel`, `touchmove` or any key ≠ Tab → finishes immediately (`progress(1)`), **once**.
- **Scroll locked** during the intro (`lockScroll()` / `unlockScroll()` at the end); on finishing, if focus was on Skip, move it to the `h1` (`preventScroll`).
- **Failsafe**: if the JS fails, the T05 CSS hides the overlay after 7 s; ensure `is-intro` is always removed (including on error/timeout).
- **Reduced-motion / `#hash` / scroll > 40:** no intro at all (already guaranteed by the T05 script); remove `is-intro` immediately.
- Integrate `rig.intro` (T18) and remove the old `delay` from the Hero.

## Out of scope
Intro sound (music/ambience only turns on by the user's choice — T28/T29).

## Acceptance criteria
- [x] 1st visit: overlay → fly-in ≈ 3.4 s → hero revealed; 2nd visit: ≈ 1.9 s. *(measured: fly 3.4 s / 1.9 s; whole sequence 3.45 s / 2.77 s)*
- [x] Skip via button, wheel, touch and key works and does **not** fire twice. *(≤ 4 ms; `finish` runs once, also for key + click on the focused button and for a wheel burst)*
- [x] Without WebGL: short intro and no fly-in (text reveals directly). *(2.4 s)*
- [x] With `prefers-reduced-motion`, with `#work` in the URL or reloading mid-page: **no** intro. *(reload needed the navigation-type check in the T05 script — see ARCHITECTURE §13, M4)*
- [x] Turning off the world's JS (blocking the chunk) → the intro ends in ≤ 4.5 s and the page is usable. *(a failing chunk: 2.4 s; a stalled one: the wait is capped at 4.5 s, then the 2.2 s text reveal plays, ≈ 6.8 s in total; skip works at any moment)*
- [x] `is-intro` is never left "stuck"; scroll always unlocks. *(finish / skip / error / 14 s watchdog / unmount; scripts blocked → CSS failsafe hides the overlay at 7 s; StrictMode checked in `next dev`)*
- [x] Complete pt/en (line, status, Skip).
- [x] LCP: the first paint is text (intro line/hero), not the canvas. *(the line is a CSS animation, on screen before any script; a Lighthouse LCP number is T34's)*

## Technical notes
- Use `gsap.timeline()` inside `gsap.context()`; `kill`/`revert` on cleanup.
- The "world ready" is the `createWorld` promise; expose it via context/store (`worldStatus`).

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F10 · `.claude/docs/ARCHITECTURE.md` §3, §5, §11.
