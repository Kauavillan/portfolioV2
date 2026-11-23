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

