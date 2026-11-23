# T11 — Work section and archive ⚑

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 1 · M1 | M | T03, T04, T09 | F30 (03 Work), F32 |

## Goal
Projects section in the new format: header + **one `article` per featured project** (each one is a camera *station*) + an "archive" block with the rest.

## Scope
- **Header (`#work`, `data-station="work"`)**: label `03`, title, lead.
- **Article per featured project** (`article#project-<id>`, `data-station="project:<id>"`, class `station`): index `NN / 05`, name (`h3`), `kind`, lead, technology **chips**, actions: **Open case file** (`button[data-open-case="<id>"]`), Website, Source and, when present, App Store / Play Store.
- **Archive** ("Also in the archive"): list with name + 1 line + link for the non-featured projects (e.g. NeonNest, Space Tourism).
- Data source: `getFeaturedProjects()`/`getArchiveProjects()` (T04). Texts from `Work.projects.<id>`.
- Reuse `Button` (with `github`, `redirect`, `appStore`, `googlePlay` icons) where it makes sense; text chips replace the row of technology icons.
- Each article takes ≥ `100svh` (one station = one camera "stop").
- Remove the old `ProjectsList`, `Project`, `Projects.module.scss` **at the end of the task** (or in T36 if something still depends on them).

## Out of scope
The `<dialog>` itself (T14) — here only the button that triggers it and the `data-open-case`. 3D artifacts (T21).

## Acceptance criteria
- [ ] N articles = N `featured` projects; index `NN / N` correct and dynamic.
- [ ] Each article has a unique `data-station="project:<id>"` and a navigable `id`.
- [ ] Store buttons only appear for projects that have a URL (Magipass).
- [ ] Archive lists only `featured:false`.
- [ ] pt/en complete; external links with consistent `rel="noopener noreferrer"` and `target="_blank"`.
- [ ] 390 px layout with no horizontal overflow.

## Technical notes
- If there are < 5 featured, the text "Five things I built" must use the real count (i18n interpolation).
- `type` (professional/personal) may appear as a discreet badge — optional.

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F30, F32 · `.claude/docs/CONTENT.md` (Work, Archive).
