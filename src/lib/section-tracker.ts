import { ATTR, sel } from "./contract";
import { computeActiveIndex, computeProgress } from "./active-section";

/**
 * Single scroll tracker shared by the nav rail and the locator, so both always
 * agree on the active section (one rule: ../active-section.ts).
 *
 * - Reads `[data-section]` (+ `data-label` / `data-sector`) from the DOM, so
 *   translated text needs no extra plumbing.
 * - Work happens in at most one `requestAnimationFrame` per frame; React is only
 *   notified when the visible section changes. Scroll progress is delivered
 *   imperatively (`subscribeProgress`) so the bar never re-renders React.
 * - Starts on the first subscriber and stops (listeners removed) on the last.
 */

export interface ActiveSection {
  id: string;
  index: number;
  label: string;
  sector: string;
  total: number;
}

export const NO_SECTION: ActiveSection = {
  id: "",
  index: 0,
  label: "",
  sector: "",
  total: 0,
};

let snapshot: ActiveSection = NO_SECTION;
let progress = 0;
let sections: HTMLElement[] = [];
let frame = 0;
let subscribers = 0;

const sectionListeners = new Set<() => void>();
const progressListeners = new Set<(value: number) => void>();

const same = (a: ActiveSection, b: ActiveSection) =>
  a.id === b.id &&
  a.index === b.index &&
  a.label === b.label &&
  a.sector === b.sector &&
  a.total === b.total;

function collect() {
  sections = Array.from(document.querySelectorAll<HTMLElement>(sel(ATTR.section)));
}

function measure() {
  frame = 0;
  if (sections.length === 0 || sections.some((el) => !el.isConnected)) collect();

  const viewport = window.innerHeight;
  const tops = sections.map((el) => el.getBoundingClientRect().top);
  const index = computeActiveIndex(tops, viewport);
  const el = sections[index];
  const next: ActiveSection = el
    ? {
        id: el.id,
        index,
        label: el.getAttribute(ATTR.label) ?? "",
        sector: el.getAttribute(ATTR.sector) ?? "",
        total: sections.length,
      }
    : NO_SECTION;
  if (!same(next, snapshot)) {
    snapshot = next;
    sectionListeners.forEach((listener) => listener());
  }

  const nextProgress = computeProgress(
    window.scrollY,
    document.documentElement.scrollHeight,
    viewport,
  );
  if (nextProgress !== progress) {
    progress = nextProgress;
    progressListeners.forEach((listener) => listener(progress));
  }
}

function schedule() {
  if (!frame) frame = window.requestAnimationFrame(measure);
}

/** Forces a re-read of the sections and a fresh measurement (after layout changes). */
export function invalidateSections() {
  sections = [];
  if (subscribers > 0) schedule();
}

function retain() {
  if (subscribers++ === 0) {
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
  }
  schedule();
}

function release() {
  if (--subscribers === 0) {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
  }
}

export function subscribeSection(listener: () => void): () => void {
  sectionListeners.add(listener);
  retain();
  return () => {
    sectionListeners.delete(listener);
    release();
  };
}

export function getSectionSnapshot(): ActiveSection {
  return snapshot;
}

/** Calls `listener` with the current progress now and on every change. */
export function subscribeProgress(listener: (value: number) => void): () => void {
  progressListeners.add(listener);
  retain();
  listener(progress);
  return () => {
    progressListeners.delete(listener);
    release();
  };
}
