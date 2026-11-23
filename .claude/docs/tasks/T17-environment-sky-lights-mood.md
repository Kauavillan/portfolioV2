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
- [ ] The background becomes a sky with stars and dust; switching tier (force it via debug) changes the amount without recreating buffers.
- [ ] `setMood` smoothly switches the nebula colors; in reduced-motion it switches at once.
- [ ] No ugly banding or flicker in the sky at 1440 px and 390 px.
- [ ] Same `seed` ⇒ same star layout across reloads.
- [ ] `dispose()` brings `renderer.info.memory` back to the baseline.
- [ ] Boot cost of this stage measured (`world:environment`) and noted.

## Technical notes
- Canvas background colors must match `--ink` so there is no "jump" in the fade-in.
- The sky sphere uses `depthWrite:false`/`depthTest:false` as needed.

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F17 · `.claude/docs/ARCHITECTURE.md` §6.5.
