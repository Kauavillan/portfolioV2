# T18 — Camera rig and stations

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 2 · M2 | L | T15, T10–T13 | F13 |

## Goal
The camera **travels through the world as you scroll**, dwells at each station and adapts the framing to desktop/mobile — the heart of the experience.

## Scope
- **`src/world/rig-math.ts` (pure, testable)**: `computeAnchors(stations: {top,height}[], vh)` (anchor = `topAbs + min(h, 1.2·vh)/2 − vh/2`, strictly increasing), `locate(anchors, scrollY) → {index, f}`, `smootherstep`, `blendFromF(f) = smootherstep(clamp((f−.18)/.64))`, `filmOffsetAt(index, blend, stations, width)` (uses `offset` ≥ 900 px, `offsetNarrow` < 900 px).
- **`src/world/rig.ts`**: reads `[data-station]` (`ATTR.station`) whose value exists in the regions' station map; `CatmullRomCurve3(points, false, 'centripetal')` for positions and for targets; `u = (index+blend)/(n−1)`; smoothing `1−exp(−dt·k)` with **k=4.2** (**14** with `intro.value<1`); `camera.filmOffset`; pointer **parallax** only with `pointer: fine` (normalized pointer `x,y ∈ [−.5,.5]`; displacement `x·2.4`, `y·1.5` in the camera plane); `intro = { value, from: (0,46,320), fromTarget: (0,10,−60) }` (used by T27); `rebuild()` and `measure()` (called by `handle.refresh()` after the `ScrollProvider` layout refresh); `focus {index, blend}`, `stationAt/elementAt/stationCount`.
- **Station change detection** (`onStation({index,key,station})`) and the environment's **`setMood`** every frame with the active station's `mood`.
- **Reduced-motion:** no interpolation; station = `f<.5 ? i : i+1`; on change, signal a *cut* → add `is-cut` on `.world` for 360 ms (canvas disappears/returns) and render on demand.
- Test stations (placeholder positions) for `home` and `about` until the scenes exist; the real ones come from the regions (each `Region.stations`).
- Wire `ScrollProvider.onLayout → handle.refresh()`.

## Out of scope
Real scenes (T19+), intro (T27).

## Acceptance criteria
- [x] Scrolling home → about the camera dwells at the start/end of each stretch and travels in the middle (no "jolts" at the boundaries).
- [x] Resizing/changing the body height recalculates anchors (without reloading).
- [x] < 900 px: `offsetNarrow` (centered scene); ≥ 900 px: scene shifted to the side opposite the text.
- [x] Parallax only with a mouse; there is **none** with touch.
- [x] Reduced-motion: jumps between stations with a fade and does **not** render in a loop.
- [x] `rig-math.ts` with no `three`/DOM import; test cases described in the task and implemented in T35 (monotonic anchors, `f` at the 0/1 edges, `blend` = 0 before .18 and 1 after .82, desktop×mobile offsets).
- [x] No per-frame allocations (reuse `Vector3`).

## Technical notes
- An unknown station (e.g. `data-station` with no entry in the map) is **ignored**, never breaks anything.
- Minimum of 2 stations; with fewer, the rig is inactive (camera stays in the initial pose).

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F13 · `.claude/docs/ARCHITECTURE.md` §6.3.

## Implementation notes (done 2026-11-23)
- `rig-math.ts` (pure, no imports; 20+ documented test cases run today with Node type stripping, Vitest in T35) holds anchors, `locate`, `smootherstep`, the dwell/travel blend, the curve parameter, the nearest station and the film offset. `rig.ts` applies them with three: centripetal `CatmullRomCurve3` for positions and targets, exponential smoothing (k = 4.2, 14 during the intro), `filmOffset`, pointer parallax and the intro blend (`intro.value`, default 1 = off). It reads the DOM `[data-station]` elements and **ignores any station with no entry in the world's map** (work, skills… are ignored until their scenes exist); fewer than 2 known stations ⇒ the camera stays in its initial pose.
- Verified in the browser: for f ∈ {0, .1, .18} the camera has not left the home station and for f ∈ {.82, .9, 1} it is on the about station; between them it travels monotonically along the smootherstep blend (f = .5 → 50%, f = .3 → 5%, f = .7 → 95%) and there are no jolts at the boundaries (f .17 vs .19 and .81 vs .83 differ by < 1 unit). `filmOffset` is −6 at about on desktop and 0 on mobile; the field of view is 58 in portrait.
- **Anchors follow the layout:** inserting a 700 px spacer (no resize event) moved the about anchor by exactly 700 px; the old scroll position then no longer mapped to the about station and the new anchor landed on it exactly, without a reload (`ScrollProvider.onLayout → WorldCanvas → handle.refresh() → rig.rebuild()`).
- Parallax only with a mouse: opposite corners move the camera 2–6 units in the camera plane; under touch emulation (`pointer: coarse`) moving the pointer does nothing. **Reduced motion:** no render loop (0 frames in 3 s idle); crossing the half-way point adds `is-cut` for ≈ 360 ms (observed 363 ms), the pose then jumps straight to the station (no in-between pose), the sky tint and iris snap, and only a handful of frames are rendered.
- **No per-frame allocations:** the frame path reuses `Vector3`s and builds the station list once in `rebuild()`; `locate()` returns one tiny `{index, f}` object per frame. Verified indirectly: retained JS heap stays flat (9.7 → 10.0 MB after GC over 15 s of rendering). The allocation *rate* was not profiled.
- Deviation: the `offset` is −6 (not ≈ −10) for both stations, and the about station sits off the home→about axis so the path never crosses the star (ARCHITECTURE §13).

