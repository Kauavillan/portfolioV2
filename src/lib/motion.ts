export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Runs `setup(reduced)` now and again every time the user's motion preference
 * changes, calling the previous cleanup first. Returns the final cleanup.
 * Client-only; call it from an effect (idempotent → StrictMode-safe).
 */
export function withMotionPreference(
  setup: (reduced: boolean) => void | (() => void),
): () => void {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  let cleanup = setup(mq.matches);
  const onChange = () => {
    cleanup?.();
    cleanup = setup(mq.matches);
  };
  mq.addEventListener("change", onChange);
  return () => {
    mq.removeEventListener("change", onChange);
    cleanup?.();
  };
}
