// Public contracts of the world engine (ARCHITECTURE §6.1).
// Type-only imports from `three`: this file adds nothing to any bundle.

import type { PerspectiveCamera, Object3D, Vector3 } from "three";
import type { SectorKey, WorldData } from "@data/types";
import type { QualityName, QualityTier } from "./quality";

export type { QualityName, QualityTier };

/** One stop of the camera. Positions are world coordinates. */
export interface Station {
  position: Vector3;
  target: Vector3;
  /** Lateral film offset on desktop (negative pushes the scene to the right of the text). */
  offset: number;
  /** …below 900px (0 = centered). */
  offsetNarrow: number;
  /** Two hex colors that tint the sky while this station is in focus. */
  mood: readonly [string, string];
}

export interface StationEvent {
  index: number;
  /** The `data-station` value, e.g. `home`. */
  key: string;
  station: Station;
}

/** A scene of the world ("region"): owns its objects and its camera stations. */
export interface Region {
  group: Object3D;
  /** Key = `data-station` value. */
  stations: Record<string, Station>;
  /** Where its sound comes from (T28). */
  emitter: Vector3;
  /** `active` = one of this region's stations is the one in focus. */
  update(t: number, active: boolean, dt: number): void;
  setQuality?(tier: QualityTier): void;
  dispose(): void;
}

export interface WorldOptions extends WorldData {
  /** The `[data-world]` element; the canvas is created inside it. */
  container: HTMLElement;
  reduced: boolean;
  /** Aborting stops the boot between stages (React StrictMode / unmount during the await). */
  signal?: AbortSignal;
  onPick: (projectId: string) => void;
  onHover: (projectId: string) => void;
  /** Called every frame with the camera (audio listener, T28). */
  onFrame: (camera: PerspectiveCamera) => void;
  onStation: (event: StationEvent) => void;
  /** Debug/telemetry: the quality tier changed. */
  onQuality?: (tier: QualityName) => void;
}

export interface WorldHandle {
  rig: {
    /** 0 → 1 fly-in blend (T27). Starts at 1 (no intro). */
    intro: { value: number };
    focus: { index: number; blend: number };
  };
  readonly quality: QualityName;
  emitters: { key: SectorKey; position: Vector3 }[];
  /** Lights a skill star (`group:skill` or `group`) — T22. */
  lightSkill: (key: string, on: boolean) => void;
  /** Re-reads the DOM stations after a layout refresh. */
  refresh: () => void;
  dispose: () => void;
}
