# T33 — Accessibility and reduced-motion audit

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 4 · M5 | L | T25, T27, T29 | F33, F35 |

## Goal
Ensure the site is usable **without a mouse, without animation, without WebGL and with a screen reader** — and fix whatever the audit finds.

## Scope
- **Path matrix** (each row walked through from start to end): {desktop, mobile} × {normal motion, `prefers-reduced-motion`} × {WebGL, `no-webgl`} × {mouse, keyboard only, screen reader (VoiceOver/NVDA)}.
- **Technical checklist:**
  - skip link, focus order and **visible focus** everywhere; no focus traps (menu, sound panel, dialog);
  - semantics: a single `h1`; `h2/h3` hierarchy with no skipped levels; landmarks (`header/nav/main/footer`), `aria-current`, `aria-expanded`, `aria-pressed`, `aria-labelledby` on the dialogs; canvas `aria-hidden`; the sliced `h1` name is read once;
  - **contrast** of `--muted/--faint` over a light/dark scene (WCAG AA 4.5:1 text, 3:1 UI) — adjust alpha/scrim;
  - targets ≥ 48 px (40 px on secondary ones); 200% zoom with no loss; no horizontal scroll at 320 px;
  - **reduced-motion:** no Lenis, reveal, intro; world in snapshots; **audio never turns on by itself**; no CSS transition animation > .2 s;
  - correct `lang`, `hreflang`, language switch announced; image `alt`s;
  - form: labels, associated errors (`aria-describedby`), status in `aria-live`.
- **Tools:** axe (extension or `@axe-core/playwright` in T35), Lighthouse A11y, manual testing with VoiceOver (Safari/macOS) and keyboard.
- Record findings and fixes in the PR; open new tasks for anything beyond scope.

## Out of scope
New features.

## Acceptance criteria
- [ ] Lighthouse A11y ≥ 95 in `en` and `pt`, desktop and mobile.
- [ ] axe with no **serious/critical** violations in: home, open menu, open dialog, open sound panel.
- [ ] Full matrix executed; zero blockers (keyboard-only users reach 100% of the actions, including opening/closing a case and adjusting sound).
- [ ] With reduced-motion: no scroll/camera animation; the content is 100% accessible.
- [ ] AA contrast verified on the 6 sections over the scene.

## Technical notes
- Special attention: text over the 3D scene changes contrast depending on the camera — evaluate at each station's dwell points.

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F33, F35 · `.claude/docs/ARCHITECTURE.md` §10.
