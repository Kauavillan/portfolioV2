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
- [x] Open/close by button, `Esc` and backdrop; focus trapped inside the modal and returned on close.
- [x] Scrolling inside the modal does **not** scroll the page; on close, the page scroll comes back.
- [x] `/#case-<id>` (and `/pt#case-<id>`) opens the modal on load.
- [x] Screen reader announces the title (`aria-labelledby`).
- [x] Works at 390 px (content scrolls, Close button always reachable).
- [x] `prefers-reduced-motion`: no entry animation.
- [x] A project without an image leaves no hole in the layout.

## Technical notes
- `<dialog>` is supported in all current browsers; no polyfill needed.
- Avoid mounting 5 heavy modals in SSR with eager images; use `loading="lazy"`.

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F31 · `.claude/docs/CONTENT.md` (case file).

## Implementation notes (done 2026-11-23)
- `CaseDialogs` renders one native `<dialog>` per featured project and owns the delegated opener, `#case-<id>` (load + `hashchange`) and the store action `openCase(id, opener?)` for T25. Opening also writes `#case-<id>` (shareable URL; `replaceState`, no history entry); closing removes it.
- A direct switch A→B must not let A's async `close` event close B — guarded. Focus returns to the opener. The header with the Close button sits **outside** the scrolling area so it is always reachable (checked after scrolling to the bottom at 390px).
- **Found in testing:** the browser's default modal cap `max-width: calc(100% - 6px - 2em)` silently shrank the dialog (352px instead of 358px at 390px); fixed with `max-width: none`.
- Production builds hide every `TODO(content)` line and any section left empty (`src/utils/content.ts`); `next dev` shows them so the owner sees what is missing. Verified in the production DOM (header/main/footer/dialogs).
- Media is `object-fit: contain` over `--ink-3` (two projects have square logos, not screenshots); a project with no image renders no figure (no hole).
