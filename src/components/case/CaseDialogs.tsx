"use client";

import { useEffect } from "react";
import { ATTR, parseCaseHash, sel } from "@lib/contract";
import { getFeaturedProjects } from "@data/index";
import { useUiStore } from "@stores/useUiStore";
import CaseDialog from "./CaseDialog";

const CASE_HASH = "#case-";

/**
 * One `<dialog>` per featured project plus the controller that opens them:
 * - the `[data-open-case="<id>"]` buttons (delegated click),
 * - the deep link `#case-<id>` (on load and on `hashchange`),
 * - the store action `openCase(id, opener?)` (used by the 3D picking in T25).
 */
export default function CaseDialogs() {
  const projects = getFeaturedProjects();
  const openId = useUiStore((s) => s.caseOpen);

  useEffect(() => {
    const ids = new Set(getFeaturedProjects().map((p) => p.id));
    const open = (id: string, opener?: HTMLElement | null) => {
      if (!ids.has(id)) return;
      useUiStore.getState().openCase(id, opener ?? null);
      // Shareable URL; replaceState adds no history entry.
      if (window.location.hash !== `${CASE_HASH}${id}`) {
        history.replaceState(null, "", `${CASE_HASH}${id}`);
      }
    };

    const onClick = (event: MouseEvent) => {
      const trigger = (event.target as Element | null)?.closest<HTMLElement>(
        sel(ATTR.openCase),
      );
      const id = trigger?.getAttribute(ATTR.openCase);
      if (!trigger || !id) return;
      event.preventDefault();
      open(id, trigger);
    };

    const fromHash = () => {
      const id = parseCaseHash(window.location.hash);
      if (id) open(id);
    };

    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", fromHash);
    // Deep link on load: wait a frame so the dialogs are mounted.
    const frame = window.requestAnimationFrame(fromHash);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", fromHash);
    };
  }, []);

  return (
    <>
      {projects.map((project) => (
        <CaseDialog key={project.id} project={project} isOpen={openId === project.id} />
      ))}
    </>
  );
}
