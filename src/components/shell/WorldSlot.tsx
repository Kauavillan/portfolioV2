import { ATTR, attr } from "@lib/contract";

/**
 * Container the 3D world mounts into (T15), plus the scrim that keeps text
 * legible. With no engine (or no WebGL) the container's CSS background — two
 * radial glows and star dots — IS the background. Purely decorative: hidden
 * from assistive tech and never intercepts pointer events.
 */
export default function WorldSlot() {
  return (
    <>
      <div className="world" {...attr(ATTR.world)} aria-hidden="true" />
      <div className="scrim" aria-hidden="true" />
    </>
  );
}
