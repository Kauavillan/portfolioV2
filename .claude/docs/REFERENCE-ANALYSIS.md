# Reference project analysis

> Reference: <https://2k-aakaash.vercel.app> · Linked repository: <https://github.com/2k-Aakaash/2K-Aakaash>
> Collected on **2026-11-22**. This document is the "functional specification" of what we are going to build.
> Each feature has an ID (`F01`…`F37`) used for traceability in the tasks (`.claude/docs/tasks/`).

## 1. Sources and method

| Source | What was read |
|---|---|
| Published site (Vercel) | HTML (44 KB), CSS `_astro/Base.*.css` (29 KB), main JS `index.astro_astro_type_script_index_0_lang.*.js` (148 KB minified), world chunk `engine.*.js` (659 KB minified, with three.js embedded), `manifest.webmanifest`, `robots.txt`, `sitemap-index.xml` |
| GitHub repository | `README.md`, `index.html`, `index.js`, `base.css`, `styles.css`, `script.js`, `package.json`, `manifest.json`, file tree |

**Method:** static reading of the HTML and the minified bundles. The internal function names are obfuscated, so this document describes **behavior and parameters observed in the code**, not the original implementation.

**Limitations (be skeptical of these points):**
- I did not run the site in a browser: **there are no FPS, Lighthouse or memory measurements**. The performance targets in `ARCHITECTURE.md` are proposals, not numbers from the original.
- The *Lens*, *Journey* and *Beacon* scenes and the 5 artifact models were only partly read (main geometries and parameters). GLSL shaders were **not** reproduced here, on purpose (see §2).
- Behavior on real touch/mobile devices was not tested.

## 2. Key finding: the repository is NOT the published site

