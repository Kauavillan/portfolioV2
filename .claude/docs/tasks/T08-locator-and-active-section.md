# T08 — Locator and active section

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 1 · M1 | S | T07 | F04 |

## Goal
A single "active section" hook used by the nav and by the **locator** (index / sector / progress bar), replacing the old `Header`'s IntersectionObserver.

## Scope
- **`useActiveSection()`** (`src/hooks`): reads `[data-section]` (with `data-label`, `data-sector`); active = **the last section whose `getBoundingClientRect().top ≤ 45% of the viewport`**; updates on `scroll` (passive) and after `ScrollProvider`'s `onLayout`; returns `{ id, index, label, sector, progress }`.
- **`Locator`** (bottom-left corner, ≥ 900 px): `NN / 06 · <sector>` + bar (`transform: scaleX(progress)`, `progress = scrollY / (scrollHeight − innerHeight)`, 0 if not scrollable). `pointer-events:none`.
- Update `NavRail` (T07) to consume the hook and apply `aria-current`.
- Sector texts come from the DOM (`data-sector`, translated in the sections) — the locator has **no** strings of its own beyond the separator.
- Update via `requestAnimationFrame` (no unnecessary `setState` per scroll event — only when the section/progress changes visibly).

## Out of scope
Anything about the 3D world (the rig has its own station calculation in T18).

## Acceptance criteria
- [x] Scrolling the page, the index, the sector and `aria-current` change together on the same section.
- [x] The bar goes from 0 to 100% from top to bottom and does not "jitter".
- [x] Disappears at < 900 px.
- [x] Changing the language updates the sector without reloading.
- [x] No re-render per scroll pixel (verify with React Profiler: render only when the section changes; the bar uses `style`/ref).
- [x] Unit test (once T35 exists) of the "active section" calculation with synthetic layouts; until then, extract the pure function and export it.

## Technical notes
- Keep the 45% rule identical between the nav and the locator (a single source: the hook).

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F04.

## Implementation notes (done 2026-11-23)
- The 45% rule lives in one pure, exported module (`src/lib/active-section.ts`: `computeActiveIndex`, `computeProgress`) — covered by 9 synthetic-layout checks (they become Vitest tests in T35).
- `src/lib/section-tracker.ts` is a ref-counted, rAF-throttled tracker; `useActiveSection()` wraps it in `useSyncExternalStore`, so React re-renders **only when the section (or its translated label/sector) changes**. The progress bar is driven imperatively (`subscribeProgress`).
- **Deviation:** the hook returns `{ id, index, label, sector, total }` (no `progress`) — progress is delivered through `subscribeProgress`, otherwise every scroll pixel would re-render.
- "No re-render per scroll pixel" was verified with a **DOM-mutation proxy** (the locator text is touched ≤ 30 times while scrolling the whole page in 150 steps), not with the React Profiler.
