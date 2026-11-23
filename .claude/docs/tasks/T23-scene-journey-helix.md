# T23 — Journey scene: helix and comet

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 3 · M3 | M | T12, T18 | F22 |

## Goal
The career path becomes a **luminous helix** with one node per milestone and a "comet" that travels along it — faster when the section is in focus.

## Scope
- **`src/world/scenes/journey.ts`** implementing `Region`:
  - helical curve (`CatmullRomCurve3` of ~64 points, ~1.6 turns, radius ≈ 12, height ≈ 30) rendered as a thin **tube** (`TubeGeometry`, translucent basic material in the accent color);
  - **N nodes** (`N = milestoneCount`) evenly spaced along the curve: ring + small sphere (the last one in the cool accent color);
  - **comet**: glowing sphere + `PointLight`; advances at `u = (t·v) mod 1` with `v ≈ .03/s` (**≈ .07/s** when `active`);
  - nodes **grow** (up to ~×1.6) near the comet and rotate; the whole assembly rotates slowly.
- **`journey` station** (head-on camera, lateral `offset`, `offsetNarrow:0`, `mood`).
- `milestoneCount` comes from `getWorldData()` (= `milestones.length` from the DOM/data) — the engine does **not** receive texts.
- `emitter` for audio (T28).

## Out of scope
DOM timeline (T12).

## Acceptance criteria
- [ ] The helix shows exactly `N` nodes; changing the number of milestones in `milestones.ts` is reflected in the scene.
- [ ] Comet speeds up on entering the section and slows down on leaving (smooth).
- [ ] Nodes near the comet "pulse".
- [ ] ≥ 55 fps on the medium tier; tube geometry generated **once**.
- [ ] Clean `dispose()`; no per-frame allocation.

## Technical notes
- Reuse a `Vector3` for `curve.getPoint(u, target)`.
- Tube segments (400) are a starting point; reduce on the low tier.

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F22.
