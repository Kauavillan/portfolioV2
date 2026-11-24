// Picking: hover and click/tap on the project objects, WITHOUT interfering with
// the HTML on top (F24). `.world` stays `pointer-events: none`, so every event
// is read from `window` and anything that is not empty page is ignored.

import { Matrix4, Raycaster, Vector2, type Camera, type Object3D } from "three";
import { ATTR, STATE, sel } from "@lib/contract";

/** Hover is resolved at most this often (ms): ≈ 12 raycasts per second. */
export const HOVER_THROTTLE_MS = 80;
/** A press that moves farther than this (px) is a scroll or a drag, not a tap. */
export const TAP_TOLERANCE_PX = 10;

/**
 * Clicks that land on these are never picks: text, controls and dialogs own
 * their own events, so the objects behind them are dead zones by design.
 */
export const PICK_IGNORE_SELECTOR = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  "label",
  "dialog",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "li",
  sel(ATTR.noPick),
].join(", ");

/** True when the event target is something the 3D must leave alone. */
export function isPickBlocked(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(PICK_IGNORE_SELECTOR) !== null;
}

/** `userData.projectId` of the first object hit (recursive), or `null`. */
export function pickProjectId(
  raycaster: Raycaster,
  pickables: readonly Object3D[],
): string | null {
  const hit = raycaster.intersectObjects(pickables as Object3D[], true)[0];
  const id = hit?.object.userData.projectId;
  return typeof id === "string" ? id : null;
}

export interface PickerOptions {
  camera: Camera;
  /** Its bounding box maps the pointer to NDC (the canvas fills it). */
  container: HTMLElement;
  pickables: readonly Object3D[];
  /** False while nothing should be pickable (e.g. the camera is not in the work region). */
  enabled: () => boolean;
  /** `pointer: fine`. Touch devices only get tap-to-open. */
  hover: boolean;
  /** No frame loop (reduced motion): hover resolves on a trailing timer instead of in `update`. */
  onDemand: boolean;
  /** The hovered project changed (`null` = left). */
  onHover: (id: string | null) => void;
  /** An object was clicked/tapped. */
  onPick: (id: string) => void;
}

export interface Picker {
  /** Call every frame (loop mode): resolves a pending hover when the throttle allows. */
  update(now: number): void;
  readonly hoverId: string | null;
  dispose(): void;
}

export function createPicker(options: PickerOptions): Picker {
  const { camera, container, pickables, onDemand } = options;
  const raycaster = new Raycaster();
  const ndc = new Vector2();
  const pointer = { x: 0, y: 0 };
  const down = { x: 0, y: 0, valid: false };
  const lastView = new Matrix4();
  let hasPointer = false;
  let hoverId: string | null = null;
  let dirty = false;
  let blocked = false;
  let lastPick = -Infinity;
  let timer = 0;
  let disposed = false;

  const pickAt = (clientX: number, clientY: number): string | null => {
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -(((clientY - rect.top) / rect.height) * 2 - 1));
    raycaster.setFromCamera(ndc, camera);
    return pickProjectId(raycaster, pickables);
  };

  const setHover = (next: string | null) => {
    if (next === hoverId) return;
    hoverId = next;
    document.documentElement.classList.toggle(STATE.worldHover, next !== null);
    options.onHover(next);
  };

  /** Resolves the hover now (the caller has already checked the throttle). */
  const resolve = (now: number) => {
    dirty = false;
    lastPick = now;
    setHover(!blocked && options.enabled() ? pickAt(pointer.x, pointer.y) : null);
  };

  const onMove = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    hasPointer = true;
    blocked = isPickBlocked(event.target);
    dirty = true;
    if (onDemand && !timer) {
      const wait = Math.max(0, HOVER_THROTTLE_MS - (performance.now() - lastPick));
      timer = window.setTimeout(() => {
        timer = 0;
        if (!disposed && dirty) resolve(performance.now());
      }, wait);
    }
  };

  // The pointer left the window: nothing is hovered any more.
  const onLeave = (event: PointerEvent) => {
    if (event.relatedTarget === null) {
      dirty = false;
      setHover(null);
    }
  };

  const onDown = (event: PointerEvent) => {
    down.x = event.clientX;
    down.y = event.clientY;
    down.valid = true;
  };

  const onClick = (event: MouseEvent) => {
    // `detail === 0`: a keyboard "click" on a focused control, never a pointer pick.
    if (event.detail === 0 || event.defaultPrevented) return;
    if (isPickBlocked(event.target) || !options.enabled()) return;
    // A press that travelled is a scroll or a drag, not a tap.
    if (down.valid && Math.hypot(event.clientX - down.x, event.clientY - down.y) > TAP_TOLERANCE_PX) return;
    const id = pickAt(event.clientX, event.clientY);
    if (id) options.onPick(id);
  };

  window.addEventListener("pointerdown", onDown, { passive: true });
  window.addEventListener("click", onClick);
  if (options.hover) {
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerout", onLeave);
  }

  return {
    update(now) {
      if (onDemand) return;
      // The camera flying past a resting pointer changes what is under it.
      if (hasPointer && !lastView.equals(camera.matrixWorld)) {
        lastView.copy(camera.matrixWorld);
        dirty = true;
      }
      if (!dirty || now - lastPick < HOVER_THROTTLE_MS) return;
      resolve(now);
    },
    get hoverId() {
      return hoverId;
    },
    dispose() {
      disposed = true;
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("click", onClick);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onLeave);
      document.documentElement.classList.remove(STATE.worldHover);
      hoverId = null;
    },
  };
}
