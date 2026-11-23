# T02 — Dependencies, aliases and folder structure

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 0 · M1 | S | T01 | infrastructure (all features) |

## Goal
Install what the new system needs and create the folder/alias skeleton, without changing any screen.

## Scope
- **Install:** `three`, `@types/three` (dev), `gsap`, `lenis`. (`@gsap/react` is optional: only add it if you will use `useGSAP`; otherwise `gsap.context()` is enough.)
- **Pin the `three` version** (no `^`, e.g. `0.187.0` or whatever is current) — the engine is version-sensitive (the reference uses r186).
- **Aliases** in `tsconfig.json`: `@world/*`, `@audio/*`, `@data/*`, `@controllers/*`, `@lib/*` (paths relative to `./src/...`).
- **Folders** (with `index.ts`/`.gitkeep` where it makes sense): `src/controllers`, `src/world`, `src/world/scenes`, `src/world/shaders`, `src/world/util`, `src/audio`, `src/data`, `src/lib`, `src/components/{shell,sections,case,sound}`.
- **`src/lib/contract.ts`**: constants for the `data-*` attributes and state classes listed in `ARCHITECTURE.md` §4 (e.g. `ATTR.station = "data-station"`, `STATE.noWebgl = "no-webgl"`), plus a `sel(attr)` helper → `[data-…]`.
- ESLint rule (`no-restricted-imports`) forbidding `three` outside `src/world/**` (and `gsap`/`lenis` in Server Components is checked in review).
- **Do not remove** `swiper`, `react-scroll`, `motion` yet (T36).

## Out of scope
Any scroll/world logic (T06, T15).

## Acceptance criteria
- [x] `npm run lint`, `npm run typecheck`, `npm run build` pass; the site renders **identically** to before.
- [x] `import x from "@world/…"` and the other aliases resolve in the editor and in the build.
- [x] `import * as THREE from "three"` in `src/components/…` fails lint; in `src/world/…` it passes.
- [x] `src/lib/contract.ts` exports every attribute from `ARCHITECTURE.md` §4.

## Technical notes
- Confirm with `npm ls` that a 2nd copy of `three` did not get in (some packages bring their own).
- In Next 16/Turbopack the aliases come from `tsconfig.json`; there is no need to configure `next.config.ts`.

## Reading
`.claude/docs/ARCHITECTURE.md` §2, §4 · `.claude/docs/GAP-ANALYSIS.md` §3.

## Implementation notes (done 2026-11-23)
- Installed `three@0.187.0` (**pinned**, no `^`) + `@types/three@0.187.0` (dev), `gsap`, `lenis`. `npm ls three` shows a single copy. `@gsap/react` was not needed (`gsap.context()` is enough).
- **Deviation — extra alias:** besides `@world/*` there is a bare `@world` (→ `src/world`), because ARCHITECTURE §2 mandates `import("@world")`.
- `src/lib/contract.ts` has every attribute of ARCHITECTURE §4 plus helpers: `attr()` (spreadable `data-*`), `sel()`, `SECTION_IDS`, `projectStation()`, `parseCaseHash()`. **Deviation:** three state classes were added that §4 did not list — `scroll-locked` (scroll lock that also works without Lenis), `reveal-ready` (switches the reveal CSS failsafe off) and `is-lit` (skill chip lit) — recorded in ARCHITECTURE §4.
- ESLint: `no-restricted-imports` forbids `three` / `three/*` everywhere except `src/world/**` (verified with probe files: fails in `src/components`, passes in `src/world`).
- `.gitkeep` files hold the still-empty folders (`audio`, `components/sound`, `world/{scenes,shaders,util}`).
