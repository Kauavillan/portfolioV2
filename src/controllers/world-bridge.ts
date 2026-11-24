import { useUiStore } from "@stores/useUiStore";
import type { WorldHandle } from "@world/types";

/**
 * Where the live world handle is parked so other controllers (the intro) can
 * reach it without importing the engine. `WorldCanvas` writes it *before* it
 * sets `worldStatus` to `ready`, so a `ready` status always has a handle.
 */
let current: WorldHandle | null = null;

export const setWorldHandle = (handle: WorldHandle | null): void => {
  current = handle;
};

export const getWorldHandle = (): WorldHandle | null => current;

/**
 * Resolves with the world handle once it is ready, or `null` when there is no
 * world (WebGL missing, kill switch, boot failure) or `timeoutMs` passes first.
 * Aborting resolves `null` at once. Never rejects.
 */
export function waitForWorld(timeoutMs: number, signal: AbortSignal): Promise<WorldHandle | null> {
  return new Promise((resolve) => {
    let timer = 0;
    let unsubscribe = () => {};

    const settle = (handle: WorldHandle | null) => {
      window.clearTimeout(timer);
      unsubscribe();
      signal.removeEventListener("abort", onAbort);
      resolve(handle);
    };
    const onAbort = () => settle(null);
    const check = () => {
      const { worldStatus } = useUiStore.getState();
      if (worldStatus === "unavailable") settle(null);
      else if (worldStatus === "ready" && current) settle(current);
    };

    if (signal.aborted) return settle(null);
    signal.addEventListener("abort", onAbort);
    timer = window.setTimeout(() => settle(null), timeoutMs);
    unsubscribe = useUiStore.subscribe(check);
    check();
  });
}
