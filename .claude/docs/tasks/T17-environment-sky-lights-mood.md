# T17 — Environment: sky, stars, lighting and mood

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 2 · M2 | M | T15, T16 | F17 |

## Goal
The "air" of the world: procedural sky, stars, dust, fog and reflections for the metals — with **color that changes per station** (*mood*).

## Scope
- **`src/world/environment.ts`** → `createEnvironment(renderer, scene, quality)` with `{ bakeReflections(), applyQuality(tier), setPixelRatio(r), setMood(colorA, colorB, factor), update(t, camera), dispose() }`.
- **Sky:** sphere of radius **3000** that **follows the camera** (`BackSide`, `renderOrder −10`, `frustumCulled=false`), custom `ShaderMaterial` with an fbm-noise nebula (`OCTAVES` function via `defines`, 2/3/4 per tier) tinted by two uniforms (`uTintA/uTintB`).
- **Stars** (`Points`, custom shader, size with `uPixelRatio`) and **dust** (`Points` relative to the camera, wrapping around it); counts per tier via `geometry.setDrawRange(0, n)` (stars 2600/5200/8000, dust 350/800/1300). PRNG **with a fixed seed** (`util/rng.ts`) ⇒ deterministic world.
- **Exp2 `Fog`** (color = `--ink`, density ≈ .0058 — calibrate).
- **Reflections:** render a simple environment once into `scene.environment` (PMREM/CubeCamera) used by the metallic materials; `bakeReflections()` called as its own boot stage.
- **`setMood(a, b, k)`**: `lerp` of the tints (k = .02 per frame; **1** in reduced-motion).
- GLSL shaders **written by you** in `src/world/shaders/` (your own value/fbm noise) — do not copy the reference's.
- `dispose()` releases geometry/material/targets.

## Out of scope
Scenes (T19+); definition of the moods per station (they come from the stations in T18/T21).

## Acceptance criteria
- [x] The background becomes a sky with stars and dust; switching tier (force it via debug) changes the amount without recreating buffers.
- [x] `setMood` smoothly switches the nebula colors; in reduced-motion it switches at once.
- [ ] No ugly banding or flicker in the sky at 1440 px and 390 px. — **judged by eye on stills only (no banding seen, dithering in place); flicker over time not assessed, see notes**
- [x] Same `seed` ⇒ same star layout across reloads.
- [x] `dispose()` brings `renderer.info.memory` back to the baseline.
- [x] Boot cost of this stage measured (`world:environment`) and noted.

## Technical notes
- Canvas background colors must match `--ink` so there is no "jump" in the fade-in.
- The sky sphere uses `depthWrite:false`/`depthTest:false` as needed.

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F17 · `.claude/docs/ARCHITECTURE.md` §6.5.

## Implementation notes (done 2026-11-23)
- Own GLSL (value noise + fbm with `OCTAVES` as a `define`; hash and shaders written for this project). Sky sphere (radius 3000) follows the camera; stars (8000 allocated, seeded PRNG, size and colour per star, slow twinkle) follow it too; dust (1300, wrapped around the camera on the GPU); exp² fog from the `--ink` token; PMREM reflection bake as its own boot stage. The sky shader dithers its output to hide 8-bit banding.
- Verified: switching tier changes the drawn counts (8000 ↔ 2600) and sky octaves **without** recreating or re-uploading buffers (same typed array, same version); the same seed gives an identical layout (positions + colours checksummed over 3 independent reloads); the nebula tint eases to the active station's mood, and snaps at once under reduced motion; `dispose()` returns `renderer.info.memory` to 0 geometries / 0 textures.
- **Not verified:** banding/flicker were judged **by eye on still screenshots** at 1440 and 390 px (none visible, dithering is in place); flicker over time was not assessed.
- Cost: `environment` ≈ 4–8 ms of JavaScript; the reflection bake is driver-bound (see T16 notes).
