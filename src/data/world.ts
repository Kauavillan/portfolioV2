import type { ArtifactKind, SectorKey } from "./types";

// Static data the 3D world needs besides the projects/skills/milestones.
// (Own space-station theme, decision D1. Sector *names* are translated in i18n
// under `Sectors.<key>`; the world never receives text.)

/** Sector order = order of the sections on the page. */
export const SECTOR_ORDER: readonly SectorKey[] = [
  "home",
  "about",
  "work",
  "skills",
  "journey",
  "contact",
];

/** Sky tint (two hex colors) while each non-project sector is in focus (used in T17). */
export const SECTOR_MOODS: Readonly<Record<SectorKey, readonly [string, string]>> = {
  home: ["#ff7a59", "#2a1f5c"],
  about: ["#7da2ff", "#1c2a5c"],
  work: ["#ffcf5c", "#3b1f4d"],
  skills: ["#35d0a5", "#14304d"],
  journey: ["#c05cff", "#25204d"],
  contact: ["#ff5c8a", "#2a1a4d"],
};

/** Every artifact kind the engine must know how to build (T21). */
export const ARTIFACT_KINDS: readonly ArtifactKind[] = [
  "phone-pass",
  "qr-lattice",
  "tile-grid",
  "neural-graph",
  "module-globe",
];
