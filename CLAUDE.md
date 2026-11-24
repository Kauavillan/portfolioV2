# CLAUDE.md

Guide for Claude Code (and for anyone) working in this repository. Read it in full before touching code.

## What this project is

Personal portfolio of **Kauã Villa Nova**, bilingual (pt/en), built with **Next.js 16 (App Router)**.

The `v3` branch is being migrated from a classic 2D sections site to an **explorable 3D portfolio**: scrolling flies the camera through a three.js world, with a HUD, a cinematic intro, procedural audio and per-project "case files" — the same system as the reference site <https://2k-aakaash.vercel.app>.

> **Status (2026-11-24): Milestones M1 (T01–T14, the 2D shell), M2 (T15–T20, the 3D vertical slice), M3 (T21–T26, the full world) and M4 (T27–T29, intro and sound) are implemented.** The site is complete without 3D (it is also the `no-webgl` fallback); on top of it a lazy three.js world renders all six scenes — a plasma-star **home**, an iris-and-lens **about**, five procedural project **artifacts** along a dashed line (**work**), a **skills** constellation the chips light up, a **journey** helix with a comet and a contact **portal** — with the camera flying between them as you scroll. Project objects respond to hover and click/tap (they open the case file), and bloom is loaded on demand on the high tier only. A first visit opens with a **cinematic intro** (overlay → camera fly-in → the name rises letter by letter; skippable), and a bottom-right **sound control** turns on procedural, spatial audio (off by default; the audio graph is a lazy chunk fetched only when sound is first turned on). **Not started:** release work (M5). M1 was built with default content decisions and `TODO(content)` placeholders — see `.claude/docs/CONTENT.md` §7. The plan is in `.claude/docs/`.

## Documentation (read in whatever order you need)

| File | Purpose |
|---|---|
| [`.claude/docs/TASKS.md`](.claude/docs/TASKS.md) | **Backlog** (37 tasks, 5 milestones, dependencies, DoD). Start here |
| [`.claude/docs/tasks/T*.md`](.claude/docs/tasks/) | One task = one file (goal, scope, acceptance criteria, notes) |
| [`.claude/docs/REFERENCE-ANALYSIS.md`](.claude/docs/REFERENCE-ANALYSIS.md) | Functional spec of the reference: 37 features `F01`–`F37` with measured parameters |
| [`.claude/docs/ARCHITECTURE.md`](.claude/docs/ARCHITECTURE.md) | Target architecture in Next, contracts, ADRs, budgets, fallbacks |
| [`.claude/docs/GAP-ANALYSIS.md`](.claude/docs/GAP-ANALYSIS.md) | What exists vs. what is missing; lint/tsc baseline; pre-existing problems |
| [`.claude/docs/CONTENT.md`](.claude/docs/CONTENT.md) | Content that depends on the owner: pending decisions, checklists, data model |

## Stack

| | Today (after M1) | Target |
|---|---|---|
| Framework | Next 16.1.1 (lockfile), React 19.2 | same |
| i18n | `next-intl` 4 (`en` default, `pt`, `as-needed` prefix, `src/proxy.ts`) | same |
| Styling | ✅ SCSS Modules + CSS custom properties (`_tokens.scss`); Unbounded/Manrope/JetBrains Mono via `next/font/google` | same |
| Animation | ✅ `gsap` + ScrollTrigger (reveals). `motion`/`framer-motion` only in the unused `Motion.tsx` (T36) | same |
| Scroll | ✅ `lenis` driven by the GSAP ticker. `react-scroll` is installed but no longer imported (T36) | same |
| 3D / audio | ✅ `three@0.187.0`, imperative, lazy (`src/world`, 163 KB gzip in two chunks — three 63 + engine 100 — loaded after idle; bloom adds < 8 KB gzip in a few more chunks, high tier only); audio is plain WebAudio, procedural, no files: a small engine in the initial bundle + a 2.6 KB gzip graph chunk loaded on first enable | `three` (imperative, lazy) / plain WebAudio |
| State | `zustand`: `useUiStore` (menu, case, scroll locks) + legacy screen size (T36) | `zustand` (UI + scroll locks) |
| Contact | `react-hook-form` + `zod` → `/api/email` (nodemailer/SMTP), restyled | same, hardened (T32) |

## Commands

```bash
npm run dev          # next dev --turbopack  → http://localhost:3000 (pt at /pt)
npm run build        # production build
npm run lint         # eslint .
npm run typecheck    # tsc --noEmit
npm run check:i18n   # en/pt parity + data↔translations coverage; lists pending TODO(content)
```

