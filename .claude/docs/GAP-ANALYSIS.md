# Gap analysis: current project vs. reference

Basis of comparison: state of the repository on `v3` (commit `a069c51`) vs. `.claude/docs/REFERENCE-ANALYSIS.md`.

## 1. Current state (summary)

- **Next.js 16** (App Router) + React 19 + **next-intl** (`en`/`pt`, `as-needed` prefix, middleware in `src/proxy.ts`).
- Classic 2D sections: `Hero` (typing effect), `About`, `Skills` (vertical Swiper of icons), `Projects` (card grid), `Contact` (buttons + `EmailForm` with react-hook-form/zod → `/api/email` via nodemailer), `Footer`.
- Style: SCSS Modules per component, `_variables.scss`, `#0a0a0a` background, Rajdhani font, "rainbow" gradient.
- Animation: `framer-motion` (imported directly, but **only `motion` is in `package.json`** — an implicit transitive dependency).
- No WebGL, no Lenis/GSAP, no audio, no `<dialog>`, no OG/manifest/sitemap/robots/JSON-LD, no tests, no CI. The README is the create-next-app boilerplate.

### Quality baseline measured on 2026-11-22

| Check | Result |
|---|---|
| `tsc --noEmit` | ✅ no errors |
| `eslint .` | ❌ **2 errors** (`react-hooks/refs` in `EmailForm.tsx:106` and `:139`) + 1 warning (unused `__dirname` in `eslint.config.mjs`) |
| Dependencies | `node_modules/next` is at **16.2.10**, but `package.json` and `package-lock.json` say **16.1.1** (install out of sync) |

### Pre-existing problems (not from the reference, but they will be touched)

| # | Problem | Where | Task |
|---|---|---|---|
| P1 | `<html>` without a `lang` attribute | `src/app/[locale]/layout.tsx` | T01 |
| P2 | Hardcoded "contact" text in the menu (not translated) | `Header.tsx` | T07 |
| P3 | `<footer>` nested inside `<footer>` | `Footer.tsx` | T13 |
| P4 | `message` and `contactBackEmail` interpolated **without escaping** into the email HTML; no server-side validation; no size limit/rate limit | `app/api/email/route.ts` | T32 |
| P5 | `RESEND_API_KEY` exists in `.env.local` but is not used in the code; there is no `.env.example` (and `.gitignore` ignores `.env*`) | root | T32 |
| P6 | `framer-motion` as an implicit dependency | `Hero.tsx`, `Motion.tsx` | T02/T36 |
| P7 | Project PNGs of up to 2.8 MB served without any source-side optimization | `public/img/projects/` | T31 |
| P8 | `useResponsiveMotion`/`useScreenSize` duplicate what CSS media queries do | `src/hooks`, `src/stores` | T36 |

## 2. Delta per area

Legend: **Keep** · **Adapt** · **Replace** · **Remove** · **New**

