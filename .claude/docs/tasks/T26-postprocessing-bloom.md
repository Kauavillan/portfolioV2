# T26 — Post-processing: bloom

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 3 · M3 | S | T16 | F25 |

## Goal
Soft glow on emissives **on the high tier only**, with zero cost for anyone who does not use it.

## Scope
- **`src/world/post.ts`**: `loadComposer(renderer, scene, camera, size)` with **dynamic imports** of `EffectComposer`, `RenderPass`, `UnrealBloomPass` and `OutputPass` (from `three/examples/jsm/postprocessing/*`), created only when `tier.bloom` is set and it does not exist yet.
- Initial parameters: `UnrealBloomPass(resolution = ½ viewport, strength .55, radius .6, threshold .82)` → `OutputPass` (applies tone mapping/sRGB at the end); tune to taste.
- Loop: `composer && tier.bloom ? composer.render() : renderer.render(scene, camera)`.
- Resize and `setPixelRatio` propagated to the composer; composer `dispose()`.
- When the tier drops from `high`, stop using the composer (may keep it in memory or discard it).
- Check whether `renderer.toneMapping` needs to be disabled while the `OutputPass` is active (avoid double tone mapping).

## Out of scope
Any other effect (SSAO, DOF…).

## Acceptance criteria
- [ ] On the `low`/`medium` tier the post chunks are **not** downloaded (Network tab).
- [ ] On the `high` tier the emissives get glow without washing out the text over the scene.
- [ ] Dropping from `high` to `medium` returns to direct render without an exposure/color "jump".
- [ ] Resize keeps the bloom resolution correct; clean `dispose()`.
- [ ] No double tone mapping (compare color with/without composer).

## Technical notes
- The initial tier is never `high` (T16); the composer only loads after an FPS-driven step up.

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F25 · `.claude/docs/ARCHITECTURE.md` §6.4.
