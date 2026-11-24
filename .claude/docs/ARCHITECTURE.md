# Target architecture

How to implement, in **Next.js 16**, the system described in `.claude/docs/REFERENCE-ANALYSIS.md` (IDs `F01`…`F37`).
Everything here is a **design proposal** (none of it exists in the code yet) — the tasks in `.claude/docs/tasks/` implement it.

## 1. Architecture decisions (ADR summary)

| ADR | Decision | Why | Discarded alternative |
|---|---|---|---|
| 01 | **Keep Next.js** (do not migrate to Astro as the reference does) | i18n (`next-intl`), the SMTP route, deploy and content are already in place; Next generates the same static HTML (`generateStaticParams` per locale) | Astro: would rewrite what already works |
| 02 | **Imperative three.js** with a thin React wrapper | The loop is entirely custom: scroll-driven camera, adaptive quality, on-demand rendering, sliced boot, explicit `dispose`. Large scenes do not benefit from React reconciliation | `@react-three/fiber`: more abstraction and bundle, less control over the loop |
| 03 | **GSAP** replaces framer-motion | Lenis + ScrollTrigger + ticker form a single clock; avoids two animation engines | keep `motion` alongside GSAP |
| 04 | **SCSS Modules + CSS custom properties** | Keeps the repo's convention; global tokens become CSS variables (readable by JS and swappable per theme) | Plain global CSS like the reference |
| 05 | **Content in Server Components + client "controllers" that attach via `data-*`** | Indexable HTML, less JS, and it is exactly the reference's contract. The contract lives in a single file (`src/lib/contract.ts`) | Everything in client components |
| 06 | **Native `<dialog>`** for case files | focus, `Esc`, backdrop and `aria-modal` for free | custom modal |
| 07 | **State shared between controllers in `zustand`** (already a dependency) with counted *scroll locks* | Replaces the reference's `window.__world`; testable | globals on `window` |
| 08 | **No analytics/tracking** | The new reference has none; changing that requires a decision from the owner | Firebase/GA |
| 09 | **Clean-room** | There is only a third-party minified build (and the linked repo is GPL-3.0) | copy/adapt code |

## 2. Target folder structure

```
src/
├─ app/
│  ├─ [locale]/
│  │  ├─ layout.tsx          # <html lang>, 3 fonts, slots, metadata, is-intro script
│  │  └─ page.tsx            # composes the sections (server)
│  ├─ api/email/route.ts     # kept (T32 hardens it)
│  ├─ manifest.ts · robots.ts · sitemap.ts · opengraph-image.*   (T30)
│  └─ favicon.ico / icon.svg
├─ components/
│  ├─ shell/        # SkipLink, Hud, NavRail, Locator, Footer           (server where possible)
│  ├─ sections/     # Hero, About, Work, Skills, Journey, Contact        (server)
│  ├─ case/         # CaseDialog(s)                                      (client)
│  ├─ sound/        # SoundControl                                       (client)
│  └─ items/        # atoms: Button, Input, EmailForm, LanguageSelector…
├─ controllers/     # client "no UI": ScrollProvider, RevealController, IntroController, WorldCanvas
├─ world/           # three.js ENGINE — client only, ALWAYS via dynamic import()
│  ├─ index.ts      # export createWorld (single public entry point)
│  ├─ types.ts
│  ├─ quality.ts    # tiers + sampler (pure → testable)
│  ├─ environment.ts# sky, stars, dust, fog, reflections, mood
│  ├─ rig-math.ts   # anchors, progress, smootherstep, offsets (pure → testable)
│  ├─ rig.ts        # camera by stations (uses rig-math + THREE)
│  ├─ picking.ts · post.ts
│  ├─ scenes/       # observatory.ts · lens.ts · work.ts · skills.ts · journey.ts · beacon.ts · artifacts/*.ts
│  ├─ shaders/      # custom GLSL (.ts strings)
│  └─ util/         # dispose.ts · rng.ts (seeded PRNG)
├─ audio/           # WebAudio engine — client; prefs.ts, graph.ts, emitters.ts, notes.ts, engine.ts
├─ data/            # typed NON-translatable data: projects.ts, skills.ts, world.ts (moods, artifacts)
├─ lib/contract.ts  # names of the data attributes and state classes (single source)
├─ i18n/ · hooks/ · stores/ · providers/ · styles/ · utils/ · validations/ · types/
```

