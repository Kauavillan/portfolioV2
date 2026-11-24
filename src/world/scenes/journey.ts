import {
  CatmullRomCurve3,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PointLight,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { SECTOR_MOODS } from "@data/world";
import type { QualityTier } from "../quality";
import type { Region, Station } from "../types";
import { disposeObject } from "../util/dispose";
import { approach } from "../util/ease";

const CENTER = new Vector3(-6, 14, -885);
const TURNS = 1.6;
const RADIUS = 12;
const HEIGHT = 30;
const CURVE_POINTS = 64;
const TUBE_SEGMENTS = 240;
const TUBE_RADIUS = 0.07;
/** Comet speed in loops per second (idle / while the section is in focus). */
const SPEED_IDLE = 0.03;
const SPEED_ACTIVE = 0.07;
const SPEED_RATE = 1.4;
/** A node swells up to this much when the comet is on it, within `REACH` of the curve. */
const NODE_GROWTH = 0.6;
const NODE_REACH = 0.07;
/** Where the first and last node sit along the curve (keeps them off the very ends). */
const NODE_START = 0.05;
const NODE_END = 0.95;

interface Node {
  group: Group;
  ring: Mesh;
  u: number;
}

/**
 * Journey: the career path as a luminous helix. One node per milestone
 * (`milestoneCount`, never text) and a comet that runs along the curve, faster
 * while the section is in focus; nodes swell as it passes.
 */
export function createJourneyRegion(options: { reduced: boolean; milestoneCount: number }): Region {
  const { reduced } = options;
  const count = Math.max(1, Math.floor(options.milestoneCount));
  const group = new Group();
  group.position.copy(CENTER);
  group.rotation.z = 0.28; // lean the helix so it reads diagonally
  const spin = new Group();
  group.add(spin);

  // ── The helix, built once ──────────────────────────────────────────────
  const points: Vector3[] = [];
  for (let i = 0; i < CURVE_POINTS; i++) {
    const f = i / (CURVE_POINTS - 1);
    const angle = f * TURNS * Math.PI * 2;
    points.push(new Vector3(Math.cos(angle) * RADIUS, (f - 0.5) * HEIGHT, Math.sin(angle) * RADIUS));
  }
  const curve = new CatmullRomCurve3(points, false, "catmullrom");
  spin.add(
    new Mesh(
      new TubeGeometry(curve, TUBE_SEGMENTS, TUBE_RADIUS, 6, false),
      new MeshBasicMaterial({
        color: new Color("#c9a0ff"),
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    ),
  );

  // ── Nodes: ring + sphere, the last one in the cool accent ──────────────
  const ringGeometry = new TorusGeometry(0.95, 0.07, 10, 40);
  const sphereGeometry = new SphereGeometry(0.36, 18, 14);
  const warmSphere = new MeshStandardMaterial({
    color: new Color("#ffe2b0"),
    emissive: new Color("#ffb35c"),
    emissiveIntensity: 0.7,
    metalness: 0.2,
    roughness: 0.4,
  });
  const coolSphere = new MeshStandardMaterial({
    color: new Color("#bff3ff"),
    emissive: new Color("#4fd8ff"),
    emissiveIntensity: 0.9,
    metalness: 0.2,
    roughness: 0.4,
  });
  const warmRing = new MeshBasicMaterial({ color: new Color("#d8b8ff") });
  const coolRing = new MeshBasicMaterial({ color: new Color("#7fe6ff") });

  const nodes: Node[] = [];
  for (let k = 0; k < count; k++) {
    const last = k === count - 1;
    const u = count === 1 ? 0.5 : NODE_START + (NODE_END - NODE_START) * (k / (count - 1));
    const node = new Group();
    const ring = new Mesh(ringGeometry, last ? coolRing : warmRing);
    node.add(ring, new Mesh(sphereGeometry, last ? coolSphere : warmSphere));
    curve.getPoint(u, node.position);
    spin.add(node);
    nodes.push({ group: node, ring, u });
  }

  // ── Comet ──────────────────────────────────────────────────────────────
  const comet = new Group();
  comet.add(
    new Mesh(
      new SphereGeometry(0.62, 20, 14),
      new MeshBasicMaterial({ color: new Color("#fff1d6") }),
    ),
    new Mesh(
      new SphereGeometry(1.15, 16, 12),
      new MeshBasicMaterial({
        color: new Color("#ffb35c"),
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
      }),
    ),
  );
  const light = new PointLight(new Color("#ffcf8a"), 520, 40, 2);
  comet.add(light);
  spin.add(comet);

  const station: Station = {
    position: CENTER.clone().add(new Vector3(0, 2, 66)),
    target: CENTER.clone(),
    offset: -6,
    offsetNarrow: 0,
    mood: SECTOR_MOODS.journey,
  };

  let phase = 0.32;
  let speed = SPEED_IDLE;

  const frame = (t: number, dt: number) => {
    const u = phase % 1;
    curve.getPoint(u, comet.position); // writes into the position: no allocation
    for (const node of nodes) {
      const near = Math.max(0, 1 - Math.abs(u - node.u) / NODE_REACH);
      node.group.scale.setScalar(1 + NODE_GROWTH * near * near * (3 - 2 * near));
      node.ring.rotation.x += dt * (0.5 + near * 2.2);
      node.ring.rotation.y += dt * 0.35;
    }
    spin.rotation.y = t * 0.06;
  };
  frame(0, 0);

  return {
    group,
    stations: { journey: station },
    emitter: CENTER.clone(),
    fade: { near: 100, far: 150, cull: false }, // owns the comet's PointLight

    update(t, active, dt) {
      if (!reduced) {
        speed = approach(speed, active ? SPEED_ACTIVE : SPEED_IDLE, SPEED_RATE, dt);
        phase += speed * dt;
      }
      frame(t, dt);
    },

    setQuality(tier: QualityTier) {
      // The comet's light is the first thing to go on the weakest tier.
      light.visible = tier.name !== "low";
    },

    dispose() {
      disposeObject(group);
      group.clear();
    },
  };
}
