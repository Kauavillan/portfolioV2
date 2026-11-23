# T19 — Home scene: central star and rings

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 2 · M2 | M | T17, T18 | F18 |

## Goal
First real scene — the world's "business card": a star with its own shader, metallic rings and markers. Replaces the T15 test scene.

## Scope
- **`src/world/scenes/observatory.ts`** (or the name of **your** sector, decision D1/D4) implementing `Region`: `group`, `stations: { home: {...} }`, `emitter`, `update(t, active)`, `dispose()`.
- **Central star:** sphere (~radius 4) with a "plasma" `ShaderMaterial` (fbm noise animated over time, bands, fresnel rim, warm→light palette) + **additive glow sprite** (radial texture generated via canvas) with `depthWrite:false`.
- **3 tilted metal rings** (torus; metallic `MeshStandardMaterial` materials that use `scene.environment`) with an associated **thin emissive ring**; different rotations.
- **Ticks** on an outer ring with `InstancedMesh` (~96, highlighting 1 in every N).
- `update`: slow rotation of the rings; `active` intensifies the glow (`uHeat`).
- **`home` station**: `position`, `target`, `offset` (shifts the scene to the right of the text), `offsetNarrow: 0`, `mood` (2 colors).
- Remove the test scene.

## Out of scope
Intro/fly-in (T27). Final names/aesthetics may diverge from the reference — **keep the mechanics and create your own objects** (clean-room).

## Acceptance criteria
- [ ] Home shows the star on the right on desktop and centered/behind the text on mobile, without hurting readability.
- [ ] 60 fps at the medium tier on the reference desktop; at `low` it stays smooth.
- [ ] Ticks use **one** draw call (`InstancedMesh`).
- [ ] `dispose()` releases everything (`renderer.info`).
- [ ] Shaders and geometries are **original** (no copying the reference) — record in the PR.

## Technical notes
- The numeric values from F18 are a *starting point*, adjust to your taste; they do not need to be identical.
- Watch the cost of fbm in the fragment shader (octaves per tier).

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F18 · `.claude/docs/ARCHITECTURE.md` §6.1.
