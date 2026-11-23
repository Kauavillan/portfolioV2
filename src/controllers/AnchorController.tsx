"use client";

import { useEffect } from "react";
import { parseCaseHash } from "@lib/contract";
import { useUiStore } from "@stores/useUiStore";
import { useScroll } from "./ScrollProvider";

/**
 * In-page anchors (F05). One delegated listener for every `a[href^="#"]`:
 * scrolls with the shared scroll layer, then moves focus to the target and
 * updates the hash. The mobile menu is closed first (synchronously, so its
 * scroll lock is already released when the scroll starts).
 *
 * `#case-<id>` links are left alone: <CaseDialogs/> opens those.
 */
export default function AnchorController() {
  const { to } = useScroll();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>(
        'a[href^="#"]',
      );
      if (!link) return;

      const href = link.getAttribute("href") ?? "";
      if (href.length < 2 || parseCaseHash(href)) return;
      const target = document.getElementById(decodeURIComponent(href.slice(1)));
      if (!target) return;

      event.preventDefault();
      useUiStore.getState().setNavOpen(false);
      to(target, {
        onComplete: () => {
          if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
          history.replaceState(null, "", href);
        },
      });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [to]);

  return null;
}
