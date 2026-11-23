# T09 — Reveal system

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 1 · M1 | S | T06 | F09 |

## Goal
Reveal content on viewport entry through **attributes** (`data-reveal`), with GSAP/ScrollTrigger, replacing the framer-motion `Motion.*` wrappers.

## Scope
- **`RevealController`** (client): groups `[data-reveal]` by `[data-reveal-scope]` (or parent); for each group, `gsap.set(items, {opacity:0, y:28})` and a `ScrollTrigger` with `start:'top 78%'`, `end:'bottom 22%'`:
  - `onEnter`: `opacity 1, y 0`, **1.1 s `expo.out`**, stagger **.07**, `overwrite:true`;
  - `onEnterBack`: same, stagger **.05**;
  - `onLeave`: `opacity 0, y −24`, **.6 s `power2.in`**, stagger .03 — **except** inside `#contact` (stays visible);
  - `onLeaveBack`: goes back to `opacity 0, y 28`, .6 s.
- The `#home` section is left out (it will be revealed by the intro — T27; until then, it appears normally).
- **Anti-flash CSS:** `html.motion [data-reveal]{opacity:0; transform:translateY(28px)}` — the `motion` class is added by the controller **only if there is no reduced-motion**.
- **Reduced-motion:** the controller does nothing; the elements stay visible.
- Reapply after `onLayout` (refresh) without duplicating triggers; `ctx.revert()` on cleanup.
- Document the pattern in `ARCHITECTURE.md` §4 (already there) and use `ATTR.reveal`/`ATTR.revealScope` from `contract.ts`.

## Out of scope
Migrating all the sections (each section task adds its own `data-reveal`). Do not remove `Motion.tsx` yet (T36).

## Acceptance criteria
- [x] A test block with `data-reveal` appears on scroll and disappears on exit, with the timings above (check visually and with `gsap.globalTimeline`).
- [x] No flash of visible content before hiding (load with CPU throttling).
- [x] `prefers-reduced-motion`: everything visible, no animation.
- [x] Without JS: everything visible (the `motion` class does not exist).
- [x] Mounting/unmounting does not duplicate ScrollTriggers (`ScrollTrigger.getAll().length` stable).

## Technical notes
- Avoid animating `filter`/`blur`; only `opacity` and `transform` (compositor).

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F09 · `.claude/docs/ARCHITECTURE.md` §11.

## Implementation notes (done 2026-11-23)
- Verified: hidden before hydration (`html.motion` + opacity 0 at `DOMContentLoaded`), reveals on enter, hides on leave, `#contact` stays visible, `#home` excluded, reduced motion and no-JS leave all 68 blocks visible with no GSAP inline styles, ScrollTrigger count stable across scroll/resize/11 remounts.
- Added a **CSS failsafe**: if the controller never runs, `[data-reveal]` shows itself after 6s (`html.motion:not(.reveal-ready)`); the controller sets `reveal-ready`, which switches the failsafe off (an always-on CSS animation would override GSAP's inline styles).
- "Load with CPU throttling" was not literally done; instead the pre-hydration state was asserted at `DOMContentLoaded`.
- No `Motion.tsx` yet removed (T36).
