# T24 — Contact scene: portal

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 3 · M3 | M | T13, T18 | F23 |

## Goal
The final scene: a "portal/beacon" that **opens** when the visitor reaches contact, closing the journey.

## Scope
- **`src/world/scenes/beacon.ts`** (free name) implementing `Region`:
  - large metal torus + thin emissive ring;
  - **"portal" disc** (`CircleGeometry`) with an additive `ShaderMaterial`: noise-driven swirl (uses the fbm from `shaders/`), animated concentric rings, soft edge and a **`uOpen`** uniform (0→1) that rises smoothly when `active`;
  - ~250 **particles** (`Points`) floating near the portal;
- **`contact` station** (head-on camera, lateral `offset`, `offsetNarrow:0`, warm→cool `mood`).
- The `#contact` reveal **does not disappear** on leaving (T09) — align with that: on arrival, `uOpen→1`; it does not need to close when leaving the last station.
- `emitter` for audio (T28).

## Out of scope
Form/CTAs (T13).

## Acceptance criteria
- [ ] On arriving at Contact the portal opens in ≈ 1–2 s; on going back, it closes/fades.
- [ ] Text and form remain legible over the scene (scrim).
- [ ] Low-cost shader on the low tier (octaves 2) — no drop below 30 fps.
- [ ] Clean `dispose()`; no per-frame allocation.
- [ ] Original object (clean-room).

## Technical notes
- Additive blending + `depthWrite:false` avoids sorting artifacts.
- Even with bloom (T26) the disc's luminance must not blow out the text.

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F23.
