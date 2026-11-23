# T12 — Skills and Journey sections ⚑

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 1 · M1 | M | T03, T04, T09 | F30 (04 Skills, 05 Journey) |

## Goal
Replace the icon Swiper with **groups of chips with evidence** and create the milestone **timeline** — already carrying the `data-*` attributes the 3D world will use (hover lights up the star).

## Scope
- **Skills (`#skills`, `data-station="skills"`, `region-wide`)**: label `04`, title, lead, `skill-groups`: for each group `[data-skill-group="<id>"]` with an `h3` and a list of chips; each chip `li.chip[data-skill="<group>:<name>"][data-evidence="shipped|stated"]`; legend explaining "bright = used in the projects above; dim = broader knowledge".
- **Focusable** chips (`tabindex=0`) so that `focus/blur` also lights up the star (T22); visual state `.is-lit` + `:hover`/`:focus-visible`.
- **Journey (`#journey`, `data-station="journey"`)**: label `05`, title, `ol.timeline` with `li.milestone` (`<time>`, `h3`, `p`), vertical gradient line and a marker per item. N milestones = `milestones.length` (used for the world's `milestoneCount`).
- Data from `skills.ts`/`milestones.ts` (T04); texts from `Skills.*`/`Journey.milestones.<id>`.
- Remove the old `Skills.tsx`, `SkillsSwiper.tsx`, `Skills.module.scss`, `swiper` and `src/types/global.d.ts` (`swiper/css*` declarations) in T36 (or here if nothing else uses them).
- Respect the honesty of `evidence` (`CONTENT.md`): `shipped` only for what is in a published project.

## Out of scope
3D hover behavior (T22) and the helix (T23).

## Acceptance criteria
- [ ] Every skill in `skills.ts` appears once, in the right group, with a unique `data-skill` and a valid `data-evidence`.
- [ ] Tab navigation walks through the chips; focus visible.
- [ ] Timeline legible at 390 px; dates formatted per locale (`Intl.DateTimeFormat`).
- [ ] pt/en complete.
- [ ] No Swiper on the page.

## Technical notes
- `data-skill` uses the **canonical (untranslated) name** to match the world.
- Mono chips (`--font-mono`), pill, `--line` border.

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F21, F22, F30 · `.claude/docs/CONTENT.md` (Skills, Journey).
