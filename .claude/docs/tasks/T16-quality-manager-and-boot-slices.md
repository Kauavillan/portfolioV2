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
- [ ] `quality.ts` imports neither `three` nor `window` (receives `env` as a parameter) — **testable**; documented test cases (strong desktop → medium; weak mobile → low; 60 frames at 30 ms → steps down and never goes up again; 60 frames at 8 ms for 6 s → steps up).
- [ ] On a device/6× CPU throttling the tier drops and stabilizes (temporary log); without CPU throttling it steps up after ≥ 5 s stable.
- [ ] `performance.getEntriesByType('measure')` lists `world:*` for each stage; no single stage > ~50 ms on the reference desktop (note exceptions in the task).
- [ ] Reduced-motion does not sample FPS.

## Technical notes
- The "already stepped down" state is not reset until reload — avoids oscillation.
- Keep the constants in an exported `QUALITY_CONFIG` object (useful for the T35 tests).

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F14, F15 · `.claude/docs/ARCHITECTURE.md` §6.2, §6.4.
