# T25 — Picking and hover

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 3 · M3 | M | T14, T21 | F24 |

## Goal
The project objects respond to the mouse (hover) and to click/tap (open the case file), **without interfering** with the HTML content on top.

## Scope
- **`src/world/picking.ts`**: `Raycaster` with the pointer's NDC; `pickProjectId(pickables)` → `userData.projectId ?? null` of the first hit (recursive).
- **Hover** (`pointer: fine` only): on `pointermove` mark "dirty"; in the frame, **80 ms throttle** → `pick`; if it changed, toggle `html.world-hover` (`pointer` cursor), set `hoverId` (feeds the artifacts' `hover`, T21) and call `onHover(id)` (sound, T28).
- **Click/tap:** listener on `window` that **ignores** the event if `event.target.closest('a, button, input, label, dialog, p, h1, h2, h3, li, [data-no-pick]')`; otherwise it does the pick and calls `onPick(id)` → `openCase(id, opener?)` (T14).
- Under `prefers-reduced-motion` the world is on-demand: mark `dirty` when the hover changes.
- Remove the listeners and the `world-hover` class in `dispose`.
- Ensure `.world` stays `pointer-events:none` (events come from `window`).

## Out of scope
Sounds (T28), case content (T14).

## Acceptance criteria
- [ ] Hovering over an object changes the cursor and scales the object; leaving restores it.
- [ ] Clicking the object opens the case file **of the right project** (test all 5); clicking on text/buttons does **not** open it.
- [ ] On touch, tapping an object (outside interactive elements) opens the case; scrolling does **not** open it.
- [ ] Throttle respected (at most ~12 raycasts/s; verify with a temporary counter).
- [ ] No listener leak in StrictMode.
- [ ] With the modal open, clicks on the backdrop do not "pass through" to the 3D.

## Technical notes
- Distinguish tap from scroll (movement tolerance ≈ 10 px) so it does not open while scrolling.
- Since picking uses the canvas behind the HTML, areas with text are dead zones by design.

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F24.
