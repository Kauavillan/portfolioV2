/**
 * Single source of truth for the contract between the server-rendered markup
 * and the client controllers (see `.claude/docs/ARCHITECTURE.md` §4).
 *
 * Never invent a `data-*` attribute or a state class outside this file.
 * This module is dependency-free, so it is safe to import from Server
 * Components, client controllers and (later) the world engine.
 */

/** `data-*` attributes. */
export const ATTR = {
  // Sections / stations
  section: "data-section",
  label: "data-label",
  sector: "data-sector",
  /** `home | about | work | project:<id> | skills | journey | contact` */
  station: "data-station",

  // Reveal on scroll
  reveal: "data-reveal",
  revealScope: "data-reveal-scope",

  // Home / intro
  heroCh: "data-hero-ch",
  intro: "data-intro",
  introLine: "data-intro-line",
  introStatus: "data-intro-status",
  introSkip: "data-intro-skip",

  // HUD
  nav: "data-nav",
  menuToggle: "data-menu-toggle",

  // Case files
  openCase: "data-open-case",
  case: "data-case",
  caseClose: "data-case-close",

  // Skills (hover lights up the 3D star)
  skill: "data-skill",
  /** `shipped | stated` */
  evidence: "data-evidence",
  skillGroup: "data-skill-group",

  // World / sound / scroll / picking
  world: "data-world",
  sound: "data-sound",
  soundToggle: "data-sound-toggle",
  soundSettings: "data-sound-settings",
  soundPanel: "data-sound-panel",
  soundVolume: "data-sound-volume",
  soundAmbient: "data-sound-ambient",
  soundInteraction: "data-sound-interaction",
  lenisPrevent: "data-lenis-prevent",
  noPick: "data-no-pick",
} as const;

export type AttrName = (typeof ATTR)[keyof typeof ATTR];

/** State classes. On `<html>` unless noted. */
export const STATE = {
  lenis: "lenis",
  /** Motion is allowed: `[data-reveal]` starts hidden. Added before hydration. */
  motion: "motion",
  isIntro: "is-intro",
  navOpen: "nav-open",
  worldHover: "world-hover",
  noWebgl: "no-webgl",
  /** Page scroll is locked (counted locks: intro, mobile menu, dialog). */
  scrollLocked: "scroll-locked",
  /** The reveal controller took over; disables the CSS failsafe. */
  revealReady: "reveal-ready",
  /** On a skill chip: lit by hover/focus or by the 3D world (T22). */
  isLit: "is-lit",
  // On `.world`
  isReady: "is-ready",
  isCut: "is-cut",
} as const;

/** The six navigable sections, in page order. They are also the sector keys. */
export const SECTION_IDS = [
  "home",
  "about",
  "work",
  "skills",
  "journey",
  "contact",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

/** The only layout breakpoint (px). Keep in sync with `$bp-desktop` in `_mixins.scss`. */
export const BREAKPOINT_DESKTOP = 900;

/**
 * Spreadable attribute: `<div {...attr(ATTR.world)} />` → `data-world=""`.
 * Keeps the markup bound to the contract constants instead of string literals.
 */
export function attr<N extends AttrName>(
  name: N,
  value: string | number = "",
): { [K in N]: string } {
  return { [name]: String(value) } as { [K in N]: string };
}

/** Builds an attribute selector: `sel(ATTR.nav)` → `[data-nav]`, `sel(ATTR.case, "x")` → `[data-case="x"]`. */
export function sel(attr: AttrName, value?: string): string {
  if (value === undefined) return `[${attr}]`;
  return `[${attr}="${value.replace(/["\\]/g, "\\$&")}"]`;
}

/** Station key of a project article: `project:<id>`. */
export function projectStation(id: string): string {
  return `project:${id}`;
}

/** DOM id of the article of a project, and of the title of its case file. */
export const projectArticleId = (id: string) => `project-${id}`;
export const caseTitleId = (id: string) => `case-${id}`;

/** URL hash that deep-links a case file. */
export const CASE_HASH_PREFIX = "#case-";
export function parseCaseHash(hash: string): string | null {
  return hash.startsWith(CASE_HASH_PREFIX) && hash.length > CASE_HASH_PREFIX.length
    ? decodeURIComponent(hash.slice(CASE_HASH_PREFIX.length))
    : null;
}
