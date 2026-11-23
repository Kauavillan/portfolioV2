# T34 — Performance budget and leak audit

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 4 · M5 | L | T26, T27, T28 | verification of F14–F16; budgets |

## Goal
Turn the **proposed** targets in `ARCHITECTURE.md` §9 into **measured** numbers, and prove that mounting/unmounting the world does not leak memory.

## Scope
- **Measurements** (strong desktop, mid-range laptop, mid-range Android phone/iPhone, CPU throttling 4×/6×): initial JS (gzip), engine chunk size, LCP, CLS, TBT/INP, FPS per tier, time of each `world:*`, time to "world ready".
- **Bundle:** analyzer (`@next/bundle-analyzer`) — confirm that `three` and the world code only appear in dynamic chunks; `three/examples` tree limited to what is needed; GSAP with ScrollTrigger only.
- **Leaks:** script (Playwright or manual) that mounts/unmounts the `WorldCanvas` **10×** and checks `renderer.info.memory.geometries/textures` and `programs` returning to baseline, number of canvases/listeners/AudioContexts, and a stable heap (Chrome DevTools → Memory).
- **Tiers:** validate that the automatic downgrade stabilizes on weak hardware and that `low` is smooth; validate "never rises after dropping".
- **Long tasks:** at boot, `PerformanceObserver('longtask')` — record and cut whatever exceeds ~50 ms (split steps).
- **Final budgets** written to `.claude/docs/ARCHITECTURE.md` §9 (replacing "proposed" with "measured") and, if possible, checked by a bundle-size test in CI (T35).
- Hidden tab: confirm render pause; (optional) audio `suspend()`.

## Out of scope
New features.

## Acceptance criteria
- [ ] Measurement table (per device/tier) attached in `.claude/docs/` or in the PR.
- [ ] `three` absent from the initial bundle (proven by the analyzer).
- [ ] 10 mount/unmount cycles with no growth in geometries/textures/programs and no extra canvases/listeners.
- [ ] LCP, CLS, TBT within targets (or target renegotiated **and documented** with the reason why).
- [ ] ≥ 55 fps (desktop, medium/high) and ≥ 30 fps (low) over most of the path; weak spots listed with the responsible scene.
- [ ] `ARCHITECTURE.md` §9 updated with measured numbers.

## Technical notes
- Always measure on a production build (`next build && next start`), not on `dev`.
- Dev StrictMode doubles effects: do not use dev to measure FPS.

## Reading
`.claude/docs/ARCHITECTURE.md` §9 · `.claude/docs/REFERENCE-ANALYSIS.md` F14–F16.
