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
- [x] Home shows the star on the right on desktop and centered/behind the text on mobile, without hurting readability.
- [ ] 60 fps at the medium tier on the reference desktop; at `low` it stays smooth. — **not verified, see notes**
- [x] Ticks use **one** draw call (`InstancedMesh`).
- [x] `dispose()` releases everything (`renderer.info`).
- [x] Shaders and geometries are **original** (no copying the reference) — record in the PR.

## Technical notes
- The numeric values from F18 are a *starting point*, adjust to your taste; they do not need to be identical.
- Watch the cost of fbm in the fragment shader (octaves per tier).

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F18 · `.claude/docs/ARCHITECTURE.md` §6.1.

## Implementation notes (done 2026-11-23)
- File `src/world/scenes/core.ts`. A plasma star (domain-warped fbm → deep red / coral / pale ramp, latitude bands, fresnel corona, `uHeat` brightens it while Home is in focus), an additive glow sprite, three tilted metal rings each with a thin emissive twin and a small orbiter, and 96 ticks in **one** `InstancedMesh` (every 8th larger and brighter). Station `home`: `(0, 6, 60)` → origin, `offset −6`, `offsetNarrow 0`.
- Composition was tuned from screenshots: scene centred in the free band between the text column and the nav rail on desktop (star at NDC x ≈ +.15…+.5), centred behind the text on mobile (NDC x ≈ 0, fov 58, film offset 0). Tier `setQuality` gives the star one more octave than the sky.
- **All shaders, geometries, names and numbers are original** (nothing copied from the reference; the F18 numbers were only a starting point and were changed).
- **Not verified:** 60 fps on a real GPU at the medium tier. The load is modest (≈ 30 draw calls, ≈ 66 k triangles per frame) but it can only be measured on hardware (T34).