New aliases in `tsconfig.json` (T02): `@world/*`, `@audio/*`, `@data/*`, `@controllers/*`, `@lib/*`.
**Import rule:** no file outside `src/world/` may import `three` at the top level; the only bridge is `import("@world")` inside a client component.

## 3. Mount tree (layout)

```
<html lang={locale} class="{fonts}">             ← <inline script> adds html.is-intro (T05)
 <body>
  <NextIntlClientProvider>
   <ScrollProvider>              Lenis + ScrollTrigger + layout refresh           (T06)
    <SoundProvider>              audio engine + prefs                             (T28)
     <SkipLink/>                                                                  (T05)
     <WorldCanvas/>              div[data-world] + .scrim; lazy world import()    (T15)
     <Intro/>                    overlay + timeline                               (T27)
     <Hud/> <NavRail/> <Locator/> <SoundControl/>                                 (T07,T08,T29)
     <main id="main">  Hero · About · Work · Skills · Journey · Contact  (server) (T10–T13)
     <Footer/>
     <CaseDialogs/>                                                               (T14)
     <RevealController/>                                                          (T09)
```

Runtime dependency order: `ScrollProvider` first (everything uses `to/stop/start`); `SoundProvider` before the world (the world calls `onFrame/onHover/onStation`); the world is the last to become ready and the intro waits for it (with a 4.5 s timeout).

## 4. `data-*` contract and state classes

Centralized in `src/lib/contract.ts` (constants) to avoid drift between the markup and the controllers.

| Attribute | Where | Meaning | Read by |
|---|---|---|---|
| `data-section` + `data-label` + `data-sector` | `<section>` | navigable section; short label; sector name in the locator | T07/T08 |
| `data-station="home\|about\|work\|project:<id>\|skills\|journey\|contact"` | `<section>`/`<article>` | ties the element to a world station | T18 |
| `data-reveal` / `data-reveal-scope` | any / container | item revealed on scroll / groups into 1 ScrollTrigger | T09 |
| `data-hero-ch` | letter `<span>` | letter animated by the intro | T27 |
| `data-nav` · `data-menu-toggle` | `<a>` · `<button>` | menu links and button | T07 |
| `data-open-case="<id>"` · `data-case="<id>"` · `data-case-close` | button · `<dialog>` · button | case files | T14 |
| `data-skill="<group>:<name>"` · `data-evidence="shipped\|stated"` · `data-skill-group="<group>"` | chip · chip · container | hover lights up the 3D star | T12/T22 |
| `data-world` | `<div>` | canvas container | T15 |
| `data-intro` · `data-intro-line` · `data-intro-status` · `data-intro-skip` | overlay | intro | T27 |
| `data-sound*` | panel | audio controls | T29 |
| `data-lenis-prevent` | inner scrollable area | Lenis does not capture the scroll | T06/T14 |
| `data-no-pick` | any | 3D picking ignores clicks here | T25 |

State classes on `<html>`: `lenis`, `motion`, `is-intro`, `nav-open`, `world-hover`, `no-webgl`, plus (added in M1) `scroll-locked` and `reveal-ready`. On a skill chip: `is-lit`. On `.world`: `is-ready`, `is-cut`.
**Progressive enhancement:** `motion`, `is-intro` and `lenis` are added **by JS**; without JS the content stays visible. `motion` and `is-intro` come from the pre-hydration inline script (so the first paint is already correct); `lenis` from Lenis; `scroll-locked` and `reveal-ready` from `ScrollProvider` / `RevealController`.

## 5. Shared state (`zustand`)

```ts
// src/stores/useUiStore.ts  (T06/T07)
interface UiState {
  introActive: boolean;
  navOpen: boolean;
  caseOpen: string | null;     // id of the open case
  worldStatus: 'idle' | 'loading' | 'ready' | 'unavailable';
  scrollLocks: number;         // counter: intro + menu + dialog can lock at the same time
  lockScroll(): void; unlockScroll(): void;
}
```

`ScrollProvider` calls `lenis.stop()` when `scrollLocks > 0` and `start()` when it returns to 0 — that way the intro, the mobile menu and the dialog don't "fight" (in the reference each one calls `stop/start` directly).

## 6. World engine (`src/world`)

### 6.1 Contracts

