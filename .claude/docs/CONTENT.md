# Content and identity

The **code** side is planned in `.claude/docs/TASKS.md`. The **content** side depends on you (Kauã) and blocks specific tasks. This document lists what needs to be decided and written, with the expected formats.

> Clean-room rule: the reference's content, sector names, tone and images belong to its author. Write your own. The reference serves as a **structure model**, not as text.

## 1. Pending decisions (with suggested default)

| # | Decision | Suggested default | Blocks |
|---|---|---|---|
| D1 | **World theme/metaphor.** The reference uses a "space observatory" (star, rings, lens, constellation, beacon). Keep space or create another world (e.g. neon city, ocean, circuit)? | Keep the **mechanics** identical and use your own space theme with **your own names and palette** (so tasks T17–T24 hold as written). If you pick another theme, only T17–T24 change (scenes), the rest does not | T03, T17–T24 |
| D2 | **Which 5 projects go into the 3D world** (one 3D artifact each) | Magipass · QRypt · Entropyle · DeepQuiz · Wegia. They go in the *archive*: NeonNest, Space Tourism | T11, T14, T21 |
| D3 | **Palette and fonts** | Start from the reference's tokens (`--ink`, `--star`, `--solar`, `--ion`) and swap the main accent for your own | T03 |
| D4 | **Names of the 6 sectors** (shown in the locator) | Pick your own names, 1–2 words, pt/en | T04 |
| D5 | **Booking link** ("Book a call") | If you don't have one, replace the CTA with "Get in touch" → `#contact` | T07, T13 |
| D6 | **Project images and video** for case files and 3D textures | Current screenshots in `public/img/projects/`; redo them as clean 1600×1000 shots when possible | T14, T21, T31 |
| D7 | **Analytics** | None (same as the reference) | — |
| D8 | **Photo/avatar** | The reference shows no photo. Today `profile-avatar.png` (1.4 MB) is used in `About.tsx`. Decide: remove it, or keep a small (optimized) photo in About | T10, T31 |

## 2. What to write (checklist per block)

All site copy is written in both `pt` **and** `en` (the site stays bilingual). Keep sentences short; the text shares the screen with a 3D scene behind it.

### Home (F30)
- [ ] Label (one line): e.g. "Full Stack Developer"
- [ ] Name displayed as split letters (`Kauã` or `Kauã Villa Nova`) — watch out for accents in the separated letters (`aria-label` on the `h1` with the full name)
- [ ] Lead (1 sentence, ≤ 90 characters)
- [ ] 2 CTAs (primary / secondary) and status ("Open to new projects")
- [ ] Socials: GitHub, LinkedIn (already in `src/utils/commonUrls.tsx`)

### About (F30)
- [ ] Title (1 sentence)
- [ ] 3 short paragraphs (education, mobile/front-end focus, working principle) — reuse the current `About.aboutText`
- [ ] 2 "services" (title + 1–2 sentences): e.g. *Mobile (Expo/React Native)* and *Web (Next.js)*

### Work (F30, F31, F32) — per featured project (5)
- [ ] `kind` (e.g. "Mobile app · Expo")
- [ ] `lead` (1–2 sentences)
- [ ] Technology chips (6, **not translated**)
- [ ] Links: website, code, store(s)
- [ ] **Case file**: *problem* (2 sentences), *my role* (1 sentence), *key features* (3–4 items), *technical challenges* (2–3 items), *results* (1–3 items), *stack* (chips), extra links
- [ ] Image (optional) + descriptive `alt` in pt/en
- [ ] Mapping to a 3D artifact (see §4)
- [ ] `mood`: 2 colors (hex) that tint the sky when the project is in focus

### Archive (F32)
- [ ] Smaller projects: name, 1 line, link (NeonNest, Space Tourism, others)

### Skills (F30)
- [ ] 5–7 groups (e.g. Languages, Front-end, Mobile, Backend & data, Payments, Tools, Design)
- [ ] Each skill with `evidence`: **`shipped`** (used in a published project above → bright star) or **`stated`** (known, but without a project → dim star). Be honest: the section legend explains the difference