| Area | Today | Target | Action | Tasks |
|---|---|---|---|---|
| Framework | Next 16 App Router | same | Keep | — |
| i18n | next-intl pt/en | same + HUD/world/case file strings | Adapt | T04 |
| Root layout | Rajdhani, no `lang`, minimal metadata | 3 variable fonts, `lang`, slots (world/HUD/main), `is-intro` script | Replace | T01, T03, T05 |
| Design tokens | SCSS vars (`$background`…) | CSS custom properties (`--ink`, `--solar`…) + SCSS Modules | Adapt | T03 |
| Scroll | `scroll-behavior: smooth` + `react-scroll` | Lenis ↔ GSAP ticker ↔ ScrollTrigger | Replace | T06 |
| DOM animations | `framer-motion` (`Motion.*`) | GSAP reveal via `[data-reveal]` | Replace | T09 |
| Header | Bar with IntersectionObserver + `LanguageSelector` | HUD (wordmark, CTA, menu), nav rail, mobile overlay; `LanguageSelector` reused inside the HUD | Replace/Adapt | T07 |
| Active section | IntersectionObserver in `Header` | single hook used by nav + locator | New | T08 |
| Locator | — | index/sector/progress bar | New | T08 |
| Hero | Typing + scroll indicator | name in letters, lead, CTAs, status, socials | Replace | T10 |
| About | Rich text | title + prose + services (content in `data-reveal`) | Adapt | T10 |
| Skills | Vertical Swiper of icons | chip groups with evidence + hover lights up a 3D star | Replace | T12 |
| Projects | Card grid + `IconsProvider` | one article per project + "Open case file" button + archive | Replace | T11 |
| Case files | — | one `<dialog>` per project, deep link, focus, sound | New | T14 |
| Journey | — | milestone timeline | New | T12 |
| Contact | Buttons + `EmailForm` | CTAs + contact list **+ keep `EmailForm`** | Adapt | T13, T32 |
| Footer | Copyright | copyright + credit | Adapt | T13 |
| 3D world | — | lazy three.js engine (renderer, quality, environment, rig, 6 scenes, picking, bloom) | New | T15–T26 |
| Intro | 3 s delay in the Hero | overlay + fly-in + skip + failsafe | New | T27 |
| Audio | — | WebAudio engine + panel | New | T28, T29 |
| SEO/PWA | fixed `title`/`description` | OG/Twitter/canonical/hreflang/manifest/sitemap/robots/JSON-LD | New | T30 |
| Images | Heavy PNGs | AVIF/WebP + variants + 3D textures | Adapt | T31 |
| Email API | nodemailer without sanitization | zod validation, escaping, honeypot, `.env.example` | Adapt | T32 |
| A11y / reduced-motion | partial | full audit, first-class paths | New | T33 |
| Performance | not measured | budgets + leak audit | New | T34 |
| Tests/CI | none | Vitest (pure logic) + Playwright (smoke) + GitHub Actions | New | T35 |
| Obsolete dependencies | `swiper`, `react-scroll`, `motion`/framer-motion, skill icons | removed | Remove | T36 |
| Docs | boilerplate README | README + CLAUDE.md + `.claude/docs/` | New | (this package) · T36 |

## 3. Dependencies

| Action | Package | Reason |
|---|---|---|
| Add | `three` (+ `@types/three`) | 3D world (the reference uses r186; current npm version: 0.187) |
| Add | `gsap` (+ optional `@gsap/react`) | reveal, intro, ScrollTrigger |
| Add | `lenis` | smooth scroll (the `@studio-freight/lenis` package was renamed) |
| Add (dev) | `vitest`, `@playwright/test` | tests (T35) |
| Remove (T36) | `swiper`, `react-scroll`, `motion` (and the use of `framer-motion`) | replaced |
| Reassess (T36) | `react-icons`, `zustand`, `IconsProvider` | only if they are still used after the migration |
| **Do not** add | `@fontsource-*` | `next/font/google` already covers it (and the project already uses it) |
| **Do not** add | `@react-three/fiber`/`drei` | see ADR-02 |

## 4. Main risks

| Risk | Impact | Mitigation |
|---|---|---|
| Heavy world bundle (three.js ≈ 600 KB min.) | LCP/TBT on mobile | engine in a lazy chunk after `requestIdleCallback`; tiers; Phase 1 works without it; budget in T34 |
| StrictMode mounts effects twice | GPU/audio/listener leaks | idempotent cleanup is mandatory; mount/unmount test in T34 |
| A lot of new content to write (case files, milestones, pt/en texts) | blocks T11/T12/T14 | `.claude/docs/CONTENT.md` with a checklist; use placeholders marked `TODO(content)` |
| Following "very similar" slipping into copying | legal/copyright and identity risk | clean-room rule in `CLAUDE.md`; own content, names and visuals |
| Large scope | project doesn't get finished | incremental milestones (M1…M5) — each one leaves the site functional and publishable |