```ts
export interface WorldOptions {
  container: HTMLElement;
  reduced: boolean;
  projects: { id: string; artifact: ArtifactKind; mood: [string, string]; image?: string }[];
  skillGroups: { id: string; skills: { name: string; evidence: 'shipped' | 'stated' }[] }[];
  milestoneCount: number;
  onPick(projectId: string): void;
  onHover(projectId: string): void;
  onFrame(camera: PerspectiveCamera): void;                       // audio listener
  onStation(e: { index: number; key: string; station: Station }): void;
}

export interface WorldHandle {
  rig: { intro: { value: number }; focus: { index: number; blend: number } };
  quality: 'low' | 'medium' | 'high';
  emitters: { key: SectorKey; position: Vector3 }[];              // positions for spatial audio
  lightSkill(key: string, on: boolean): void;
  refresh(): void;                                                // rebuilds the rig anchors
  dispose(): void;
}
export function createWorld(o: WorldOptions): Promise<WorldHandle>;

// each scene is a "region"
export interface Region {
  group: Object3D;
  stations: Record<string, Station>;     // key = data-station value
  emitter: Vector3;
  update(t: number, active: boolean): void;
  setPixelRatio?(r: number): void;
  dispose(): void;
}
export interface Station { position: Vector3; target: Vector3; offset: number; offsetNarrow: number; mood: [string, string] }
```

### 6.2 Boot (F15) and loop (F16)

`createWorld` runs in steps, yielding the thread between them (`scheduler.yield?.() ?? setTimeout(0)`) and measuring each one with `performance.measure('world:<step>')`:

`renderer → environment → reflection bake → observatory → lens → artifacts → skills/journey/contact → rig → quality → compile`

Loop: `dt = min(.05, Δt)`; it does not render while the tab is hidden; in reduced-motion it only renders when "dirty". On every frame: `rig.update(dt, scrollY, pointer)` → `onFrame(camera)` → detects a station change (`onStation`) → updates `mood` → `region.update(t, active)` → `composer.render()` (tier high) or `renderer.render()`.

### 6.3 Scroll → camera mapping (F13) — our own specification

1. **Anchors:** for each `[data-station]` with a known station, `anchor = topAbs + min(height, 1.2·vh)/2 − vh/2`, forcing monotonicity (`anchor[i] ≥ anchor[i−1]+1`). Recompute in `refresh()`.
2. **Progress:** given `scrollY`, find `i` with `anchor[i] ≤ scrollY < anchor[i+1]` and `f = (scrollY−anchor[i])/(anchor[i+1]−anchor[i])`.
3. **Dwell vs. travel:** `blend = smootherstep(clamp((f − 0.18)/0.64, 0, 1))`.
4. **Position:** `u = (i + blend)/(n−1)`; `pos = splinePos(u)`, `look = splineTarget(u)` (*centripetal* CatmullRom through the station points).
5. **Smoothing:** `cam += (target − cam)·(1 − exp(−dt·k))`, `k = 4.2` (14 during the fly-in).
6. **Lateral offset:** `filmOffset = lerp(offset(i), offset(i+1), blend)`; use `offsetNarrow` (0) below 900 px.
7. **Parallax** (`pointer: fine` only): with `x,y ∈ [−.5, .5]` (normalized and smoothed pointer), shift the camera in the plane `(right·x·2.4, up·−y·1.5)` and re-aim (max. ≈ ±1.2 / ±.75 units).
8. **Intro:** `intro.value ∈ [0,1]` blends the computed pose with the initial pose `(from, fromTarget)`.
9. **Reduced-motion:** no interpolation — snap to the nearest station and signal *cut* (canvas fade).

`rig-math.ts` implements 1–3 and 6 as **pure functions** (tested in T35); `rig.ts` applies 4–5 and 7–9 with THREE.

### 6.4 Adaptive quality (F14)

`quality.ts` (pure): `TIERS`, `initialTier(env)`, `createSampler()` with `sample(dtMs, now)` → `{ change: -1 | 0 | +1 }`. The constants (2.5 s warm-up, window of 60, 24 ms/11 ms thresholds, 5 s of stability, "never goes back up after going down" rule) are in `REFERENCE-ANALYSIS.md` F14. The world applies the tier (`applyQuality`: `drawRange` of stars/dust, sky octaves, `setPixelRatio`, bloom).

