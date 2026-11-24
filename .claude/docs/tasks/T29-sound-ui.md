# T29 — Sound UI

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 3 · M4 | M | T28, T05 | F29 |

## Goal
Sound control in the bottom-right corner: on/off, settings panel and accessible states.

## Scope
- **`SoundControl`** (client, `data-sound`): main button with **animated bars** (4 `<i>`; they animate only when `data-on="true"`), "Sound" text + state ("on/off"), `aria-pressed`; **settings** button (`aria-expanded`, `aria-controls`) that opens a `div[role=group]` with: **Volume** (`input[type=range]` 0–100), **Ambience** (checkbox), **Interface sounds** (checkbox) and the **output note** ("Generated live in your browser. Stereo, spatialized for headphones" — or, if `maxChannelCount > 2`, the specific variant).
- **Behavior:** `Esc` closes the panel and returns focus to the settings button; `pointerdown` outside closes it; `hidden` until the JS initializes (no flash).
- **States:** no `AudioContext` ⇒ button disabled + "Sound unavailable"; `waiting` (on but awaiting a gesture) may show an intermediate state.
- Subscribes to `engine.subscribe` and reflects `enabled/volume/ambient/interaction/output`.
- Full i18n (`Sound.*`); positioning respecting `env(safe-area-inset-bottom)`; does not collide with the Locator or the HUD on mobile.
- Styled with the tokens (`.btn-quiet`, panel with `--glass`/`--line`).

## Out of scope
Engine (T28).

## Acceptance criteria
- [x] Keyboard: Tab reaches both buttons and the panel; Enter/Space toggle; Esc closes. *(Esc returns focus to the settings button)*
- [ ] Screen reader announces the state of the toggle and of the panel. *(`aria-pressed`, `aria-expanded` + `aria-controls`, `role=group` + label are all in place and checked in the DOM; an actual screen-reader pass is T33)*
- [x] Changing volume/switches updates the audio immediately and persists on reload.
- [x] Mobile 390 px: panel fits on screen, targets ≥ 40 px; does not overlap critical content. *(panel 280 px inside the gutters; toggle 87×40, settings 40×40; the label collapses to bars + state on a phone)*
- [x] Animated bars respect `prefers-reduced-motion` (they stay static).
- [x] Without `AudioContext`: button disabled and no console error.

## Technical notes
- Use `aria-pressed` on the toggle (not `aria-checked`) and labels that do not rely on color alone.

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F29.
