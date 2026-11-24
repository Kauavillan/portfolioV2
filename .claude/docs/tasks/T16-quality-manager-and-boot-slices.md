# T16 — Adaptive quality and sliced boot

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 2 · M2 | M | T15 | F14, F15 |

## Goal
The world picks a quality tier on its own, adjusts it based on measured FPS and initializes with **no long tasks** on the main thread.

## Scope
- **`src/world/quality.ts` (pure, no THREE)**: `TIERS` (`low/medium/high` with `dpr`, `stars`, `dust`, `bloom`, `octaves` — values in F14), `initialTier(env)` (`medium` when `cores ≥ 4` **and not** (viewport < 600 px **and** `deviceMemory < 4`) **and not** (`pointer: coarse` **and** `deviceMemory < 4`); otherwise `low`; **never** starts at `high`), and `createSampler()` with `sample(dtMs, nowMs)` returning `-1 | 0 | +1`:
  - **2.5 s** warm-up after every tier change; **60-frame** window, ignoring Δ > 250 ms;
  - average **> 24 ms** and tier > low ⇒ steps down **and flags "never goes up again"**;
  - average **< 11 ms** for **> 5 s**, with no prior downgrade and tier < high ⇒ steps up;
  - changing tier clears the samples and reopens the warm-up.
- **Application** in `createWorld`: `applyQuality(tier)` → `setPixelRatio(min(devicePixelRatio, tier.dpr))`, and (once they exist) stars/dust `drawRange` (T17), sky `OCTAVES` (T17), bloom (T26). Sampling is off in reduced-motion.
- **Sliced boot:** `yieldToMain()` helper (`scheduler.yield?.() ?? setTimeout(0)`); stages in the order of F15 (each one filled in by the following tasks), each with `performance.measure('world:<stage>')`. At the end, `renderer.compileAsync(scene, camera)` when `KHR_parallel_shader_compile` is available, otherwise `compile`.
- Expose `handle.quality` (getter) and an optional `onQuality` event/callback for debugging.

## Out of scope
Stage content (T17+), bloom (T26).

## Acceptance criteria
- [x] `quality.ts` imports neither `three` nor `window` (receives `env` as a parameter) — **testable**; documented test cases (strong desktop → medium; weak mobile → low; 60 frames at 30 ms → steps down and never goes up again; 60 frames at 8 ms for 6 s → steps up).
- [ ] On a device/6× CPU throttling the tier drops and stabilizes (temporary log); without CPU throttling it steps up after ≥ 5 s stable. — **not verified, see notes**
- [x] `performance.getEntriesByType('measure')` lists `world:*` for each stage; no single stage > ~50 ms on the reference desktop (note exceptions in the task).
- [x] Reduced-motion does not sample FPS.

## Technical notes
- The "already stepped down" state is not reset until reload — avoids oscillation.
- Keep the constants in an exported `QUALITY_CONFIG` object (useful for the T35 tests).

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F14, F15 · `.claude/docs/ARCHITECTURE.md` §6.2, §6.4.

## Implementation notes (done 2026-11-23)
- `quality.ts` is pure and has **42 documented test cases** (run today with Node's type stripping; they become Vitest tests in T35): strong desktop → medium, never high at start, weak mobile → low, unknown `deviceMemory` not penalised, 30 ms frames → down once and never up, 8 ms frames → up only after the warm-up **and** 5 s sustained, spikes ignored, warm-up reopens after every change, floor/ceiling respected.
- **Deviation from F14:** the reference ignores every frame longer than 250 ms. On a device that never beats ~4 fps that makes the sampler blind (all frames ignored → it never downgrades). Isolated long frames are still ignored, but **15 consecutive** ones now start to count (clamped to 250 ms); combined with the 60-frame average that means ≈ 17 consecutive long frames (≈ 4.5 s of continuous < 4 fps) trigger a step down, so a one-off GC or shader-compile hitch can never cause a permanent downgrade. Unit-tested on both sides (14 ignored, 16 tolerated, 17 steps down). *Honest provenance:* I first noticed the blind spot on a machine that was overloaded by browser processes my own test scripts had leaked (100% of frames > 250 ms); on a clean machine only ~5% of software-GL frames exceed 250 ms. The rule is justified by the design argument and the unit tests, not by that contaminated measurement.
- Browser: on the software renderer the tier goes `medium → low` and holds (no oscillation); applying `low` sets dpr 1, 2600 stars and 2 sky octaves. **Not verified in a browser:** stepping *up* (needs a fast GPU; covered by the unit test only) and a literal 6× CPU-throttle run (the software renderer was already far slower).
- Boot stages are measured as `world:renderer, environment, reflections, core, aperture, rig, quality, compile`. JavaScript-only stages cost 0.1–13 ms. **Noted exceptions (driver-bound, measured on SwiftShader so not representative of a GPU):** renderer ≈ 20–270 ms (context + drawing buffer), reflections ≈ 2–3 s (PMREM shader JIT), compile ≈ 100–400 ms. Re-measure on a real GPU in T34.