### Journey (F30)
- [ ] 6–9 milestones (date + title + 1 sentence). Suggestions from the repository history: first projects (Frontend Mentor), NeonNest, Wegia (internship), Magipass, QRypt, DeepQuiz, Entropyle, "this portfolio v3". `milestoneCount` = number of milestones

### Contact (F30)
- [ ] Title + lead; CTAs; contact list (email, GitHub, LinkedIn); keep the current **form**
- [ ] Decide whether the phone number appears (the reference shows it; it is optional)

### HUD, intro and sound
- [ ] HUD texts (Menu/Close, "Book a call", "Skip intro", "Scroll to explore"), intro ("Loading the 3D world…") and sound panel — pt/en

### Metadata (F36)
- [ ] `title` and `description` per language, 1200×630 OG image, JSON-LD `knowsAbout`

## 3. Data model (TypeScript — target of T04)

```ts
// src/data/types.ts
export type ArtifactKind = "phone-pass" | "qr-lattice" | "tile-grid" | "neural-graph" | "terminal" /* …open-ended; 1 per project */;
export type Evidence = "shipped" | "stated";
export type SectorKey = "home" | "about" | "work" | "skills" | "journey" | "contact";

export interface Project {
  id: string;                         // stable slug: "magipass"
  artifact: ArtifactKind;             // which 3D object (T21)
  mood: [string, string];             // 2 hex colors
  image?: { src: string; width: number; height: number };   // case file (T14/T31)
  texture?: string;                   // optional 3D texture (T21)
  stack: string[];                    // chips (not translated)
  links: { website?: string; github?: string; appStore?: string; playStore?: string };
  featured: boolean;                  // true = 3D world + article; false = archive
  type: "professional" | "personal";
}
export interface SkillGroup { id: string; skills: { name: string; evidence: Evidence }[] }
export interface Milestone  { id: string; date: string /* "2025-07" */ }   // texts live in i18n
```

Translatable texts live in `src/i18n/locales/*.json`, keyed by `id` (see `ARCHITECTURE.md` §8).

## 4. Suggested project → 3D artifact mapping

Each artifact is a simple procedural object (primitives + 1 material/shader), lightly animated. Suggestions (all open — they are ideas, not obligations):

| Project | Type | 3D object idea |
|---|---|---|
| Magipass | mobile app · passes/offers | floating pass card with a chip and a rotating holographic stripe |
| QRypt | QR Code security | matrix of instanced cubes forming a QR, with a lock/ring that "signs" it |
| Entropyle | word game | grid of letter tiles (instanced) that change color and shuffle (entropy modifier) |
| DeepQuiz | AI-powered quiz | graph of connected glowing nodes with a central "?" |
| Wegia | NGO web system | globe/network of points or modules that snap together |
| NeonNest (archive) | cyberpunk e-commerce | (no artifact — goes to the archive) |

## 5. Inventory of current assets and destination

| Asset | Status | Destination |
|---|---|---|
| `public/img/projects/*.png` (10 files, up to 2.8 MB) | Heavy and without variants. 7 are in use; **`address-tracker.png`, `card-form.png` and `multi-step-form.png` are not referenced** in the code | Convert the ones in use to AVIF/WebP with variants (T31); remove the 3 orphans (T36) |
| `public/img/profile-avatar.png` (1.4 MB) | Used in `About.tsx` | Decide (D8) |
| `public/icons/*.svg` (19) and `IconsProvider` | Used in the current cards/Skills | Re-evaluate in T36 (text chips don't need an icon) |
| `public/{file,globe,next,vercel,window}.svg` | Leftovers from create-next-app | Remove (T36) |
| Favicon/PWA icons | only `favicon.ico` | Create `icon.svg`, 192/512, apple-touch (T30) |
| OG image | nonexistent | Create 1200×630 (T30) |

## 6. Translation rules

- Identical keys in `en.json` and `pt.json` (test in T35).
- Rich text: reuse `src/utils/richTextTranslationHandler.tsx` (`<highlight>`, `<break>`, `<rainbow>`); avoid HTML outside this set.
- Short UI text (HUD, buttons): the pt version must not break the layout — test at 390 px.
- Technical terms (Next.js, WebGL…) are not translated.
