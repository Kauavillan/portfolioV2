# T36 — Legacy cleanup and final docs

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 4 · M5 | M | all features | fixes P6, P8; closes the migration |

## Goal
Remove what the new system replaced and leave the documentation reflecting the project's **real** state.

## Scope
- **Dependencies to remove:** `swiper`, `react-scroll`, `motion` (and every `framer-motion` import). Re-evaluate `react-icons`, `zustand` (kept by `useUiStore`), `IconsProvider` (stays only if there is real use). Run `npm prune`/`npm ci`.
- **Dead code:** old `Header.tsx`, `NavbarLink.tsx`, `Hero` with typing effect, `useTypingEffect`, `SkillsSwiper`, old `Skills.tsx`, old `ProjectsList.tsx`/`Project.tsx`, `SectionTitle`, `items/Motion.tsx`, `useResponsiveMotion`, `useScreenSize`/`useScreenSizeStore`/`ScreenSizeProvider` **if** nothing else uses them (evaluate P8: CSS media queries replace them), `src/types/global.d.ts` (`swiper/css*` declarations), orphan SCSS module, old `_variables.scss`.
- **Orphan assets:** `public/{file,globe,next,vercel,window}.svg`, unused `public/icons/*`, `address-tracker.png`, `card-form.png`, `multi-step-form.png`, and `profile-avatar.png` if discarded (D8).
- **Checks:** `knip`/`ts-prune` (or `grep`) to find unused exports/files; `npm run lint && npm run typecheck && npm test && npm run build` green; bundle did not grow.
- **Docs:** update `CLAUDE.md` (state, real structure, remove "not started yet", stack table "target"→"current", resolved pitfalls), `README.md`, `.claude/docs/GAP-ANALYSIS.md` (mark P1–P8 as resolved), `.claude/docs/ARCHITECTURE.md` (deviations from the plan + measured numbers), `.claude/docs/TASKS.md` (everything `[x]`), `.claude/docs/REFERENCE-ANALYSIS.md` (note: what was **not** replicated/adapted and why). Move obsolete planning docs to `.claude/docs/archive/` if it makes sense.
- Check credits: footer/README honestly cite the reference as inspiration (without copying the brand).

## Out of scope
New features.

## Acceptance criteria
- [ ] None of the obsolete dependencies in `package.json`/lock; `npm ls` with no extraneous.
- [ ] No orphan file detected by the tool; `public/` only with what is used.
- [ ] Build/lint/types/tests green; initial JS ≤ what was measured in T34.
- [ ] `CLAUDE.md` and `README.md` describe the project **as it is**, with no reference to "planned".
- [ ] `GAP-ANALYSIS.md` shows P1–P8 resolved.

## Technical notes
- Do the removal in small commits (one per group) to make reverting easier.
- Do not remove `zod`, `react-hook-form`, `nodemailer`, `next-intl` (still in use).

## Reading
`.claude/docs/GAP-ANALYSIS.md` §1–§3.