**Kill switch:** build with `NEXT_PUBLIC_DISABLE_WORLD=1` to ship without 3D — the engine is not even emitted (the page behaves as `no-webgl`). Remove the variable to turn it back on.

**Baseline (green since T01, kept green through M1, 2026-11-23):** `npm ci`, `lint` (0 errors, 0 warnings), `typecheck`, `check:i18n` and `build` pass; `node_modules/next` matches the lockfile (16.1.1); `/en` and `/pt` are prerendered (`● SSG`).
There are still **no tests** or CI (T35). M1–M3 were verified in a real browser (headless Chrome over CDP) at 1440px and 390px, with reduced motion, without JS, without WebGL and in `next dev` (StrictMode) — those scripts are scratch tooling, not in the repo yet; T35 turns the useful ones into Playwright smoke tests. M3 specifically: hover/click/tap on all five projects, dead zones (text, controls, backdrop, drags), the ≈12/s raycast throttle, the skills bridge in en and pt, composer vs direct colour, resize and dispose with the composer alive, and a leak check (the old renderer holds 0 geometries/textures after each rebuild). M4 specifically (production build and `next dev`, real GPU): intro timings (first visit 3.45 s with a 3.4 s fly, return visit 1.9 s fly), skip by button/wheel/touch/key (≤ 4 ms, `finish` runs once), Tab/Shift not skipping, reduced motion / `#hash` / reload mid-page / no WebGL / a stalled engine chunk / scripts blocked (CSS failsafe at 7 s), `/pt`; audio: no `AudioContext` before enabling, fade-in ≈ 1.6 s, off < 0.3 s and suspended, listener following the camera, saved "on" waiting for a gesture, categories, hover throttle, open/close, blocked `localStorage`, no `AudioContext`, context closed on remount; sound control by keyboard, Esc / outside click, 390 px, reduced-motion bars.

## Structure

Today: `src/app/[locale]/{layout,page}.tsx`, `src/app/api/email/route.ts`, `src/components/{shell,sections,case,items,sound}` (`sound/SoundControl`), `src/controllers` (`ScrollProvider`, `AnchorController`, `RevealController`, `Intro`, `SoundProvider`, `WorldCanvas`), `src/data` (typed content: projects, skills, milestones, world, profile), `src/lib` (`contract.ts` and pure logic: `active-section`, `section-tracker`, `motion`, `pre-hydration`, `intro`, `storage`), `src/stores` (`useUiStore`), `src/hooks`, `src/providers`, `src/i18n`, `src/styles` (`_tokens`, `_mixins`, `_base`, `_world`, `_lenis`, `_reveal` + `*.module.scss`), `src/utils`, `src/validations`, `scripts/check-i18n.mjs`. `src/world` is the three.js engine (`index.ts` = `createWorld`, `quality.ts` and `rig-math.ts` are pure, `environment.ts`, `rig.ts`, `picking.ts`, `post.ts`, `scenes/{core,aperture,work,skills,journey,beacon}.ts`, `scenes/artifacts/` (one file per `ArtifactKind` + the registry), `shaders/`, `util/`); `src/controllers/WorldCanvas.tsx` mounts it, `skill-bridge.ts` wires the skill chips to the stars and `case-actions.ts` opens case files (buttons, deep link and 3D picking share it). `src/controllers/world-bridge.ts` parks the live world handle for the intro. `src/audio` is the sound engine: `engine.ts` (state, prefs, `AudioContext` lifecycle; initial bundle), `graph.ts` (ambience, emitters, reverb, UI sounds; lazy chunk), `pure.ts` / `material.ts` / `prefs.ts` (pure, no `AudioContext`: throttle, levels, tuning, generated buffers, listener math, prefs merge).
Target (details in `ARCHITECTURE.md` §2): nothing structural is left — the rest is M5 (release).
Deviations from the plan are recorded in `ARCHITECTURE.md` §13.

Aliases (`tsconfig.json`): `@/*`, `@styles/*`, `@components/*`, `@hooks/*`, `@stores/*`, `@providers/*`, `@utils/*`, `@assets/*`, `@public/*`, `@world` + `@world/*`, `@audio/*`, `@data/*`, `@controllers/*`, `@lib/*`. ESLint forbids importing `three` outside `src/world/**`.

## Architecture in 30 seconds

