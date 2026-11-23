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
- [ ] Scrolling home → about the camera dwells at the start/end of each stretch and travels in the middle (no "jolts" at the boundaries).
- [ ] Resizing/changing the body height recalculates anchors (without reloading).
- [ ] < 900 px: `offsetNarrow` (centered scene); ≥ 900 px: scene shifted to the side opposite the text.
- [ ] Parallax only with a mouse; there is **none** with touch.
- [ ] Reduced-motion: jumps between stations with a fade and does **not** render in a loop.
- [ ] `rig-math.ts` with no `three`/DOM import; test cases described in the task and implemented in T35 (monotonic anchors, `f` at the 0/1 edges, `blend` = 0 before .18 and 1 after .82, desktop×mobile offsets).
- [ ] No per-frame allocations (reuse `Vector3`).

## Technical notes
- An unknown station (e.g. `data-station` with no entry in the map) is **ignored**, never breaks anything.
- Minimum of 2 stations; with fewer, the rig is inactive (camera stays in the initial pose).

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F13 · `.claude/docs/ARCHITECTURE.md` §6.3.
