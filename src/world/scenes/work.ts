import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  Group,
  Line,
  LineDashedMaterial,
  Vector3,
  type Camera,
  type Texture,
} from "three";
import type { WorldProject } from "@data/types";
import { SECTOR_MOODS } from "@data/world";
import { projectStation } from "@lib/contract";
import { ARTIFACTS, type Artifact } from "./artifacts";
import type { Station, WorkRegion } from "../types";
import { disposeObject } from "../util/dispose";
import { FADE_FLOOR, distanceFade, perFrameRate } from "../util/ease";
import { WORLD_SEED } from "../util/rng";
import { loadProjectTexture } from "../util/texture";

/** Hover scale is `1 + HOVER_SCALE · h`, `h` eased by `HOVER_EASE` per frame at 60 fps. */
const HOVER_SCALE = 0.05;
const HOVER_EASE = 0.12;
/** Camera displacement from an artifact's centre: the same head-on shot for every project. */
const CAMERA_OFFSET = new Vector3(-6, 3, 52);
/**
 * Artifacts dissolve with distance (full size within `FADE_NEAR`, gone beyond
 * `FADE_FAR`): the camera sees the one it is at, and the next one materializes as
 * it approaches, instead of five fogged silhouettes stacked down the corridor.
 */
const FADE_NEAR = 70;
const FADE_FAR = 135;

/**
 * Where project `i` floats: a line receding along −Z that wanders sideways and
 * up/down, so the camera flies a gentle slalom instead of a straight tunnel.
 */
export function projectCenter(i: number, out = new Vector3()): Vector3 {
  return out.set(48 + Math.sin(1.7 * i) * 14, -6 + Math.cos(1.3 * i) * 6, -300 - 80 * i);
}

interface WorkOptions {
  reduced: boolean;
  camera: Camera;
  projects: readonly WorldProject[];
  /** Max anisotropy the GPU offers (textures use a moderate share). */
  maxAnisotropy: number;
  /** Aborting stops texture loads that are still in flight. */
  signal?: AbortSignal;
  /** True once faded-out artifacts may be hidden (after the engine has compiled every shader). */
  cull: () => boolean;
  /** Something changed outside the frame loop (a texture arrived): reduced motion needs a redraw. */
  invalidate: () => void;
}

interface Entry {
  id: string;
  /** `project:<id>`: the `data-station` value of this project's article. */
  stationKey: string;
  artifact: Artifact;
  holder: Group;
  /** Hover amount, 0..1. */
  h: number;
}

/**
 * Work: one procedural artifact per featured project, strung along a dashed
 * line, with one camera station each (`project:<id>`) plus an entry station
 * (`work`) that looks down the corridor. Driven entirely by `projects`.
 */
export function createWorkRegion(options: WorkOptions): WorkRegion {
  const { reduced, projects } = options;
  const group = new Group();
  const entries: Entry[] = [];
  const stations: Record<string, Station> = {};
  const centers = projects.map((_, i) => projectCenter(i));
  let hoverId: string | null = null;
  let disposed = false;

  projects.forEach((project, i) => {
    const def = ARTIFACTS[project.artifact];
    const [a, b] = project.mood;
    const artifact = def.create({
      colors: { a: new Color(a), b: new Color(b) },
      reduced,
      seed: WORLD_SEED + i * 101,
    });
    const holder = new Group();
    holder.position.copy(centers[i]);
    holder.add(artifact.group);
    // Every object the picker can hit knows which project it belongs to.
    holder.traverse((object) => {
      object.userData.projectId = project.id;
    });
    group.add(holder);
    const stationKey = projectStation(project.id);
    entries.push({ id: project.id, stationKey, artifact, holder, h: 0 });

    stations[stationKey] = {
      position: centers[i].clone().add(CAMERA_OFFSET),
      target: centers[i].clone(),
      offset: -6,
      offsetNarrow: 0,
      mood: project.mood,
    };

    // The image arrives after the world is already up: it never blocks the boot.
    if (def.wantsTexture && project.image) {
      void loadProjectTexture(project.image, Math.min(4, options.maxAnisotropy), options.signal).then(
        (texture: Texture | null) => {
          if (!texture) return;
          if (disposed) {
            texture.dispose();
            return;
          }
          artifact.setTexture?.(texture);
          options.invalidate();
        },
      );
    }
  });

  // ── The dashed line through every centre ───────────────────────────────
  let line: Line | null = null;
  if (centers.length >= 2) {
    // A lead-in point behind the first artifact makes the line visible from the entry station.
    const lead = centers[0].clone().add(new Vector3(-4, 2, 90));
    const curve = new CatmullRomCurve3([lead, ...centers], false, "centripetal");
    line = new Line(
      new BufferGeometry().setFromPoints(curve.getPoints(40 * centers.length)),
      new LineDashedMaterial({
        color: new Color("#ffb35c"),
        dashSize: 1.2,
        gapSize: 2.4,
        transparent: true,
        opacity: 0.35,
      }),
    );
    line.computeLineDistances();
    group.add(line);
  }

  // The entry station: the corridor, with the first artifact far ahead.
  const first = centers[0] ?? new Vector3(48, -6, -300);
  stations.work = {
    position: first.clone().add(new Vector3(-10, 6, 80)),
    target: first.clone().add(new Vector3(0, -1, -20)),
    offset: -6,
    offsetNarrow: 0,
    mood: SECTOR_MOODS.work,
  };

  const middle = centers[Math.floor(centers.length / 2)] ?? first;
  const pickables = entries.map((e) => e.holder);

  return {
    group,
    stations,
    emitter: middle.clone(),
    projectEmitters: entries.map((e, i) => ({ id: e.id, position: centers[i].clone() })),
    pickables,

    setHover(id) {
      hoverId = id;
    },

    update(t, _active, dt, stationKey) {
      const k = reduced ? 1 : perFrameRate(HOVER_EASE, dt);
      for (const entry of entries) {
        entry.h += ((entry.id === hoverId ? 1 : 0) - entry.h) * k;
        const fade = distanceFade(
          options.camera.position.distanceTo(entry.holder.position),
          FADE_NEAR,
          FADE_FAR,
        );
        entry.holder.scale.setScalar(fade * (1 + HOVER_SCALE * entry.h));
        entry.holder.visible = !options.cull() || fade > FADE_FLOOR;
        // The artifact animates fully only while ITS station is the one in focus.
        entry.artifact.update(t, entry.stationKey === stationKey, dt);
      }
    },

    dispose() {
      disposed = true;
      for (const entry of entries) entry.artifact.dispose();
      disposeObject(group);
      group.clear();
    },
  };
}