- **Content is real HTML** (Server Components, indexable). The 3D world is progressive decoration behind it (`pointer-events:none`, `aria-hidden`).
- **Client controllers** (`ScrollProvider`, `RevealController`, `Intro`, `WorldCanvas`, `SoundProvider`, `CaseDialogs`) bind to the DOM through **`data-*`** attributes defined in `src/lib/contract.ts` — never invent an attribute outside that file.
- The **world engine** (`src/world`) is only imported through `import("@world")` inside a client component effect, after `requestIdleCallback`. It exposes `createWorld(opts) → handle` and talks to the UI through **callbacks** (`onPick/onHover/onFrame/onStation`).
- The camera is driven by scroll between **stations** (`[data-station]`); each station has `position/target/offset/mood`.
- Adaptive quality (low/medium/high tiers), sliced boot and the `no-webgl` fallback are part of the design, not a later optimization.

## Project rules

1. **Clean-room.** The reference is a third party's minified build and its linked repository is GPL-3.0. **Do not copy code, shaders, text, names, images or data** from it. Implement from the behavior described in `REFERENCE-ANALYSIS.md`, with your own content and identity.
2. **Secrets.** `.env.local` contains SMTP credentials. **Never** read/print its contents, never commit it (`.env*` is in `.gitignore`). Only the variable *names* matter: `EMAIL_ADDRESS_RECEIVER`, `EMAIL_ADDRESS_SENDER`, `SMTP_HOST`, `SMTP_PORT`, `GMAIL_APP_PASSWORD` (`RESEND_API_KEY` exists but is not used).
3. **i18n.** Every visible string goes into `src/i18n/locales/en.json` **and** `pt.json` with the same keys (including HUD, intro, sound, case files). Rich text: `src/utils/richTextTranslationHandler.tsx`. Non-translatable data lives in `src/data/*`.
4. **Reduced-motion and no-WebGL are first-class paths.** Every new feature needs defined behavior for `prefers-reduced-motion`, for `html.no-webgl` and for a `coarse` pointer. Test all three.
5. **Mandatory cleanup.** In dev, React StrictMode runs effects twice. Every resource (Lenis, ScrollTrigger, renderer, geometries/materials/textures, `AudioContext`, listeners, `requestAnimationFrame`) needs idempotent cleanup. GSAP: `gsap.context()`/`ctx.revert()`. three: `dispose()`. Template in `ARCHITECTURE.md` §11.
6. **Client only.** `three`, GSAP, Lenis and WebAudio never go into Server Components or the initial bundle. `next/dynamic({ssr:false})` does not work in a Server Component — use `import()` in an effect.
7. **Styling.** SCSS Modules per component; colors, timings and radii come from tokens (CSS custom properties) — no magic values. Single layout breakpoint: **900 px**. Use `100svh` and `env(safe-area-inset-*)`.
8. **Accessibility.** Targets ≥ 48 px (40 px on secondary buttons), `:focus-visible` always visible, native `<dialog>` for modals, focus returned on close, `aria-*` on menu/sound state, text with enough contrast over the scene.
9. **Performance.** Respect the budgets in `ARCHITECTURE.md` §9. No heavy work outside the sliced boot; no `three` in the initial bundle; images via `next/image`.
10. **No analytics/tracking** without an explicit decision from the owner.
11. **Next 16.** The next-intl middleware lives in `src/proxy.ts`. The official documentation for the installed version is at `node_modules/next/dist/docs/01-app` — consult it before using an API you don't know well.
12. **Scope.** Do not refactor what the task does not ask for. Do not add a dependency outside the list in `GAP-ANALYSIS.md` §3 without justifying it in the task.

## Workflow

