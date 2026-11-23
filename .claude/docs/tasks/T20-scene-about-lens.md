# T20 — About scene: lens

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 2 · M2 | M | T19 | F19 |

## Goal
Second scene: an "optical" object whose aperture **reacts to being in focus** (the active About section opens the iris).

## Scope
- **`src/world/scenes/lens.ts`** (free name) implementing `Region`:
  - housing (dark metallic torus), trim ring (brass/light metal) and a thin emissive cool-accent ring;
  - instanced **markers** (~72, every 6th one larger);
  - **iris blades**: N copies of an extruded shape (`ExtrudeGeometry` from a `Shape` of your own), rotated around Z; the **angle interpolates** between "closed" and "open" according to `active` (smoothing ~.04/frame);
  - **central element** with `MeshPhysicalMaterial` (`clearcoat`) — can be a simple geometry of your own (flattened sphere, lathe, etc.);
  - 3 `PointLight`s (warm, cool, white) to make the metals stand out;
  - slow rotation and slight oscillation of the central element.
- **`about` station**: camera in front of the object (≈ +64 on Z), lateral `offset`, `offsetNarrow: 0`, its own `mood`. Place the scene along the travel axis (e.g. ≈ −110 on Z, adjust together with the others).
- `emitter` (position for audio, T28).

## Out of scope
Section texts/order (already in T10).

## Acceptance criteria
- [ ] On arriving at About the iris opens smoothly; on leaving, it closes; no pops.
- [ ] Lighting keeps the metals readable (they reflect `scene.environment`) without blowing out with the bloom (T26).
- [ ] ≥ 55 fps on the medium tier; the 3 lights do not drag the low tier down (if they do, reduce lights on `low`).
- [ ] Clean `dispose()`; iris geometry shared among the blades (1 geometry, N meshes).
- [ ] Original objects (do not copy the reference).

## Technical notes
- Asynchronous geometry (load/generate later) is optional; if used, handle `dispose` before it finishes (`disposed` flag).

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F19.
