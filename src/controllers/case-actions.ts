import { CASE_HASH_PREFIX } from "@lib/contract";
import { getFeaturedProjects } from "@data/index";
import { useUiStore } from "@stores/useUiStore";

/**
 * Opens a project's case file (the `<dialog>` reacts to the store) and writes
 * the shareable `#case-<id>` hash. `replaceState` adds no history entry.
 * Shared by the "Open case" buttons, the deep link and the 3D picking. Unknown
 * ids are ignored.
 */
export function openCaseFile(id: string, opener?: HTMLElement | null): void {
  if (!getFeaturedProjects().some((project) => project.id === id)) return;
  useUiStore.getState().openCase(id, opener ?? null);
  if (window.location.hash !== `${CASE_HASH_PREFIX}${id}`) {
    history.replaceState(null, "", `${CASE_HASH_PREFIX}${id}`);
  }
}
