import { CatmullRomCurve3, Vector3, type PerspectiveCamera } from "three";
import { ATTR, sel } from "@lib/contract";
import {
  blendFromF,
  computeAnchors,
  curveParam,
  filmOffsetAt,
  locate,
  nearestStation,
  type StationBox,
} from "./rig-math";
import type { Station } from "./types";

const SMOOTHING = 4.2;
const SMOOTHING_INTRO = 14;
/** Parallax travel in camera-plane units for a pointer at the screen edge (x2 = full range). */
const PARALLAX_X = 2.4;
const PARALLAX_Y = 1.5;
const PARALLAX_SMOOTHING = 3;

interface Entry {
  key: string;
  el: HTMLElement;
  station: Station;
}

export interface Rig {
  /** `value` 0 → 1 blends from the fly-in pose to the computed one (T27). 1 = no intro. */
  intro: { value: number; from: Vector3; fromTarget: Vector3 };
  focus: { index: number; blend: number };
  /** Two or more stations exist; otherwise the camera stays in its initial pose. */
  readonly active: boolean;
  readonly stationCount: number;
  /** Station closest to the camera right now. */
  readonly activeIndex: number;
  readonly activeKey: string | null;
  stationAt(index: number): { key: string; station: Station } | undefined;
  elementAt(index: number): HTMLElement | undefined;
  /** Re-reads the `[data-station]` elements (new/removed/reordered) and measures them. */
  rebuild(): void;
  /** Re-measures the stations (layout changed). */
  measure(): void;
  /** Smooth path: call every frame. `parallax` is false on touch / reduced motion. */
  update(
    dt: number,
    scrollY: number,
    pointer: { x: number; y: number },
    parallax: boolean,
  ): void;
  /** Reduced motion: the station the scroll position belongs to (no interpolation). */
  nearestIndexAt(scrollY: number): number;
  /** Reduced motion: jump straight to a station. */
  snapTo(index: number): void;
}

/**
 * Scroll-driven camera. The DOM decides which stations exist and where they
 * sit in the page; `stationMap` (from the regions) decides where they sit in the
 * world. A `data-station` with no entry in the map is ignored. All per-frame
 * work reuses vectors (no allocations).
 */
