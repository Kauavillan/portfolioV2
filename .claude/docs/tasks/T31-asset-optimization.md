# T31 — Asset optimization ⚑

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 4 · M5 | M | T04 | F37 · fixes P7 |

## Goal
Light, consistent images for case files and **3D textures**, with no multi-MB PNGs.

## Scope
- **Inventory** (`CONTENT.md` §5): 7 PNGs in use (up to 2.8 MB), 3 orphans, `profile-avatar.png` (1.4 MB, decision D8).
- **Script `scripts/optimize-images.mjs`** (with `sharp`, dev-dep) that generates, from originals (kept **outside** `public/`, e.g. `assets-src/`): AVIF + WebP + fallback, widths (e.g. 500/800/1200/1600) and **3D textures** (≤ 1024 px on the longest side, dimensions ≈ power of 2 are not required but preferable) in `public/img/projects/`. Idempotent.
- Image metadata (width/height) written to `src/data/projects.ts` (or generated) to avoid CLS and feed `next/image`.
- Use `next/image` with correct `sizes` in the case files (T14); textures loaded via `TextureLoader` (T21).
- ⚑ **You provide** the final screenshots (clean 1600×1000, if possible) and the pt/en `alt` for each one.
- Budget: no case image > ~150 KB (AVIF/WebP) and no 3D texture > ~200 KB.
- `.gitignore`/Git LFS: decide whether the originals stay out of the repo (recommended: outside or LFS).

## Out of scope
Removing the orphan assets (T36).

## Acceptance criteria
- [ ] `npm run optimize:images` regenerates everything and produces the sizes above.
- [ ] Total weight of `public/img/` drops from ~18 MB to a few hundred KB for the ones in use.
- [ ] Lighthouse does not complain about "properly size images"/"next-gen formats" in the case files.
- [ ] All images have pt/en `alt` and `width/height`.
- [ ] 3D textures load without exceeding the budget (T34).

## Technical notes
- `sharp` is native: pin the version and document `npm rebuild sharp` in case of problems.
- Textures in sRGB (`texture.colorSpace = SRGBColorSpace`) — wrong color is a common mistake.

## Reading
`.claude/docs/CONTENT.md` §5 · `.claude/docs/REFERENCE-ANALYSIS.md` F37.