| | GitHub repository | Published site |
|---|---|---|
| Origin | Static **Webflow** export (Apr 2024), 1.3 MB `script.js` = Webflow IX2 runtime | **Astro + Vite** build (Oct 2026) |
| Experience | Classic dark landing page: hero, services, 2 projects, CTA, footer | **Explorable 3D world** ("Observatory") with HUD, intro, audio, case files |
| Libs | jQuery, Lenis (with options that don't exist in the API — ignored, runs with the defaults), Locomotive Scroll only as a dependency/`data-scroll` attributes (I found no initialization), Firebase Analytics | GSAP + ScrollTrigger, Lenis, three.js r186, WebAudio |
| Analytics | Firebase Analytics | None |
| License | **GPL-3.0** | Source code not found in the linked repo |

**Consequences for our project:**
1. The **target is the published site**. The repo serves only as history (the site's own *Journey* section tells it: "First portfolio — Apr 2024" → "This observatory — Oct 2026").
2. Only the **minified build** of the published site exists. Therefore the implementation must be **clean-room**: reimplement from the behavior described here, writing our own code, shaders, geometries and text.
3. The linked repo is GPL-3.0 — one more reason not to copy anything from it.
4. What belongs to the author and **must not be copied**: text, sector names ("Observatory", "The Lens"…), project list, contact data, logos, images. See §7.

## 3. Target stack

| Layer | Observed technology | Our plan |
|---|---|---|
| Framework | Astro (static HTML + 1 script, no islands) | **Keep Next.js 16** (see ADR-01) |
| Build | Vite | Next/Turbopack |
| Smooth scroll | Lenis (`duration 1.25`, easeOutQuart, `smoothWheel`) | `lenis` |
| DOM animation | GSAP 3 + ScrollTrigger | `gsap` (replaces framer-motion) |
| 3D | three.js **r186** (+ `EffectComposer`, `RenderPass`, `UnrealBloomPass`, `OutputPass` on demand) | `three` + `@types/three` |
| Audio | Plain WebAudio, **zero audio files** | same |
| CSS | Plain CSS (29 KB), tokens in `:root` | SCSS Modules + tokens in CSS custom properties |
| Fonts | Unbounded (display), Manrope (body), JetBrains Mono (mono) — variable, self-hosted, latin subset inlined as data-URI, the rest via `unicode-range` | `next/font/google` (already used for Rajdhani) |
| Images | `<picture>` AVIF/WebP/PNG, `width/height`, `loading=lazy`, `decoding=async` | `next/image` |
| Hosting | Vercel | Vercel |

## 4. Observed architecture

```
Static HTML (all content in the DOM, indexable)
  ├─ <head>: meta/OG/JSON-LD ×2, inline "is-intro" script, CSS
  ├─ <script type=application/json id="world-data">  → projects, skillGroups, milestoneCount, images
  └─ index.*.js  (≈148 KB min.: GSAP + ScrollTrigger + Lenis + all the UI code)
        ├─ scroll   (Lenis ↔ GSAP ticker ↔ ScrollTrigger)
        ├─ nav / locator / anchors
        ├─ reveal   ([data-reveal])
        ├─ case dialogs (<dialog>)
        ├─ sound    (procedural WebAudio + panel)
        ├─ intro    (GSAP timeline)
        └─ world    → requestIdleCallback → import("engine.*.js")   ← heavy chunk, lazy
                         └─ createWorld({container, reduced, projects, skillGroups,
                              milestoneCount, images, onPick, onHover, onFrame, onStation})
                              → { camera, rig, quality, regions, emitters,
                                  lightSkill(key,on), refresh(), dispose() }
                         └─ EffectComposer/RenderPass/UnrealBloomPass/OutputPass (lazy, "high" tier only)
```

**Principles worth copying (architectural, not code):**
- Content is real, accessible HTML; the 3D is **progressive decoration** behind it (`pointer-events: none`, `aria-hidden`).
- The DOM is the source of truth for the **stations** (`[data-station]`) and the **sections** (`[data-section]`); the camera reads the layout from the DOM.
- The world exposes a minimal API and talks to the UI via **callbacks** (`onPick`, `onHover`, `onFrame`, `onStation`), not global state.
- Everything heavy loads **after** the content (idle) and **fails silently** (`no-webgl` class).

## 5. Feature inventory

### 5.1 Shell / HUD

| ID | Feature | Observed behavior and parameters |
|---|---|---|
| F01 | Skip link | `a.skip-link` → `#main`; stays off-screen (`translateY(-160%)`) and appears on `:focus` |
| F02 | Top HUD | Fixed `header.hud-top`: wordmark (logo + name, `aria-label` "back to top"), **Book a call** button (external link), **Menu** button (mobile only). `hud-fade` gradients (112 px) at the top and bottom ensure legibility |
| F03 | Nav rail | `nav#nav-rail` with 6 links (`data-nav`), fixed at the right/vertical center on desktop; `aria-current` on the active one. **<900 px**: becomes a full-screen overlay (14 px blur, `#05060bf0` background), opened by `html.nav-open`; `Menu`↔`Close` with `aria-expanded`; on open: stops scroll, focuses the 1st link; `Esc` closes and returns focus to the button |
| F04 | Locator | Bottom-left corner: `01 / 06 · <sector>` + progress bar (`scaleX = scrollY / (scrollHeight − innerHeight)`). Active section = the last one whose `top ≤ 45% of the viewport`. Hidden <900 px |
| F05 | Anchors | Click on `a[href^="#"]` → `preventDefault`, `scrollTo(2.2 s, offset 0)`, at the end `tabindex=-1` + `focus({preventScroll})`, `history.replaceState(#id)`. Closes the mobile menu first |
| F06 | Footer | Copyright + credit ("designed & built… world rendered live with three.js") |

### 5.2 Scroll and reveal

| ID | Feature | Observed behavior and parameters |
|---|---|---|
| F07 | Smooth scroll | Lenis `duration 1.25`, `easing 1−(1−t)^4`, `smoothWheel`; `lenis.on('scroll', ScrollTrigger.update)`; `gsap.ticker.add(t ⇒ lenis.raf(t·1000))`; `ticker.lagSmoothing(0)`. API: `to(el)`, `stop()`, `start()`, `onLayout(cb)`. **Disabled** with `prefers-reduced-motion` (uses `scrollIntoView`). Inner scrollable content uses `data-lenis-prevent` |
| F08 | Layout refresh | Signature `scrollHeight×innerWidth×innerHeight`; **200 ms** debounce; triggers: `document.fonts.ready`, `load`, `resize`, `ResizeObserver(body)`. Action: `ScrollTrigger.refresh()` + callbacks (rebuilds the camera anchors) |
| F09 | Scroll reveal | `[data-reveal]` grouped by `[data-reveal-scope]`. Initial: `opacity 0, y 28` (CSS `html.motion [data-reveal]` pre-hides to avoid a flash). ScrollTrigger `start: top 78%`, `end: bottom 22%`. `onEnter`: `opacity 1,y 0`, **1.1 s `expo.out`**, stagger **.07**; `onEnterBack`: stagger .05; `onLeave`: `opacity 0, y −24`, **.6 s `power2.in`**, stagger .03 (**except `#contact`**); `onLeaveBack`: returns to `y 28`. The `#home` section is left out (it is handled by the intro). No reveal in reduced-motion |

### 5.3 Intro

| ID | Feature | Observed behavior and parameters |
|---|---|---|
| F10 | Cinematic intro | Inline script in `<head>` adds `html.is-intro` **only if** motion is allowed, there is no `location.hash` and `scrollY < 40`; forces `history.scrollRestoration='manual'`. Overlay `z 90` with a mono line (`letter-spacing .6em → normal`, 1.4 s `expo.out`) and status "Loading the 3D world…" after 600 ms. Awaits `Promise.race([worldReady, timeout 4.5 s])`. Timeline: overlay fades out (`autoAlpha 0`, 1.1 s), **camera flies** (`rig.intro.value 0→1`, **3.4 s on the 1st visit / 1.9 s on subsequent ones**, `power3.inOut`), name letters rise (`yPercent 110→0`, 1.2 s `expo.out`, stagger .06), remaining hero items reveal. **Skip**: "Skip intro" button, `wheel`, `touchmove`, any key ≠ Tab. **CSS failsafe**: `intro-failsafe` animation hides the overlay at **7 s**. Scroll locked during the intro. Remembers the visit in `localStorage['…:intro-seen']`. At the end: focus goes to the `h1` if the skip button was focused |

### 5.4 3D world

| ID | Feature | Observed behavior and parameters |
|---|---|---|
| F11 | Canvas and background | Fixed `.world` (`z 0`, `pointer-events:none`), `canvas` with `aria-hidden`. Own CSS background (2 warm/cool radials + star dots) works as a fallback and as a placeholder. Canvas fades in over **1.4 s** when `is-ready`. `.scrim` (horizontal gradient on desktop, vertical on mobile) keeps the text legible. `.is-cut` hides the canvas in .35 s (used in reduced-motion, see F13) |
| F12 | Renderer and camera | `WebGLRenderer({antialias, powerPreference:'high-performance'})`; **ACESFilmic** tone mapping, exposure **1.05**, sRGB output. `PerspectiveCamera` fov **42** (**58** if aspect < 0.8), near .5, far 4000. Ambient light `#6c7aa8` int .35 + directional `#ffe2bf` int 1.2 at (40,60,30) |
| F13 | Station-based camera rig | Stations = `[data-station]` elements that exist in the world's station map. Each station's **scroll anchor** = the element's center (height capped at 1.2·vh) centered in the viewport, strictly increasing. `f` = progress between stations; **`blend = smootherstep(clamp((f−.18)/.64))`** ⇒ the camera **dwells** in the first/last 18% of each segment and **travels** in the central 64%. Position/target = `CatmullRomCurve3(centripetal)` through the stations' positions/targets, evaluated at `(index+blend)/(n−1)`. Exponential smoothing `1−exp(−dt·k)` with **k=4.2** (**14** during intro). **`filmOffset`** interpolates `offset` (desktop ≥900 px) ↔ `offsetNarrow` (mobile, 0) to push the scene to the right while the text stays on the left. **Pointer parallax** only with `pointer: fine`: with `x,y ∈ [−.5, .5]` (normalized, smoothed pointer), shifts the camera `x·2.4` / `y·1.5` units in the camera plane (max ≈ ±1.2 / ±.75). **Fly-in**: from pos (0,46,320) / target (0,10,−60) to the 1st station. **Reduced-motion**: no flight; jumps to the nearest station (`f<.5`) and signals a *cut* ⇒ `is-cut` (canvas fade) |
| F14 | Adaptive quality | Tiers: **low** `{dpr 1, stars 2600, dust 350, bloom off, octaves 2}` · **medium** `{dpr 1.5, stars 5200, dust 800, bloom off, octaves 3}` · **high** `{dpr 2, stars 8000, dust 1300, bloom on, octaves 4}`. Initial tier = **medium** if `hardwareConcurrency ≥ 4` **and not** (small viewport, i.e. < 600 px, **and** `deviceMemory < 4`) **and not** (`pointer: coarse` **and** `deviceMemory < 4`); otherwise **low**. Never starts at high. Sampler: after a **2.5 s** warm-up, a window of **60 frames** (ignores Δ>250 ms): average **>24 ms** ⇒ steps down a tier (and **never goes back up**); average **<11 ms** sustained for **>5 s** (with no prior downgrade) ⇒ steps up. A tier change clears the samples and reopens the warm-up. Disabled in reduced-motion. `applyQuality` adjusts the stars'/dust's `setDrawRange`, the sky shader's octaves (`defines.OCTAVES`) and the pixel ratio `min(devicePixelRatio, tier.dpr)` |
| F15 | Sliced boot | Starts in `requestIdleCallback(timeout 1200)`. Stages separated by `scheduler.yield()` (or `setTimeout 0`): renderer → environment → reflection bake → observatory → lens → artifacts → outer regions (skills, journey, contact) → rig → quality → `compileAsync` (if `KHR_parallel_shader_compile`) or `compile`. Each stage produces a `performance.measure('world:<stage>')` |
| F16 | Loop and lifecycle | `dt` capped at **.05**; **pauses** rendering when `document.visibilityState≠visible` and resets the clocks on return; in reduced-motion it renders **on demand** (scroll/pointer/resize/mood); `dispose()` walks the scene freeing geometries, materials and textures, removes listeners, discards the composer/renderer and removes the canvas. I did not observe any dedicated context-loss handling (three.js handles it internally) |
| F17 | Environment | Sky sphere radius **3000** that follows the camera (BackSide, `renderOrder −10`, no culling) with a nebula shader (fbm; **two tints** read from the station's *mood*; per-frame lerp **.02**, or **1** in reduced-motion). Stars (`Points`, fixed-seed PRNG ⇒ deterministic; count by tier via `drawRange`), dust (camera-relative `Points`), exp2 `Fog` `#05060b` density **.0058**. Environment reflections "baked" once (`scene.environment`) for the metals |
| F18 | Scene **home** | At the origin: sphere radius 4.2 with a plasma shader (time-based fbm, bands, fresnel, palette `#8c2908→#ffa852`) + additive glow sprite (scale 34); **3 tilted metal rings** (radii 8.2/10.6/13.4), each paired with a thin emissive ring `#ffcf96`; **96 instanced ticks** on the outer ring (every 8th highlighted) |
| F19 | Scene **about** | Torus casing (radius 12.6) + brass ring + thin cyan ring `#86d2ff`; **72 instanced ticks** (every 6th larger); **iris blades** (extruded shape) that **open** as the section becomes active (angle .95 → −.15, smoothing .04); central element with a `clearcoat` material (geometry loaded asynchronously); 3 point lights (warm/cyan/white); slow rotation. Station: pos = center+(6,2,64), `offset −10` |
| F20 | Scene **work** | 1 entry station (`work`) + **1 station per project**. Project *i* at `(48+sin(1.7i)·14, −6+cos(1.3i)·6, −300−80i)`; the station camera = center+(−6,3,52), target = center, `offset −9`. **Dashed line** (`LineDashedMaterial #ffb35c`, dash 1.2/gap 2.4, opacity .35) through a CatmullRom curve across the centers. **Registry of procedural artifacts** by type (`browser`, `cutout`, `p2p`, `globe`, `disk`); 2 of the 5 get an image texture. Hover: scale `1+.05·h` (lerp .12). Every mesh carries `userData.projectId` for picking. Each project has `mood:[colorA,colorB]` |
| F21 | Scene **skills** | Group hubs on an ellipse (22×13, z=sin(2θ)·8) around (6,34,−760); skills in a golden-angle spiral (radius 3+√(i+1)·2.1). `Points` with per-vertex attributes: size (hub 9 / `shipped` 6 / `stated` 3.6), color (hub `#a9d8ff`, stars `#ffd7a3`), **`aLit`** (hover: blends to `#ffbf66`, size ×(1+1.4·lit)); additive blending; time-based twinkle. Lines connect each group's chain. API `lightSkill(key, bool)` with key `group:skill` or `group`; the UI fires it on `pointerenter/leave` and `focus/blur` of the chip (`[data-skill]`) and on `pointerenter/leave` of the group (`[data-skill-group]`) |
| F22 | Scene **journey** | Helix (64 pts, 1.6 turns, radius 12, height 30) as a tube (radius .07, `#ffb35c`, opacity .55); **N nodes** (ring+sphere; the last one in cyan) distributed along the curve, with N = `milestoneCount`; a **"comet"** (sphere + point light) travels along the curve at .03/s (**.07** when the section is active); nodes grow up to ×1.6 near the comet and spin |
| F23 | Scene **contact** | At (0,0,−1010): large torus (radius 18) + emissive ring + **"portal" disc** with an additive shader (fbm swirl + rings; uniform `uOpen` opens on arrival) + 260 particles. (The rest was not inspected) |
| F24 | Picking | `Raycaster` on `pointermove` (only `pointer: fine`, **80 ms throttle**) → `html.world-hover` (cursor) + hover callback. A click on the window is ignored if the target is inside `a, button, input, label, dialog, p, h1, h2, h3, li, [data-no-pick]`; otherwise it raycasts and `onPick(projectId)` opens the case file |
| F25 | Bloom | **High tier only**, loaded on demand via `import()`: `RenderPass → UnrealBloomPass(res = ½ viewport, strength .55, radius .6, threshold .82) → OutputPass`; renders through the composer when the tier has bloom, otherwise `renderer.render` |

### 5.5 Audio (100% procedural, no assets)

| ID | Feature | Observed behavior and parameters |
|---|---|---|
| F26 | Engine | Graph: `master gain → DynamicsCompressor(threshold −18, ratio 3) → destination`. **Ambient bus**: drone = 3 oscillators (55 Hz sine −4¢, 82.41 Hz triangle +3¢, 110 Hz sine +6¢) → lowpass 380 Hz Q.6 (cutoff modulated by LFO .045 Hz, depth 160) → gain .085; "air" = looping white noise (2 s) → bandpass 520 Hz Q.8 (LFO .03 Hz, depth 260) → `StereoPanner` (LFO .02 Hz, ±.7) → gain .022. **Reverb**: `ConvolverNode` with a generated IR (stereo noise 3.2 s, decay `(1−t)³`) → wet gain **.32**. `AudioContext` created only on first use, `latencyHint:'playback'`. Turns on with a ramp to `volume·.9` over 1.6 s; turns off with a .12 s ramp and `suspend()` after 200 ms |
| F27 | Spatial emitters | 1 emitter per sector (home, about, work, skills, journey, contact): **HRTF** `PannerNode` (`inverse`, refDistance 24, rolloff 1.3, maxDistance 600) at the scene's emitter position; each emitter = a dyad of sine waves (home 220/329.63 Hz · about 261.63/392 · work 293.66/440 · skills 329.63/493.88 · journey 392/587.33 · contact 440/659.25), gain .05 with a slow LFO (.07–.12 Hz). **Listener** follows the camera every frame (`setTargetAtTime`, τ .05): position + forward + up |
| F28 | UI sounds | `arrive(station)`: 3-partial chord (×1, ×1.5, ×2.01) over a pentatonic note by index (523.25, 587.33, 659.25, 783.99, 880 Hz), attack .02 s, exponential decay up to 2.4 s, gain .11, spatialized at the station + reverb send. `open` (opening a case): 880 Hz → ×.6 in .18 s. `close`: 520 Hz, .16 s. `hover`: 1320 Hz, .09 s, gain .025, **450 ms throttle** |
| F29 | Panel and preferences | **Off by default.** Prefs in `localStorage['…:sound']` = `{enabled:false, volume:.6, ambient:true, interaction:true}`. If `enabled` on load, it **waits for the 1st `pointerdown`/`keydown`** (capture) to create/resume the context (autoplay policy). UI: button with animated bars + "on/off" state (`aria-pressed`, `data-on`), settings button (`aria-expanded`) opens a `role=group` panel with **Volume**, **Ambience**, **Interface sounds** and an output note ("Stereo, spatialised for headphones" or, if `maxChannelCount>2`, specific text). `Esc` and a click outside close it. Without `AudioContext` ⇒ button disabled, "Sound unavailable" |

### 5.6 Content

| ID | Feature | Observed behavior and parameters |
|---|---|---|
| F30 | Sections | **01 Home** (label + name in per-letter `span`s with `aria-label` on the `h1`, lead, 2 CTAs, "Open for new projects" status with a pulse, social links, scroll hint) · **02 About** (title, 3 paragraphs, 2 "services") · **03 Work** (header + 1 `article` per project: index `01 / 05`, name, type, lead, technology chips, actions *Open case file / Website / Source*) · **04 Skills** (7 groups of chips with `data-skill`, `data-evidence="shipped|stated"`, legend) · **05 Journey** (timeline of 9 milestones) · **06 Contact** (title, CTAs, contact list). Each `section` has `data-section`, `data-label`, `data-sector` (sector name in the locator) and `data-station` |
| F31 | Case files | One `<dialog data-case=id aria-labelledby>` per project. `showModal()`; resets `scrollTop`; **stops Lenis**; plays `open`. Close: `[data-case-close]` button, `Esc` (native) or a click on the backdrop (`e.target===dialog`); on close it restarts Lenis, plays `close`, **returns focus** to the element that opened it. **Deep link** `#case-<id>` opens on load (`requestAnimationFrame`). Also opened by clicking the 3D object (F24). Content: type, title, lead, media (`<picture>` AVIF/WebP/PNG; only 2 of 5 projects have an image), *problem* + *my role*, *key features* + *technical challenges*, *results*, *stack* (chips), actions (site/code/releases). `case-in` animation, 6 px backdrop blur |
| F32 | Archive | "Also in the archive" block: list of smaller projects, each with a link and a one-line description |

### 5.7 Cross-cutting quality

| ID | Feature | Observed behavior and parameters |
|---|---|---|
| F33 | Accessibility and reduced-motion | Skip link; `aria-label` on the sliced `h1`; `aria-current` on the nav; `aria-expanded` (menu, sounds); `aria-pressed` (sound); native `<dialog>` with `aria-labelledby`; canvas `aria-hidden`; managed focus after hash navigation; targets ≥ 48 px (40 px on `quiet` buttons); `:focus-visible` with a 2 px `--solar` outline, offset 3 px; `color-scheme: dark`. **`prefers-reduced-motion`**: no Lenis, no reveal, intro removed immediately, the world becomes on-demand *snapshots* with `is-cut`, CSS reduces transitions to .2 s and animations to .001 ms |
| F34 | No-WebGL fallback | `html.no-webgl` when there is no `webgl2`/`webgl` context **or** the engine import/boot fails (the canvas container is then removed). CSS background + content + HUD remain 100% functional; `.no-webgl .scrim {display:none}` |
| F35 | Responsive | Single **900 px** breakpoint. `--gutter: clamp(20px, 5vw, 72px)`; `100svh`; `env(safe-area-inset-*)` on the HUD. <900 px: nav becomes an overlay, **Book a call** and the locator disappear, the scroll hint disappears, the scrim becomes a stronger vertical gradient at the bottom, the camera uses `offsetNarrow` (0) and fov 58 in portrait |
| F36 | SEO/PWA/structured data | `title`, `description`, `canonical`, `theme-color #05060b`, `author`; Open Graph + Twitter `summary_large_image` with `og.jpg` 1200×630 (88 KB); `favicon.svg`, `apple-touch-icon` 256; `manifest.webmanifest` (`display standalone`, colors `#05060b`); `robots.txt` (allow all + sitemap); `sitemap-index.xml`; **JSON-LD** `Person` (`jobTitle`, `address`, `sameAs`, `knowsAbout`) and `ItemList` "Selected work" (one `CreativeWork` per project) |
| F37 | Fonts and images | Variable fonts, self-hosted; `font-display: swap`; latin subset inlined in the CSS, the rest via `unicode-range`. Images with `width/height`, `loading=lazy`, `decoding=async`, `sizes` |

## 6. Observed design tokens

| Token | Value | Usage |
|---|---|---|
| `--ink / --ink-2 / --ink-3` | `#05060b / #0a0c15 / #12151f` | backgrounds |
| `--star` | `#ece8de` | primary text (muted = `…a8`, faint = `…6b`, line = `…1f`) |
| `--solar` | `#ffb35c` | warm accent (primary CTA, labels, focus) |
| `--ion` | `#86d2ff` | cool accent |
| `--glass` | `#0a0c159e` | translucent surfaces |
| `--radius` | `18px` (buttons/chips: pill 999px; case: 24px) | |
| `--ease` | `cubic-bezier(.22, 1, .36, 1)` | UI transitions |
| `--gutter` | `clamp(20px, 5vw, 72px)` | |
| Typography | display *Unbounded* (weight 600–700, `letter-spacing −.035em`), body *Manrope*, mono *JetBrains Mono* (labels `.16em` uppercase) | |
| State classes on `<html>` | `lenis`, `motion`, `is-intro`, `nav-open`, `world-hover`, `no-webgl`; on `.world`: `is-ready`, `is-cut` | CSS↔JS contract |

## 7. What belongs to the author (do not copy) × what is mechanics (replicate)

| Replicate (mechanics) | Rewrite with own content/identity |
|---|---|
| HUD structure, intro, locator, nav rail, case files, sound panel | Text, tone, names of the sectors and of the world ("Observatory"…) |
| Station-based camera, adaptive quality, sliced boot | Project list, skills, journey milestones |
| Reveal, smooth scroll, fallbacks | Palette/typography (may start from the tokens, but pick your own) |
| Procedural audio graph | Contact data, social links, images, logos, OG image |

## 8. What our project has and the reference does NOT have (preserve)

- **i18n pt/en** (`next-intl`, `LanguageSelector`) — the reference is English-only. The whole HUD, the world (sector labels) and the case files must exist in both languages.
- **Contact form** that sends via SMTP (`/api/email`) — the reference only has `mailto:` and external scheduling.
- Professional projects with app stores (App Store / Play Store).

## 9. Open questions

See `.claude/docs/CONTENT.md` §1 (Pending decisions): visual theme, which 5 projects go into the world, the content of the case files and of the milestones.
