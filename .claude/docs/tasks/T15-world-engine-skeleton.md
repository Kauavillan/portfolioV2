# T15 — World engine skeleton

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 2 · M2 | L | T02, T05, T06 | F11, F12, F16, F34 |

## Goal
`createWorld()` working end to end with an empty scene: renderer, camera, loop, resize, `no-webgl` fallback, canvas fade-in and complete **dispose** — loaded on demand and safe under StrictMode.

## Scope
- **`WorldCanvas`** (client, `src/controllers`): after `requestIdleCallback({timeout:1200})`, checks WebGL (`webgl2`/`webgl` context on a temporary canvas); if there is none, adds `html.no-webgl` and ends. Otherwise `import("@world")` → `createWorld({container, reduced, …data from T04, callbacks})`. On error: `console.warn`, `html.no-webgl`, removes the container. Uses the pattern from `ARCHITECTURE.md` §11 (`disposed` flag during the `await`).
- **`src/world/index.ts` (`createWorld`)**: creates `canvas[aria-hidden]` inside `[data-world]`; `WebGLRenderer({antialias:true, powerPreference:'high-performance'})`; `toneMapping = ACESFilmicToneMapping`, `toneMappingExposure = 1.05`, `outputColorSpace = SRGBColorSpace`; `PerspectiveCamera(fov 42 | 58 if aspect < .8, near .5, far 4000)`; ambient + directional light (values from F12); resize (`setSize(w,h,false)`, update aspect/fov); loop with `dt = min(.05, Δ)`; **pauses** when the tab is hidden and resets clocks on return.
- When ready: `container.classList.add('is-ready')` (CSS does the canvas's 1.4 s fade-in).
- **Reduced-motion**: render only when "dirty" (resize/scroll/pointer) — prepare the `dirty` flag; (the per-station snapshot logic comes in T18).
- **`dispose()`**: cancels rAF, removes listeners (`resize`, `visibilitychange`), `util/dispose.ts` walks the scene releasing `geometry/material/textures`, `renderer.dispose()`, removes the canvas.
- **Kill switch:** if `process.env.NEXT_PUBLIC_DISABLE_WORLD === "1"`, `WorldCanvas` behaves as `no-webgl` (without downloading the engine). It allows turning off the 3D in production without reverting the deploy (used in T37).
- Expose a minimal `WorldHandle` (`quality`, `refresh`, `dispose`) per `ARCHITECTURE.md` §6.1; `types.ts` with `WorldOptions/Region/Station`.
- Test scene: a temporary cube/star to validate render and dispose (removed in T19).

## Out of scope
Adaptive quality (T16), environment (T17), per-station camera (T18), real scenes.

## Acceptance criteria
- [ ] With WebGL, the canvas appears with a fade-in and the page stays 100% usable; **without** WebGL (disable via browser flags) → `html.no-webgl`, CSS background visible, no errors.
- [ ] `three` does **not** appear in the initial bundle (verify with `next build` + bundle analyzer): only in the dynamic chunk.
- [ ] StrictMode: mount → unmount → mount does not create 2 canvases or leave rAF/listeners behind (check `renderer.info.memory` and `getEventListeners`).
- [ ] A hidden tab pauses rendering (check CPU/GPU in Activity Monitor or `performance.now` in the loop).
- [ ] Resizing keeps the aspect ratio and a correct `fov` in portrait.
- [ ] A forced failure in `createWorld` (throw an error) results in `no-webgl`, not a broken screen.
- [ ] With `NEXT_PUBLIC_DISABLE_WORLD=1` the engine chunk is **not** requested and the page stays in `no-webgl`.

## Technical notes
- Use `renderer.setPixelRatio(min(devicePixelRatio, tier.dpr))` (tier comes in T16; for now `min(dpr, 1.5)`).
- Handling `webglcontextlost` with `preventDefault()` and showing a fallback is desirable (the reference does not handle it) — optional.

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F11, F12, F16, F34 · `.claude/docs/ARCHITECTURE.md` §6, §11, §12.
