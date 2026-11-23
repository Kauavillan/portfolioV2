# T05 — Root layout and shell slots

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 1 · M1 | M | T03 | F01, F10 (pre-script), F11 (container + scrim) |

## Goal
Restructure `src/app/[locale]/layout.tsx` and `page.tsx` into the new system's **mount tree**, with empty "slots", so that the following tasks only fill each one in.

## Scope
- Layout per `ARCHITECTURE.md` §3: `<html lang class>` → `NextIntlClientProvider` → (future `ScrollProvider`, `SoundProvider` as *passthrough* for now) → `SkipLink`, `div[data-world]` + `.scrim`, HUD slots, `<main id="main">`, `Footer`, dialogs slot.
- **`SkipLink`** (F01): `a.skip-link` → `#main`, hidden off-screen and visible on `:focus`.
- **World container** `div.world[data-world]` fixed (`z-index:0`, `pointer-events:none`) with the **CSS fallback background** (2 radials + star dots) and `.scrim` (horizontal ≥ 900 px; vertical < 900 px). `html.no-webgl .scrim {display:none}`.
- **Inline script in the `<head>`** (via `<script dangerouslySetInnerHTML>` in the layout) that adds `html.is-intro` **only if** `!prefers-reduced-motion`, no `location.hash` and `scrollY < 40`, and sets `history.scrollRestoration='manual'` (F10). Wrap in `try/catch`. `suppressHydrationWarning` on `<html>` if needed.
- **Intro failsafe CSS**: `html.is-intro .intro { display:grid; animation: intro-failsafe .6s 7s forwards }` + `@keyframes intro-failsafe { to { opacity:0; visibility:hidden } }` (the overlay itself comes in T27).
- Base **metadata** with the Metadata API (title/description per locale via `Meta`); OG/JSON-LD details in T30.
- **`generateStaticParams`** for `en`/`pt` + `setRequestLocale` (static rendering).
- Change the composition of `page.tsx` to the current sections inside `<main id="main">` (the new ones come in T10–T13).

## Out of scope
HUD (T07), Lenis (T06), intro overlay (T27), three canvas (T15).

## Acceptance criteria
- [ ] Tab on load focuses the **skip link** first; Enter takes you to `#main`.
- [ ] With JS and motion allowed, `<html>` gets `is-intro` before hydration (see in DevTools → Elements); with `prefers-reduced-motion` it does **not**; with `#something` in the URL it does **not**.
- [ ] Without JS the content stays visible (no class hides content by default).
- [ ] The fallback background shows up and the text stays legible (scrim).
- [ ] `en` and `pt` are pre-rendered in `next build` (output shows `● (SSG)` for `/[locale]`).

## Technical notes
- Do not change the IDs of the existing sections yet (`hero`, `about`…); T10–T13 introduce `home/about/work/skills/journey/contact`.
- Layout must remain a Server Component; `ScrollProvider` etc. come in as *client wrappers*.

## Reading
`.claude/docs/ARCHITECTURE.md` §3, §4, §12 · `.claude/docs/REFERENCE-ANALYSIS.md` F01, F10, F11.
