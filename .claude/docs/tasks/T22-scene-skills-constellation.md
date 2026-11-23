# T22 — Skills scene: constellation

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 3 · M3 | L | T12, T18 | F21 |

## Goal
Each skill is a **star**; hovering/focusing a chip (or group) **lights up** the corresponding star — the most "alive" DOM ↔ 3D bridge in the project.

## Scope
- **`src/world/scenes/skills.ts`** implementing `Region` + `light(key, on)`:
  - **layout:** group hubs distributed on an ellipse (≈ 22×13, slight Z variation) around the station center; each group's skills on a **golden-angle spiral** (radius ≈ 3 + √(i+1)·2.1) with small Z variation; lines (`LineSegments`) linking the chain hub → skill₁ → skill₂ …;
  - **`Points`** with `ShaderMaterial`: attributes `aSize` (hub > `shipped` > `stated`), per-vertex `color` (hub cool color, warm stars), **`aLit`** (0..1; in the shader it mixes toward the highlight color and increases the size), twinkle via `uTime`, `uReveal`, additive blending, `depthWrite:false`, scaling by `uPixelRatio`;
  - **`light(key, on)`**: `key` = `group:skill` or `group` (lights the whole group); animate `aLit` with lerp so it does not "blink".
- **`skills` station** (head-on camera, lateral `offset`, `offsetNarrow:0`, `mood`).
- **UI wiring** (in `WorldCanvas`/controller, using `handle.lightSkill`): `pointerenter/leave` and `focus/blur` on `[data-skill]`; `pointerenter/leave` on `[data-skill-group]`; clear everything on `dispose`.
- `evidence="stated"` ⇒ dimmer, smaller star; the DOM legend (T12) explains it.

## Out of scope
DOM layout (T12).

## Acceptance criteria
- [ ] Hover and focus on a chip light up **the right star** (verify with 3 skills from different groups); leaving turns it off.
- [ ] Hover on the group lights up all of its stars.
- [ ] Stated × shipped are visually distinguishable.
- [ ] No per-frame allocation in `update`; **one** points draw call + **one** lines draw call.
- [ ] Nonexistent keys are ignored (no exception).
- [ ] Listeners removed on cleanup (StrictMode).
- [ ] Works with the language switched (keys use the canonical name, not the translated text).

## Technical notes
- Reuse `util/rng.ts` if you need deterministic noise.
- On touch, "hover" does not exist: tapping the chip can light it temporarily (optional, `focus`).

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F21.
