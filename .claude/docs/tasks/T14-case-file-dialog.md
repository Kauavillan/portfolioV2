# T14 — Case files (`<dialog>`) ⚑

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 1 · M1 | M | T06, T11 | F31 |

## Goal
A modal `<dialog>` per featured project with the "full story", opened by the section button, by deep link or (later) by clicking the 3D object.

## Scope
- **`CaseDialogs`** (client): one `<dialog data-case="<id>" aria-labelledby="case-<id>">` per featured project. Content: type (label), `h2`, lead, **media** (optional, `next/image` with `sizes`, `width/height`, lazy), *Problem* + *My role* grid, *Key features* + *Technical challenges*, *Outcomes*, *Stack* (chips), actions (website/code/stores/releases).
- **Open:** `showModal()`; `.case-scroll` with `scrollTop=0` and `data-lenis-prevent`; `lockScroll()`; remember the element that opened it. **Close:** `[data-case-close]` button, `Esc` (native) or backdrop click (`event.target === dialog`); `unlockScroll()`; **return focus** to the opener (if still in the DOM).
- **Deep link `#case-<id>`** opens on load (`requestAnimationFrame`); closing removes the hash (`history.replaceState`) — does not add a history entry.
- API for the world: `openCase(id, opener?)` via context/store (`caseOpen`), used in T25. Optional hook for `open/close` sound (T28): call callbacks if they exist.
- Style: width `min(880px, 100vw − 32px)`, `max-height: min(88vh, 900px)`, 24 px radius, backdrop with 6 px blur, `case-in` entry animation; Close button visible and focusable.
- Content: `Case.<id>.*` (T04); `TODO(content)` where missing.

## Out of scope
Clicking the 3D object (T25); sounds (T28).

## Acceptance criteria
- [ ] Open/close by button, `Esc` and backdrop; focus trapped inside the modal and returned on close.
- [ ] Scrolling inside the modal does **not** scroll the page; on close, the page scroll comes back.
- [ ] `/#case-<id>` (and `/pt#case-<id>`) opens the modal on load.
- [ ] Screen reader announces the title (`aria-labelledby`).
- [ ] Works at 390 px (content scrolls, Close button always reachable).
- [ ] `prefers-reduced-motion`: no entry animation.
- [ ] A project without an image leaves no hole in the layout.

## Technical notes
- `<dialog>` is supported in all current browsers; no polyfill needed.
- Avoid mounting 5 heavy modals in SSR with eager images; use `loading="lazy"`.

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F31 · `.claude/docs/CONTENT.md` (case file).
