# T30 — SEO, PWA and structured data ⚑

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 4 · M5 | M | T04, T05 | F36 |

## Goal
Correct share card, indexing and installation **in both languages**.

## Scope
- **Per-locale Metadata API** (`generateMetadata`): `title`, `description`, `canonical` (with `metadataBase`), `alternates.languages` (**hreflang** `en`/`pt`/`x-default`), `authors`, `openGraph` (`type website`, `siteName`, `locale`, `url`, 1200×630 image), `twitter` (`summary_large_image`), `themeColor` (= `--ink`), icons. Texts in `Meta.*` (T04).
- **OG image** 1200×630 (≤ ~100 KB): static in `app/opengraph-image.*` or generated with `next/og` (per locale if possible). ⚑ owner approval of the visual.
- **Icons:** `icon.svg` (favicon), `apple-icon` (180/256), 192 and 512 PNG/SVG for the manifest; remove the default `favicon.ico` if replaced.
- **`app/manifest.ts`** (`name`, `short_name`, `start_url`, `display: 'standalone'`, `theme_color`, `background_color` = `--ink`, icons).
- **`app/robots.ts`** (allow all + `sitemap`) and **`app/sitemap.ts`** (`/` and `/pt`, with `alternates`).
- **JSON-LD** (2 `<script type="application/ld+json">` blocks, with no data you do not want public): `Person` (`name`, `jobTitle`, `url`, `sameAs` [GitHub/LinkedIn], `knowsAbout` derived from `skills.ts`; **email/phone only if you decide to expose them**) and `ItemList` "Selected work" (one `CreativeWork` per featured project: `name`, `description`, `url`). Language per locale.
- `<html lang>` (already in T01).

## Out of scope
Analytics (decision D7: none).

## Acceptance criteria
- [ ] Validators: Rich Results Test accepts the JSON-LD; Facebook/Twitter card validators show title, description and image.
- [ ] `view-source` of `/` and `/pt` shows correct `title/description/canonical/hreflang/og:*`, distinct per language.
- [ ] `/manifest.webmanifest`, `/robots.txt`, `/sitemap.xml` respond 200; Lighthouse "installable" ok.
- [ ] Lighthouse SEO ≥ 95 in both languages.
- [ ] No personal data exposed without an explicit decision (phone/email).

## Technical notes
- `metadataBase` comes from an environment variable/production URL (T37).
- Escape `<` inside the JSON-LD payload as the Unicode escape `\u003c` so user-controlled strings can never close the `<script>` tag.

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F36 · `.claude/docs/CONTENT.md` (Metadata).