export function createRig(
  camera: PerspectiveCamera,
  stationMap: Readonly<Record<string, Station>>,
): Rig {
  let entries: Entry[] = [];
  // Same order as `entries`; built once so the frame loop allocates nothing.
  let stationList: Station[] = [];
  let anchors: number[] = [];
  let curvePos: CatmullRomCurve3 | null = null;
  let curveLook: CatmullRomCurve3 | null = null;
  let initialized = false;
  let activeIndex = 0;

  const goalPos = new Vector3();
  const goalLook = new Vector3();
  const curPos = new Vector3();
  const curLook = new Vector3();
  const pos = new Vector3();
  const look = new Vector3();
  const right = new Vector3();
  const up = new Vector3();
  const smoothedPointer = { x: 0, y: 0 };

  const intro = { value: 1, from: new Vector3(0, 46, 320), fromTarget: new Vector3(0, 10, -60) };
  const focus = { index: 0, blend: 0 };

  const setFilm = (value: number) => {
    if (Math.abs(camera.filmOffset - value) > 1e-4) {
      camera.filmOffset = value;
      camera.updateProjectionMatrix();
    }
  };

  const rig: Rig = {
    intro,
    focus,
    get active() {
      return entries.length >= 2 && curvePos !== null;
    },
    get stationCount() {
      return entries.length;
    },
    get activeIndex() {
      return activeIndex;
    },
    get activeKey() {
      return entries[activeIndex]?.key ?? null;
    },
    stationAt: (index) => entries[index],
    elementAt: (index) => entries[index]?.el,

    rebuild() {
      entries = Array.from(
        document.querySelectorAll<HTMLElement>(sel(ATTR.station)),
      )
        .map((el) => ({ el, key: el.getAttribute(ATTR.station) ?? "", station: stationMap[el.getAttribute(ATTR.station) ?? ""] }))
        .filter((e): e is Entry => Boolean(e.station));
      // Document order is page order, but make it explicit.
      entries.sort(
        (a, b) =>
          a.el.getBoundingClientRect().top - b.el.getBoundingClientRect().top,
      );
      if (entries.length >= 2) {
        curvePos = new CatmullRomCurve3(
          entries.map((e) => e.station.position.clone()),
          false,
          "centripetal",
        );
        curveLook = new CatmullRomCurve3(
          entries.map((e) => e.station.target.clone()),
          false,
          "centripetal",
        );
      } else {
        curvePos = curveLook = null;
      }
      stationList = entries.map((e) => e.station);
      activeIndex = Math.min(activeIndex, Math.max(0, entries.length - 1));
      rig.measure();
    },

    measure() {
      const scrollY = window.scrollY;
      const boxes: StationBox[] = entries.map((e) => {
        const rect = e.el.getBoundingClientRect();
        return { top: rect.top + scrollY, height: rect.height };
      });
      anchors = computeAnchors(boxes, window.innerHeight);
    },

    update(dt, scrollY, pointer, parallax) {
      if (!curvePos || !curveLook) return;

      const { index, f } = locate(anchors, scrollY);
      const blend = blendFromF(f);
      focus.index = index;
      focus.blend = blend;
      activeIndex = nearestStation(index, blend, entries.length);

      const u = curveParam(index, blend, entries.length);
      curvePos.getPoint(u, goalPos);
      curveLook.getPoint(u, goalLook);

      if (!initialized) {
        curPos.copy(goalPos);
        curLook.copy(goalLook);
        initialized = true;
      } else {
        const k = 1 - Math.exp(-dt * (intro.value < 1 ? SMOOTHING_INTRO : SMOOTHING));
        curPos.lerp(goalPos, k);
        curLook.lerp(goalLook, k);
      }

      // Fly-in: blend the computed pose with the initial one.
      pos.copy(curPos);
      look.copy(curLook);
      if (intro.value < 1) {
        pos.copy(intro.from).lerp(curPos, intro.value);
        look.copy(intro.fromTarget).lerp(curLook, intro.value);
      }

      camera.position.copy(pos);
      camera.lookAt(look);

      // Pointer parallax: shift in the camera plane and re-aim (mouse only).
      if (parallax) {
        const pk = 1 - Math.exp(-dt * PARALLAX_SMOOTHING);
        smoothedPointer.x += (pointer.x - smoothedPointer.x) * pk;
        smoothedPointer.y += (pointer.y - smoothedPointer.y) * pk;
        camera.updateMatrixWorld();
        right.setFromMatrixColumn(camera.matrixWorld, 0);
        up.setFromMatrixColumn(camera.matrixWorld, 1);
        camera.position
          .addScaledVector(right, smoothedPointer.x * PARALLAX_X * 2)
          .addScaledVector(up, -smoothedPointer.y * PARALLAX_Y * 2);
        camera.lookAt(look);
      }

      setFilm(filmOffsetAt(index, blend, stationList, window.innerWidth));
    },

    nearestIndexAt(scrollY) {
      if (entries.length < 2) return 0;
      const { index, f } = locate(anchors, scrollY);
      return nearestStation(index, f, entries.length);
    },

    snapTo(index) {
      const entry = entries[Math.max(0, Math.min(index, entries.length - 1))];
      if (!entry) return;
      activeIndex = entries.indexOf(entry);
      focus.index = activeIndex;
      focus.blend = 0;
      curPos.copy(entry.station.position);
      curLook.copy(entry.station.target);
      initialized = true;
      camera.position.copy(curPos);
      camera.lookAt(curLook);
      setFilm(filmOffsetAt(activeIndex, 0, stationList, window.innerWidth));
    },
  };

  return rig;
}