1. Open `.claude/docs/TASKS.md`, pick the next task whose dependencies are all `[x]`, and read its file and the docs it cites.
2. Branch from `v3`: `feat/T07-hud-nav` (or `fix/…`, `chore/…`, `docs/…`).
3. Implement only the task's scope; check each **acceptance criterion**.
4. Run the verification (below). Validate visually in the browser at **1440 px** and **390 px**, with `prefers-reduced-motion` on and with WebGL disabled (once there is a world).
5. Mark the task in `.claude/docs/TASKS.md` (`[x]`) and update the docs if something changed (mainly `REFERENCE-ANALYSIS`/`ARCHITECTURE` if you deviated from the plan — record why).
6. **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`). Commit/push/PR **only when the user asks**.

### Definition of Done

- [ ] `npm run lint` and `npx tsc --noEmit` pass with no errors; `npm run build` passes
- [ ] Task acceptance criteria met
- [ ] pt and en complete; no hard-coded strings in the component
- [ ] Verified at 1440 px and 390 px; reduced-motion; no-WebGL (if applicable); no console errors
- [ ] Cleanup verified (mount/unmount without leaking listeners/GPU/audio)
- [ ] New pure logic has a test (from T35 on the runner exists; before that, keep the function pure and exported)
- [ ] Docs updated if there was a deviation from the plan

### Code conventions

- All code, comments, identifiers, commit messages, PR text and project documentation are written in **English**, even when the conversation with the user happens in Portuguese. Only the site copy is bilingual (en/pt, via next-intl).
- Project documentation lives under `.claude/docs/` (not a top-level `docs/` folder). `CLAUDE.md` and `README.md` stay at the repo root.
- Strict TypeScript; no `any` without justification. Section components are **server** components by default; only add `"use client"` when you need state/effects/DOM.
- Content not yet written: use the `TODO(content)` marker (e.g. `// TODO(content): QRypt case file`) and list it in the task.
- One component per file, styles in `src/styles/<Name>.module.scss` (the repo's current convention).

## Known pitfalls

- **Legacy still in the tree (all removed in T36):** `components/items/Motion.tsx` (imports `framer-motion`, which is only an implicit dependency of `motion`), `hooks/{useResponsiveMotion,useScreenSize,useTypingEffect}`, `providers/ScreenSizeProvider` (still mounted, nothing reads it), `stores/useScreenSizeStore`, the `swiper`/`react-scroll`/`motion` packages, `styles/_variables.scss` + the orphaned `Home.module.scss`, `types/global.d.ts` swiper declarations, unused `public/icons` and images.
- **Verifying the 3D here:** on the owner's Mac headless Chrome also runs on the real GPU with `--use-angle=metal --disable-gpu-sandbox` (boot ≈ 0.3 s, real frame rates, realistic intro timings) — use that for timings and swiftshader for the software-GL path. Software GL needs `--use-angle=swiftshader --enable-unsafe-swiftshader`; software GL renders at ~1–3 fps, so frame-rate claims (60 fps) cannot be checked in it and shader-heavy boot stages (PMREM bake ≈ 2–3 s) look far worse than on a GPU. It also emits a `GPU stall due to ReadPixels` console warning that a clear-only WebGL page reproduces — it is not an app bug. Wait on *rendered frames* / polled state, never fixed sleeps. `world:*` `performance.measure` entries list the boot stages.
- **Never toggle the visibility of something that owns a light** (aperture's three lights, the journey's comet): the light count is part of every lit material's shader program, so it recompiles them all. That is why far scenes *scale* to nothing (`Region.fade`) and are only *hidden* — after the compile stage, so nothing compiles lazily — when they own no light. Fogged far objects otherwise show up as dark silhouettes stacked in front of the scene you are looking at.
- Shader programs depend on the render target: the composer's variants are compiled when it loads (`post.ts`). A tier step-down also recompiles the fbm users (the `OCTAVES` define) — a few programs, once.
- In headless Chrome with reduced motion, wait for the canvas to be fully opaque before comparing screenshots: after a station cut it fades back in over 1.4 s, and a shot taken mid-fade shows the CSS fallback background.
- The camera smoothing caps `dt` at 0.05 s, so at very low fps the camera and the iris take many real seconds to settle: by design.
- `html.is-intro` is added before hydration **only on a fresh visit** (navigation type `navigate`/`prerender`, no hash, at the top, motion allowed) and is removed by `controllers/Intro.tsx` on every path (finish, skip, error, watchdog, unmount). The script forces `scrollRestoration = "manual"` for the intro and `Intro` puts it back to `auto` — leave that pair alone, or a reload mid-page replays the intro and jumps to the top. The intro's `data-hero-ch` / `data-hero-item` elements have no CSS hidden state: only `gsap.set` hides them, behind the opaque overlay.
- **Sound:** nothing audible and no `AudioContext` exists until a visitor turns sound on; a saved "on" waits for the first pointer/key gesture (or starts at once if the document already had user activation, e.g. after a language switch). Keep the `AudioContext` creation synchronous inside that gesture (Safari) and keep `graph.ts` the only importer of node-building code, or the engine leaks into the initial bundle (rule 6).
- `TODO(content)` strings are **hidden in production and shown in `next dev`** (`src/utils/content.ts`). If something is "missing" on the live site, check `npm run check:i18n` first.
- Switching language: next-intl navigates to a prefixed URL and the proxy redirects `/en` → `/`, which drops the `#hash`; `LanguageSelector` restores it (see T07 notes). Don't "simplify" that away.
- `app/api/email/route.ts` interpolates `message`/`contactBackEmail` into the email HTML **without escaping**. Do not replicate this pattern; T32 fixes it.
