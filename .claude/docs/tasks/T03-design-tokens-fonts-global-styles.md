# T03 — Design tokens, fonts and global styles

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 0 · M1 | M | T02 | F33 (partial), F35, F37 (fonts) |

## Goal
Swap the visual base (Rajdhani + `$background`) for a **token system as CSS custom properties** and the 3 fonts of the new design, with the base styles that every section will use.

## Scope
- **Tokens** in `:root` (see `REFERENCE-ANALYSIS.md` §6 — use it as a starting point, but **choose your own accent**, decision D3): `--ink`, `--ink-2`, `--ink-3`, `--star` (+ `--muted`, `--faint`, `--line`, `--line-strong`), `--solar`, `--ion`, `--glass`, `--radius`, `--ease`, `--gutter: clamp(20px, 5vw, 72px)`, `--hud-top/--hud-bottom` with `env(safe-area-inset-*)`, `color-scheme: dark`.
- **Fonts** with `next/font/google` (variable, `display: swap`, subsets `latin` + `latin-ext`): *Unbounded* (display), *Manrope* (body), *JetBrains Mono* (mono) → expose as `--font-display/--font-body/--font-mono` on `<html>`. Remove Rajdhani.
- **Global styles** (`globals.scss`): reset, `body` (background `--ink`, text `--star`, body font), typography (`.display`, `.h-name`, `.h-section`, `.h-project`, `.label`, `.lead`, `.prose`), `.region`/`.region-inner` (min-height `100svh`, padding, 620 px width; `.region-wide` 1180 px), `.btn` (+ `-solar`, `-quiet`; pill, ≥ 48 px / 40 px), `.chip`, `:focus-visible` (2 px `--solar`, offset 3 px), `.skip-link`.
- **`prefers-reduced-motion`**: `*,:before,:after { transition-duration:.2s !important; animation-duration:.001ms !important; animation-iteration-count:1 !important }`.
- **Single 900 px breakpoint** exposed as an SCSS mixin (`@include up(900px)`), replacing `$screen-*` wherever the next task touches.
- Convert `_variables.scss` keeping only what is still used by old components; the rest is removed in T36.

## Out of scope
Styling the HUD, sections or the world (their own tasks). The old site **remains usable** (just with the new base fonts/colors) until each section is migrated; do not leave any screen broken between tasks.

## Acceptance criteria
- [x] The 3 fonts load without perceptible layout shift (`next/font`), and `--font-*` exist on `<html>`.
- [x] All the tokens from §6 exist as CSS custom properties; no new component uses a loose hex.
- [x] With `prefers-reduced-motion: reduce` transitions stay at ≤ .2 s.
- [x] Keyboard focus is visible on links/buttons; contrast of `--muted` over `--ink` ≥ 4.5:1 (verify and adjust the alpha if needed).
- [x] `npm run build` passes; old site still usable.

## Technical notes
- Token values live in **only one** file (`src/styles/_tokens.scss` imported in `globals.scss`).
- For future themes, no hard-coded color in SCSS Modules: always `var(--token)`.

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` §6 · `.claude/docs/CONTENT.md` D3.

## Implementation notes (done 2026-11-23)
- **Decision D3 taken (own palette):** accent `--solar: #ff7a59` (coral) and `--ion: #7da2ff` (periwinkle) — deliberately different from the reference; neutrals `--ink*` / `--star` are generic dark/light. Easy to change: values live **only** in `src/styles/_tokens.scss`.
- Contrast measured (WCAG): `--star` 16.9:1, `--muted` (α .68) 7.9:1, `--faint` 5.4:1, `--solar`/`--ion` on `--ink` 7.8/8.1:1. `--faint` is α **.55**, not .45, because .45 only reached 3.9:1.
- Extra tokens beyond the spec: `--danger`, `--success`, `--on-solar`, `--tap`/`--tap-quiet`, `--hud-bar`, `--z-*` layers, `--ff-*` font stacks.
- Fonts: Unbounded / Manrope / JetBrains Mono through `next/font/google` (variable, `swap`, `latin` + `latin-ext`), exposed as `--font-display/body/mono` on `<html>`. Rajdhani removed. Layout shift was **not** measured (T34).
- Global partials: `_tokens`, `_mixins` (`up()` / `down()` at 900px), `_base`, `_world`, `_lenis`, `_reveal`.
- `Button` was rewritten on the global `.btn` classes (it previously had its own module). `Button.module.scss` is gone.
- `_variables.scss` is now used only by the orphaned `Home.module.scss` (both can go in T36).
