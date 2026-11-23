"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useScroll } from "@controllers/ScrollProvider";
import {
  NO_SECTION,
  getSectionSnapshot,
  invalidateSections,
  subscribeSection,
  type ActiveSection,
} from "@lib/section-tracker";

/**
 * The section currently "active" (last one whose top ≤ 45% of the viewport).
 * Re-renders only when the section (or its translated label/sector) changes —
 * never per scroll pixel. Scroll progress is exposed separately through
 * `subscribeProgress` (see Locator) so the progress bar needs no React state.
 */
export function useActiveSection(): ActiveSection {
  const { onLayout } = useScroll();

  // After a layout refresh (fonts, resize, body height) positions may have moved.
  useEffect(() => onLayout(invalidateSections), [onLayout]);

  return useSyncExternalStore(
    subscribeSection,
    getSectionSnapshot,
    () => NO_SECTION,
  );
}