### 6.5 GPU hygiene

Every scene implements `dispose()`; `util/dispose.ts` walks `scene.traverse` and releases `geometry`, `material` (+ uniforms with textures) and `texture`. `createWorld().dispose()` also removes the listeners (`resize`, `pointermove`, `click`, `visibilitychange`), cancels the `requestAnimationFrame` calls, discards the composer/renderer and removes the canvas.

## 7. Audio (`src/audio`)

`engine.ts` exposes the API used by the UI/world: `state`, `subscribe`, `setEnabled`, `setVolume`, `setCategory('ambient'|'interaction', on)`, `setEmitters(list)`, `updateListener(camera)`, `arrive(target, index)`, `open()`, `close()`, `hover()`. Graph and constants in `REFERENCE-ANALYSIS.md` F26–F29. Rules:

- `AudioContext` is only created after a user gesture **and** `enabled`.
- Preferences in `localStorage` under the project's own key (e.g. `kvn:sound`), always inside `try/catch`.
- `suspend()` when turned off; **proposed improvement** (the reference doesn't do this): also suspend on `document.hidden`.
- No `AudioContext` ⇒ UI disabled, no error.

## 8. i18n

- New namespaces in `src/i18n/locales/{en,pt}.json`: `Meta`, `Hud`, `Sectors`, `Intro`, `Hero`, `About`, `Work`, `Skills`, `Journey`, `Contact`, `Footer`, `Sound`, `Case`.
- **Non-translatable** data (ids, links, technology chips, 3D artifact, moods, `evidence`) lives in `src/data/*` (typed TypeScript). Texts live in the messages, indexed by the project `id`: `Work.projects.<id>.{kind,lead}`, `Case.<id>.{problem,role,features,challenges,outcomes}` (arrays read with `t.raw`).
- The world **receives no text**: the HUD/locator labels come from the DOM (`data-label`/`data-sector`), so switching language does not require recreating the world.
- **Mandatory parity** between `en`/`pt` (T35 includes a test that compares the keys).
- `<html lang>` and `alternates.languages` (hreflang) per locale (T01, T30).

## 9. Budgets and targets (proposals — calibrate in T34)

| Metric | Target |
|---|---|
| Initial route JS (without the engine) | ≤ ~230 KB gzip |
| Engine chunk | loaded **only after idle**; composer/bloom only in tier high |
| LCP (mobile, simulated 4G) | ≤ 2.5 s — the 1st paint must be text (intro/hero line), never the canvas |
| CLS | ≤ 0.1 |
| Long tasks at boot | none > ~50 ms (hence the sliced boot) |
| FPS | ≥ 55 (desktop, tier medium/high) · ≥ 30 (tier low) |
| Memory | no growth after 10 mount/unmount cycles (`renderer.info.memory` returns to baseline) |
| Lighthouse mobile | with `no-webgl`: Perf ≥ 90, A11y/SEO/BP ≥ 95 · with the world: Perf ≥ 70 (lab) |

## 10. Fallback matrix

| Condition | Behavior |
|---|---|
| `prefers-reduced-motion` | no Lenis/reveal/intro; world in on-demand *snapshots* with fade (`is-cut`); CSS transitions .2 s |
| No WebGL or engine failure | `html.no-webgl`; CSS background + full content + HUD; spatial emitters unavailable (ambient sound still works) |
| Weak device | tier `low` (fewer stars, dpr 1, no bloom, octaves 2); moves up/down by FPS |
| Hidden tab | render paused; clocks reset on return |
| No `AudioContext` | sound button disabled ("Sound unavailable") |
| `coarse` pointer | no parallax or hover-picking; tapping the canvas still opens the case |
| No JS | content visible (the `motion`/`is-intro` classes were not applied); no interactive HUD beyond anchors |
| `NEXT_PUBLIC_DISABLE_WORLD=1` (kill switch, T15) | equivalent to `no-webgl` without downloading the engine — turns off 3D in production without reverting the deploy |

## 11. StrictMode-safe lifecycle pattern

Every external resource (Lenis, ScrollTrigger, renderer, AudioContext, listeners) follows this template — the effect may run twice in dev:

```ts
useEffect(() => {
  let disposed = false;
  let handle: WorldHandle | null = null;
  (async () => {
    const { createWorld } = await import("@world");
    const h = await createWorld(opts);
    if (disposed) { h.dispose(); return; }   // unmounted during the await
    handle = h;
  })();
  return () => { disposed = true; handle?.dispose(); };
}, []);
```

For GSAP, use `gsap.context()` (or `useGSAP`) and `ctx.revert()` in the cleanup.

## 12. Specific technical risks

| Risk | Mitigation |
|---|---|
| `next/dynamic({ ssr:false })` is not allowed in Server Components (Next 15+) | use a direct `import()` inside an effect of a client component |
| Hydration + attributes added by JS (`html.motion`) | add classes in `useEffect`/a controlled inline script; `suppressHydrationWarning` on `<html>` only if needed |
| Fonts loading late and shifting the layout | `document.fonts.ready` triggers the layout refresh (F08); `next/font` with `display: swap` |
| Safari/iOS: `100svh`, `AudioContext` and `dialog` | test on real Safari; `webkitAudioContext` fallback |
| `compileAsync` unavailable | fall back to synchronous `compile` |

## 13. Deviations recorded during M1 (T01–T14)

| Where | Plan | What was built | Why |
|---|---|---|---|
| §2 alias | `@world/*` | also bare `@world` | §2 requires `import("@world")` |
| §4 / T09 | controller adds `html.motion` | the pre-hydration script adds it (the controller keeps it in sync) | only way `[data-reveal]` is hidden from the first paint (no flash) |
| §4 | listed state classes | + `scroll-locked`, `reveal-ready`, `is-lit` | lock must work without Lenis (reduced motion); the reveal CSS failsafe needs a switch-off; chips need a lit state for T22 |
| §5 / T06 | `lenis` in the scroll API | `getLenis()` | reading a ref in the context value trips `react-hooks/refs` |
| §5 | `lockScroll`/`unlockScroll` | counter + actions (`setNavOpen`, `openCase`, `setIntroActive`) that change it once per open/close pair, synchronously | the menu must release its lock *before* the anchor scroll starts |
| T08 | hook returns `progress` | progress via `subscribeProgress` (no state) | avoids a re-render per scroll pixel |
| §3 | HUD/locator in the layout | mounted by `page.tsx` | there is a single page; the layout keeps only providers, skip link and the world slot |
| §3 | `SoundProvider` passthrough | omitted until T28 | nothing to pass through |
| T07 | locale switch via `router.replace` | + restore the `#hash` from `sessionStorage` afterwards | next-intl navigates to a prefixed URL and the proxy's `/en` → `/` redirect drops the hash |
| T11 | "article inside the Work section" | `#work` is the header block; the articles and the archive are its siblings | each article must be its own camera station, so `#work`'s centre can't be the middle of all of them |
| T14 | hash only for deep links | opening also writes `#case-<id>` | shareable URL; `replaceState`, no history entry |

### Added in M2 (T15–T20)

| Where | Plan | What was built | Why |
|---|---|---|---|
| §6.1 `Region.update` | `update(t, active)` | `update(t, active, dt)` | scenes ease with `1 − exp(−dt·k)`; frame-rate independent |
| §6.1 `WorldOptions` | callbacks only | + optional `signal: AbortSignal`, `onQuality` | `createWorld` stops between boot stages when the component unmounts mid-boot (StrictMode, locale switch); `onQuality` for debugging |
| §6.4 sampler | "ignores Δ > 250 ms" | isolated long frames are ignored, but **15 consecutive** long frames start to count (clamped to 250 ms); with the 60-frame average this means ≈ 17 consecutive frames (≈ 4.5 s of continuous < 4 fps) trigger a step down | a device that never beats ~4 fps would leave the sampler blind (every frame "ignored") and it would never downgrade. 15 (not fewer) keeps a one-off GC / shader-compile hitch from causing a permanent downgrade. Unit-tested on both sides (14 ignored, 16 tolerated, 17 steps down) |
| T15 failure path | "removes the container" | removes the **canvas** and keeps the `[data-world]` container | the container carries the CSS fallback background; removing it would leave a blank page |
| T15 | temporary test cube | none | the real scenes (T19/T20) validate render and dispose; a throw-away cube would only have been deleted minutes later |
| T15 | — | `webglcontextlost` / `webglcontextrestored` handled (loop stops + `no-webgl`, then resumes) | verified with `WEBGL_lose_context`; cheap and avoids a frozen canvas |
| §6.2 boot | `renderer → environment → …` | the first `setSize` is **inside** the `renderer` stage | allocating the drawing buffer is the costly part of context creation; leaving it between stages hid ~2 s of work |
| T17 | stars fixed in the world | stars and sky follow the camera (skybox); dust wraps around it on the GPU | the world spans hundreds of units of travel; fixed stars would drift past, and CPU-side wrapping would cost per frame |
| T17 | fog `--ink` | read from the CSS token at runtime (`readCssColor`) | the canvas clear color must equal the page color or the fade-in "jumps" |
| T19 | glow from a canvas | glow texture generated in JS (`DataTexture`) | no 2D canvas / image asset; deterministic |
| §6.3 layout | home at origin | home at the origin; about at `(80, −2, −118)` | the straight home→about path must not fly through the star; also keeps the lens out of the home frame on desktop and mobile |
| T18 offsets | `offset` ≈ −10 | `offset: −6` for both stations (`offsetNarrow: 0`) | −10 pushed the scene under the nav rail; −6 centres it in the free area between the text column and the rail |
| T15 | `scene.environment` etc. | `src/world/**` imports `SECTOR_MOODS` from `@data/world` | sector moods are static, non-text design data; no need to thread them through `WorldOptions` |
| Footer | credit after T15 | `Footer.world` ("rendered live with three.js") is hidden when `html.no-webgl` | the credit must only be true while the world is rendered |

**Measured at the end of M2 (production build):** initial route JS **324 KB gzip** (10 scripts; the engine is *not* among them) against the §9 budget of ≈ 230 KB; the lazy engine chunk is **146 KB gzip** (589 KB raw). The overage is the M1 baseline — React/Next runtime, GSAP + ScrollTrigger, Lenis, zod + react-hook-form (contact form), next-intl; the only M2 client code is `WorldCanvas`, inside a 2.7 KB-gzip chunk shared with the case dialogs. It is a T34 item (e.g. load the contact form's zod/react-hook-form on demand), not an M2 regression.

### Added in M3 (T21–T26)

| Where | Plan | What was built | Why |
|---|---|---|---|
| §6.1 `Region.update` | `update(t, active, dt)` | `update(t, active, dt, stationKey)` | the work region has one station per project: an artifact animates fully only while *its* station is in focus, and `active` alone cannot say which |
| §6.1 `Region` | — | + optional `fade`, `setViewport`; `WorkRegion` (`pickables`, `setHover`, `projectEmitters`) and `SkillsRegion` (`light`) extend it | scenes that need more than the base contract keep it out of every other scene |
| §6.1 `WorldHandle` | `emitters` per sector | + `projectEmitters` (one source per project) | T21 asks for one emitter per project (T28 will use them) |
| T21 far scenes | — | `Region.fade {near, far, cull?}` scales a whole region by its camera distance (work artifacts do it per artifact: full within 70, gone beyond 135; skills/journey/contact: 100 → 150) | fogged objects fade to `--ink`, which is darker than the nebula behind them: every later scene showed up as dark silhouettes stacked in front of the one in focus (home showed all five artifacts, the journey helix had the contact torus behind it) |
| T21 / T23 culling | — | a faded region is also *hidden* — but only after the compile stage, and never when it owns a light (journey) | `compile` only prepares what is visible (hidden at boot ⇒ 19 shaders compiled lazily during the first tour), and a light's visibility changes every lit material's program. Measured: 41 → 75 draw calls at home without culling |
| T21 stations | `offset −9`, camera `center+(−6,3,52)` | camera offset as planned, `offset −6` like M2; entry station `work` 80 units from the first artifact (not 130) | −6 keeps the object between the text and the nav rail; at 130 the first artifact was a speck |
| T21 textures | optional texture ≤ 1024 px | `loadProjectTexture` resolves `null` for anything larger; only `phone-pass` shows its image (magipass.png, 512 px) | the other screenshots are 1863–2926 px wide (T31 produces the optimized variants); the loader never blocks the boot and a late texture is disposed if the world is gone |
| T21 picking | `userData.projectId` on every mesh | + an invisible hit box/sphere per artifact | sparse artifacts (lattice, graph, wireframe globe) are otherwise hard to hit; the box follows the silhouette so the hover area is the object, not a circle around it |
| T21 cost | ≤ ~N draw calls | phone-pass 5 · qr-lattice 8 · tile-grid 2 · neural-graph 6 · module-globe 7 (28 for all five); 22–30 per frame at the work stations, 41 at home | instanced meshes for everything repetitive; the journey stays drawn (13 calls) because it owns a light |
| T22 point size | `uPixelRatio` scaling | world-unit size × the camera's own projection × `uViewportH` (the drawing-buffer height, from `Region.setViewport`) | stars keep their world size at any fov (the phone lens is wider) and any pixel ratio |
| T22 hover | `pointerenter` on chip **and** on group | over a chip only that star lights; over the group's own area (heading, gaps) the whole group lights; hover and focus on the same chip hold the star until both let go | entering a chip also enters its group, so the plan's wiring lit the whole group on every chip hover and "the right star" could not be told apart |
| T22 wiring | listeners on the chips | delegated on `document` (`controllers/skill-bridge.ts`); touch has no hover, a tap reaches the star through focus | the chips are replaced on a language switch; verified on `/pt` |
| T23 tube | 400 segments, fewer on low | 240 segments, built once | the geometry is built before the tier is known; 240 is indistinguishable on a 0.07-radius tube |
| T24 portal | `uOpen` 0→1 | + colour capped at 0.85 / alpha at 0.9 so bloom cannot blow out the form; opens at 2.1/s (95 % in ≈ 1.4 s) and closes the same way; the contact station is 82 units away (not 70) | the torus (radius 18) overlapped the form at 70 |
| T25 gating | raycast whenever the pointer is free | only while the camera is in the work corridor (active station ∈ work region) | objects seen through the fog from the home or skills station are not clickable, and a click never opens a case other than the article on screen |
| T25 events | ignore `a, button, input, label, dialog, p, h1–h3, li, [data-no-pick]` | + `textarea, select, h4`; keyboard clicks (`detail === 0`) ignored; a hover is re-resolved when the camera moves under a resting pointer; the pointer leaving the window clears it | a scroll can bring an object under a stationary pointer; a focused control's Enter must never pick |
| T25 opener | `openCase(id, opener?)` | `controllers/case-actions.ts` `openCaseFile` is shared by the buttons, the deep link and the 3D; a 3D pick uses that article's own "Open case file" button as the opener | focus returns somewhere sensible on close instead of `body`; one place writes the `#case-<id>` hash |
| T26 composer | `EffectComposer → RenderPass → UnrealBloomPass → OutputPass` | + 4× MSAA half-float target, + a last dither pass, `renderer.toneMapping` untouched; variants compiled on load; dropped (not kept) when the tier falls | the canvas' own antialiasing does not reach a render target; the `OutputPass` is the only place tone mapping and sRGB happen (a render target gets neither), so there is no double tone mapping; the sky's own ±½ LSB dither is applied *after* its sRGB encode in the direct path (`uDither`), which only works there — in the linear target it lifted dark values by ~15/255 — so the composer path dithers last, in display space |
| T26 colour | "no exposure jump" | direct vs composer (bloom off): mean |Δ| ≈ 2/255 over the sky; high → medium returns to the **identical** frame (Δ = 0) | ACES on the sky's dark values is the only residual difference |

**Measured at the end of M3 (production build, headless Chrome, software GL — frame rates cannot be judged there):** initial route JS **324.4 KB gzip** (10 scripts, unchanged from M2: the engine and bloom are not among them); lazy engine **163 KB gzip** (three 62.6 + engine 100.5, was 146); bloom is a handful of lazy chunks of 0.3–2.8 KB gzip (< 8 KB together; `next dev` also loads a 3.4 KB async-loader stub with the engine) and none of the production ones is requested on the low/medium tiers; boot stages: renderer 30–37 ms, `artifacts` 35–880 ms across runs (CPU-side geometry only, shaders compile in the `compile` stage; noisy on a loaded machine with software GL), longest stage is still the reflection bake (≈ 1.1–1.3 s on software GL); `renderer.info.memory` counts only what has been drawn, so it depends on the stations visited (56 geometries / 5 textures after a tour), but a freshly built world always reports the same numbers (40 / 4 after each of three rebuilds) and the renderer it replaced holds 0 / 0. Picking: 11.2 raycasts/s under continuous pointer movement.

