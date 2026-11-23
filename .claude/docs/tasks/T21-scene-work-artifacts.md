# T21 — Work scene: project artifacts ⚑

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 3 · M3 | XL | T11, T18 (T31 for textures) | F20 |

## Goal
Each featured project becomes a **visitable 3D object** on an orbit; the camera lands on each one as the user scrolls, and the object reacts to hover.

## Scope
- **`src/world/scenes/work.ts`** implementing `Region`: entry station `work` + **one station per project** (`project:<id>`), with the project's `mood` (from `data/`); position of project *i* along a line on −Z with oscillation on X/Y (e.g. `x = 48 + sin(1.7i)·14`, `y = −6 + cos(1.3i)·6`, `z = −300 − 80i` — starting point); each station's camera = center + fixed displacement, target = center, lateral `offset`, `offsetNarrow: 0`.
- **Dashed line** connecting the centers (`CatmullRomCurve3` → `LineDashedMaterial`, `computeLineDistances()`), low opacity.
- **Artifact registry** `artifacts/index.ts`: `Record<ArtifactKind, (opts) => { group, update(t, active), dispose() }>`. Each artifact is **procedural** (primitives + 1 material/shader), lightly animated, and can optionally take a **texture** (project image, ≤ 1024 px, `colorSpace = SRGB`, moderate `anisotropy`).
- **Suggested mapping** (decision D2/`CONTENT.md` §4): Magipass → holographic pass card; QRypt → matrix of instanced cubes (QR) with a ring/padlock; Entropyle → grid of letter tiles that change color/shuffle; DeepQuiz → node graph with a central "?"; Wegia → globe/network. **Create your own**; 1 sub-deliverable (commit) per artifact.
- **Hover:** scale `1 + .05·h` with `lerp .12` (`h` comes from picking, T25); `update(t, id === active)`.
- Every artifact `Mesh` gets `userData.projectId` (`traverse`) — requirement of T25.
- `pickables` (groups) and `emitters` (one per project) exposed by the region.

## Out of scope
Raycast/click (T25); case file (T14).

## Acceptance criteria
- [ ] N featured projects ⇒ N objects and N stations; adding a project in `data/` creates object+station **without editing the engine** (only register the `ArtifactKind`).
- [ ] The camera lands head-on at each object without clipping the geometry and without covering the text (desktop and mobile).
- [ ] Dashed line runs through all the centers.
- [ ] Textures use optimized images (T31) and are released in `dispose()`.
- [ ] Cost per artifact measured: ≤ ~N draw calls (use `InstancedMesh` wherever there is repetition); no drop below 30 fps on the low tier.
- [ ] All `Mesh`es have `userData.projectId`.
- [ ] Artifacts and shaders are original (clean-room).

## Technical notes
- Without an image, the artifact must work with geometry/shader alone (the reference has 3 of 5 like this).
- Avoid `MeshPhysicalMaterial` on numerous instances.

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F20 · `.claude/docs/CONTENT.md` §4.
