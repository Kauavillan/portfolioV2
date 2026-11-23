# T04 — Content model and i18n ⚑

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 0 · M1 | M | T02 | F30 (data), foundation for F36 |

## Goal
Define **a single typed data source** for projects, skills, milestones and sectors, and create the translation namespaces that all the sections will consume — so that T10–T14 and T21–T23 only *render* data.

## Scope
- **Types** in `src/data/types.ts` (see `CONTENT.md` §3): `Project`, `SkillGroup`, `Milestone`, `SectorKey`, `ArtifactKind`, `Evidence`.
- **Data** in `src/data/projects.ts`, `skills.ts`, `milestones.ts`, `world.ts` (sectors/moods/artifacts). Migrate the 7 current projects from `ProjectsList.tsx` (links, type, stack) and mark `featured` according to decision D2.
- **Namespaces** in `en.json` and `pt.json`: `Meta`, `Hud`, `Sectors`, `Intro`, `Hero`, `About`, `Work` (`projects.<id>.{kind,lead}`, `archive`), `Skills`, `Journey` (`milestones.<id>.{title,text}`), `Contact`, `Footer`, `Sound`, `Case` (`<id>.{problem,role,features,challenges,outcomes}`; arrays via `t.raw`).
- **Parity test/script** `scripts/check-i18n.mjs` (keys of `en` = `pt`) and `npm run check:i18n`; (becomes a Vitest test in T35).
- **Honest placeholders:** text not yet written goes in as `"TODO(content): …"` in both languages, and the task lists what is missing. Never copy text from the reference.
- Pure utility functions: `getFeaturedProjects()`, `getArchiveProjects()`, `getWorldData()` (what the world receives: ids, artifacts, moods, evidence, `milestoneCount`).

## Out of scope
Rendering the sections (T10–T13) and creating assets (T31).

## Acceptance criteria
- [x] `getWorldData()` returns exactly the shape of `WorldOptions` (`ARCHITECTURE.md` §6.1) **with no translatable text**.
- [x] `npm run check:i18n` fails if a key exists in only one language and passes in the final state.
- [x] Every project has a stable `id` (slug), `type`, `links`, `stack` (6 chips at most) and an entry in `Work.projects` and (if `featured`) in `Case`.
- [x] List of pending `TODO(content)` items attached to the PR/commit.

## Technical notes
- Reuse `richTextTranslationHandler.tsx` for text with emphasis.
- IDs become anchors (`#case-<id>`, `data-station="project:<id>"`): use `kebab-case`, no accents.
- Suggested locale key for JSON-LD/OG in `Meta` (used by T30).

## Reading
`.claude/docs/CONTENT.md` (all of it) · `.claude/docs/ARCHITECTURE.md` §8.

## Implementation notes (done 2026-11-23)
- Types in `src/data/types.ts`; **`Project` is a discriminated union** (`FeaturedProject` requires `artifact` + `mood`, `ArchiveProject` does not). `name` was added to `Project` (display name, not translated).
- The `src/data/*` files have **no runtime imports**, so `scripts/check-i18n.mjs` loads them with Node's type stripping (Node ≥ 22.18). The check verifies en/pt key parity (arrays: same length), identical ICU arguments / rich tags per message, that every project/skill group/milestone/sector has its translations, and data invariants (kebab-case unique ids, ≤ 6 chips, valid evidence…). It fails on a missing key (verified) and lists pending `TODO(content)` (informational).
- `getWorldData()` returns `{ projects:[{id, artifact, mood, image?}], skillGroups, milestoneCount }` — no translatable text. `WorldData` is defined in `types.ts` (no THREE import) so T15 can `extends` it.
- **Existing owner-written strings were left verbatim** (`EmailForm`, `Validations`, the About paragraphs); only the `solucões` typo was fixed.
- Old namespaces `Header`, `Projects`, `Skills.title`, `Hero.typingTexts…` were removed together with the components that used them.
- **Pending `TODO(content)` (12 keys × 2 languages) — see `CONTENT.md` §7.**
