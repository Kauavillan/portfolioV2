# CLAUDE.md

Guide for Claude Code (and for anyone) working in this repository. Read it in full before touching code.

## What this project is

Personal portfolio of **Kauã Villa Nova**, bilingual (pt/en), built with **Next.js 16 (App Router)**.

The `v3` branch is being migrated from a classic 2D sections site to an **explorable 3D portfolio**: scrolling flies the camera through a three.js world, with a HUD, a cinematic intro, procedural audio and per-project "case files" — the same system as the reference site <https://2k-aakaash.vercel.app>.

> **Status (2026-11-22): migration planned, not started yet.** The code in `src/` is still the old site (hero with typing effect, skills Swiper, projects grid, contact form). The full plan is in `.claude/docs/`.

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

| | Today (v3 at the start) | Target |
|---|---|---|
| Framework | Next 16.1.1 (lockfile), React 19.2 | same |
| i18n | `next-intl` 4 (`en` default, `pt`, `as-needed` prefix, `src/proxy.ts`) | same |
| Styling | SCSS Modules + `_variables.scss`, Rajdhani font | SCSS Modules + CSS custom properties; Unbounded/Manrope/JetBrains Mono via `next/font/google` |
| Animation | `framer-motion` (via `motion`) | `gsap` + ScrollTrigger |
| Scroll | `react-scroll` | `lenis` |
| 3D / audio | — | `three` (imperative, lazy) / plain WebAudio |
| State | `zustand` (screen size) | `zustand` (UI + scroll locks) |
| Contact | `react-hook-form` + `zod` → `/api/email` (nodemailer/SMTP) | same, hardened (T32) |

## Commands

```bash
npm run dev          # next dev --turbopack  → http://localhost:3000 (pt at /pt)
npm run build        # production build
npm run lint         # eslint .
npx tsc --noEmit     # typecheck (a `typecheck` script will be added in T01)
```

**Known baseline (T01 fixes it):** `tsc` ✅ · `eslint` ❌ 2 `react-hooks/refs` errors in `EmailForm.tsx` + 1 warning · `node_modules/next` is at 16.2.10 but the lockfile says 16.1.1 (`npm ci` fixes it).
There are still **no tests** or CI (T35).

## Structure

Today: `src/app/[locale]/{layout,page}.tsx`, `src/app/api/email/route.ts`, `src/components/*` (+ `items/`), `src/hooks`, `src/stores`, `src/providers`, `src/i18n`, `src/styles/*.module.scss`, `src/utils`, `src/validations`.
Target (details in `ARCHITECTURE.md` §2): adds `src/controllers`, `src/world` (three.js engine), `src/audio`, `src/data`, `src/lib/contract.ts`; splits `components/{shell,sections,case,sound,items}`.

Aliases (`tsconfig.json`): `@/*`, `@styles/*`, `@components/*`, `@hooks/*`, `@stores/*`, `@providers/*`, `@utils/*`, `@assets/*`, `@public/*`. New in T02: `@world/*`, `@audio/*`, `@data/*`, `@controllers/*`, `@lib/*`.

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

- `framer-motion` is imported in `Hero.tsx`/`Motion.tsx`, but only `motion` is in `package.json`. It goes away in T36.
- `Header.tsx` has a hard-coded (untranslated) "contact" label and `Footer.tsx` nests a `<footer>` inside a `<footer>`. Both go away in tasks T07/T13.
- `app/api/email/route.ts` interpolates `message`/`contactBackEmail` into the email HTML **without escaping**. Do not replicate this pattern; T32 fixes it.
- `<html>` has no `lang` (T01).
