# T10 — Home and About sections ⚑

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 1 · M1 | M | T03, T04, T09 | F30 (01 Home, 02 About) |

## Goal
Replace `Hero` and `About` with the new sections, as **Server Components** with the contract attributes (`data-section/station/label/sector`, `data-reveal`, `data-hero-ch`).

## Scope
- **Home (`#home`, `data-station="home"`)**: label with index `01`, **name in per-letter `span`s** (`data-hero-ch`) inside an `h1` with `aria-label` = full name, lead, 2 CTAs (primary → `#work`, secondary → `#contact`), status "Open to new projects" (pulsing dot), social links (GitHub/LinkedIn from `commonUrls.tsx`), "Scroll to explore" hint (hidden < 900 px).
- **About (`#about`, `data-station="about"`)**: label `02`, title, prose (3 paragraphs — reuse `About.aboutText`), 2 *services*.
- Per-letter splitting must work with **accents/cedilla** (`Kauã`): split by *grapheme* (`Intl.Segmenter`) or a fixed list; keep `aria-hidden` on the `span`s and `aria-label` on the `h1`.
- Styles in `src/styles/Hero.module.scss`/`About.module.scss` **rewritten** (remove typing, `scrollDownIndicator`, animated mouse).
- Photo `profile-avatar.png`: follow decision D8 (remove it or keep it small and optimized).
- Remove `useTypingEffect` if it ends up unused (or leave it for T36).
- `data-section`, `data-label`, `data-sector` translated (sectors defined in D4 / `Sectors.*`).

## Out of scope
Home entrance animation (that belongs to the intro, T27); 3D scene.

## Acceptance criteria
- [ ] Correct layout at 1440 px and 390 px; text in the left column (`.region-inner` ≤ 620 px), free space on the right for the 3D.
- [ ] Screen reader announces the name once (`aria-label`), not letter by letter.
- [ ] `data-reveal` on the About elements (and on the Home ones except where the intro takes over).
- [ ] All texts come from `Hero.*`/`About.*` in pt and en.
- [ ] No `framer-motion` in these components.

## Technical notes
- Home keeps `min-height: 100svh`; avoid CLS when fonts load (fluid size with `clamp`).
- `scroll-hint` absolutely positioned at the bottom of the section.

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F30 · `.claude/docs/CONTENT.md` (Home, About).
