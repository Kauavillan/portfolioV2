# T07 — HUD: top bar, nav rail and mobile menu

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 1 · M1 | M | T04, T05, T06 | F02, F03, F05 · fixes P2 |

## Goal
Replace the current `Header` with the HUD: top bar (wordmark, CTA, language, menu), side nav rail and a full-screen overlay on mobile — with anchor navigation that moves focus correctly.

## Scope
- **`Hud` (top)**: wordmark (logo/name, translated `aria-label` "back to top"), **CTA** button (book/talk — decision D5; hidden < 900 px), **reused** `LanguageSelector` (restyle it in the HUD; keep `onOpenChange` if still useful), **Menu** button (< 900 px only). `hud-fade` gradients (112 px) top/bottom.
- **`NavRail`**: 6 links (`data-nav`, `href="#home|about|work|skills|journey|contact"`), labels from `Hud.nav.*`; fixed on the right on desktop; `aria-current="true"` on the active one (the value comes from the T08 hook — in this task, use a stub/simple `useActiveSection`).
- **Mobile menu (< 900 px)**: `html.nav-open` opens a full-screen overlay (14 px blur); the button toggles `Menu`↔`Close` with `aria-expanded`; on open: `lockScroll()`, focus the 1st link; `Esc` closes and returns focus to the button; clicking a link closes the menu. Respect `inert`/focus trap if feasible.
- **Anchors (F05)**: delegation on `a[href^="#"]`: `preventDefault`, `scroll.to(target)`, when done `tabindex=-1` + `focus({preventScroll:true})` and `history.replaceState(null,'', '#id')`. Close the menu before scrolling.
- **i18n**: fix the hard-coded "contact" label (P2) → `Hud.nav.contact`.
- Remove `NavbarLink.tsx` and `react-scroll` from `Header` (the dependency leaves in T36).

## Out of scope
Locator (T08), sound control (T29), new section ids (the sections are built in T10–T13; use the contract ids from `src/lib/contract.ts` even if those sections do not exist yet).

## Acceptance criteria
- [ ] Desktop: nav rail visible; clicking scrolls smoothly (≈ 2.2 s) to the section, focuses the title/section and updates the hash.
- [ ] Mobile (390 px): Menu button opens the overlay; `Esc` closes it; focus returns to the button; page scroll stays locked while open.
- [ ] 100% keyboard navigation (Tab/Shift+Tab/Enter/Esc); targets ≥ 48 px (overlay links 52 px).
- [ ] Language switch works without losing the route/hash.
- [ ] Labels in pt and en; no hard-coded strings.
- [ ] No `react-scroll` imported in the HUD; no console errors.

## Technical notes
- `aria-current` with the string `"true"` only on the active item.
- The overlay must not cover the Menu button (HUD z-index above the overlay: `.nav-open .hud-top {z-index:65}`).

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F02, F03, F05, F35 · `.claude/docs/ARCHITECTURE.md` §4.
