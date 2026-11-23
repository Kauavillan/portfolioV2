// Typed, NON-translatable content model (see `.claude/docs/CONTENT.md` §3).
// Translatable text lives in `src/i18n/locales/*.json`, keyed by `id`.
//
// Keep this file (and projects/skills/milestones/world) free of runtime imports:
// `scripts/check-i18n.mjs` loads them directly with Node's type stripping.

import type { SectionId } from "../lib/contract";

/** The six sectors of the page / world. Same keys as the navigable sections. */
export type SectorKey = SectionId;

/** One procedural 3D object per featured project (built in T21). */
export type ArtifactKind =
  | "phone-pass"
  | "qr-lattice"
  | "tile-grid"
  | "neural-graph"
  | "module-globe";

/** `shipped` = used in a published project above · `stated` = known, no project yet. */
export type Evidence = "shipped" | "stated";

export type ProjectType = "professional" | "personal";

export interface ProjectImage {
  /** Path under /public. */
  src: string;
  width: number;
  height: number;
}

export interface ProjectLinks {
  website?: string;
  github?: string;
  appStore?: string;
  playStore?: string;
}

interface ProjectBase {
  /** Stable kebab-case slug, no accents. Used in anchors (`#case-<id>`, `project:<id>`). */
  id: string;
  /** Display name (not translated). */
  name: string;
  type: ProjectType;
  /** Technology chips, not translated. 6 at most. */
  stack: readonly string[];
  links: ProjectLinks;
  image?: ProjectImage;
}

/** Gets an article in Work, a case file and a 3D artifact. */
export interface FeaturedProject extends ProjectBase {
  featured: true;
  artifact: ArtifactKind;
  /** Two hex colors that tint the sky while the project is in focus. */
  mood: readonly [string, string];
  /** Optional 3D texture path under /public. */
  texture?: string;
}

/** Only listed in the "also in the archive" block. */
export interface ArchiveProject extends ProjectBase {
  featured: false;
}

export type Project = FeaturedProject | ArchiveProject;

export interface Skill {
  /** Canonical (untranslated) name. */
  name: string;
  evidence: Evidence;
}

export interface SkillGroup {
  id: string;
  skills: readonly Skill[];
}

export interface Milestone {
  id: string;
  /** `YYYY-MM` — formatted per locale at render time. Texts live in i18n. */
  date: string;
}

/** What the 3D world receives: structure only, never translatable text. */
export interface WorldProject {
  id: string;
  artifact: ArtifactKind;
  mood: readonly [string, string];
  image?: string;
}

export interface WorldData {
  projects: WorldProject[];
  skillGroups: { id: string; skills: { name: string; evidence: Evidence }[] }[];
  milestoneCount: number;
}
