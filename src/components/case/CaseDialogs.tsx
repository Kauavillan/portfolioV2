"use client";

import { useEffect } from "react";
import { ATTR, parseCaseHash, sel } from "@lib/contract";
import { openCaseFile } from "@controllers/case-actions";
import { getFeaturedProjects } from "@data/index";
import { useUiStore } from "@stores/useUiStore";
import CaseDialog from "./CaseDialog";

/**
 * One `<dialog>` per featured project plus the controller that opens them:
 * - the `[data-open-case="<id>"]` buttons (delegated click),
 * - the deep link `#case-<id>` (on load and on `hashchange`),
 * - the 3D picking (T25), through the same `openCaseFile` action.
 */
export default function CaseDialogs() {
  const projects = getFeaturedProjects();
  const openId = useUiStore((s) => s.caseOpen);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const trigger = (event.target as Element | null)?.closest<HTMLElement>(
        sel(ATTR.openCase),
      );
      const id = trigger?.getAttribute(ATTR.openCase);
      if (!trigger || !id) return;
      event.preventDefault();
      openCaseFile(id, trigger);
    };

    const fromHash = () => {
      const id = parseCaseHash(window.location.hash);
      if (id) openCaseFile(id);
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
