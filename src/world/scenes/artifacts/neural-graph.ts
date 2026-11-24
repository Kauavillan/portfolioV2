import {
  AdditiveBlending,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { createRng } from "../../util/rng";
import { disposeObject } from "../../util/dispose";
import { approach } from "../../util/ease";
import { createHitProxy, type Artifact, type ArtifactDef, type ArtifactOptions } from "./types";

const NODES = 26;
const RADIUS = 7.4;
const NEIGHBOURS = 2;
const PULSES = 11;
/** Seconds one pulse takes to cross an edge. */
const PULSE_SECONDS = 1.7;

/** Points of a question mark, in a box ≈ 3 wide and 5.6 tall, centred on the origin. */
function questionMarkPath(): Vector3[] {
  const points: Vector3[] = [];
  const cx = 0;
  const cy = 1.15;
  const r = 1.35;
  // Hook: a three-quarter arc, from the left of the top over to the right side.
  for (let i = 0; i <= 10; i++) {
    const angle = Math.PI * (0.88 - (i / 10) * 1.55);
    points.push(new Vector3(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r + 0.35, 0));
  }
  // Stem: a short curve down to the dot.
  points.push(new Vector3(0.55, 0.62, 0), new Vector3(0.05, -0.1, 0), new Vector3(0, -0.95, 0));
  return points;
}

/**
 * DeepQuiz: a small neural graph (nodes on a sphere, linked to their nearest
 * neighbours, with light pulses running along the links) around a luminous
 * question mark that stays facing the camera.
 */
function create({ colors, reduced, seed }: ArtifactOptions): Artifact {
  const rng = createRng(seed + 31);
  const group = new Group();
  const cloud = new Group();
  const mark = new Group();
  group.add(cloud, mark);

  // ── Nodes on a Fibonacci sphere ────────────────────────────────────────
  const positions: Vector3[] = [];
  for (let i = 0; i < NODES; i++) {
    const y = 1 - (i / (NODES - 1)) * 2;
    const ring = Math.sqrt(1 - y * y);
    const angle = i * 2.399963;
    const jitter = 0.86 + rng() * 0.28;
    positions.push(
      new Vector3(Math.cos(angle) * ring, y, Math.sin(angle) * ring).multiplyScalar(RADIUS * jitter),
    );
  }

  const nodeMesh = new InstancedMesh(
    new SphereGeometry(0.4, 14, 10),
    new MeshBasicMaterial({ color: new Color("#ffffff") }),
    NODES,
  );
  const dummy = new Object3D();
  const tint = new Color();
  positions.forEach((p, i) => {
    dummy.position.copy(p);
    dummy.scale.setScalar(0.7 + rng() * 0.9);
    dummy.updateMatrix();
    nodeMesh.setMatrixAt(i, dummy.matrix);
    nodeMesh.setColorAt(i, tint.copy(colors.a).lerp(colors.b, (p.y / RADIUS + 1) / 2).multiplyScalar(1.4));
  });
  nodeMesh.instanceMatrix.needsUpdate = true;
  if (nodeMesh.instanceColor) nodeMesh.instanceColor.needsUpdate = true;
  cloud.add(nodeMesh);

  // ── Edges: each node to its nearest neighbours ─────────────────────────
  const edges: [number, number][] = [];
  const seen = new Set<number>();
  positions.forEach((p, i) => {
    const nearest = positions
      .map((q, j) => ({ j, d: i === j ? Infinity : p.distanceToSquared(q) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, NEIGHBOURS);
    for (const { j } of nearest) {
      const key = Math.min(i, j) * NODES + Math.max(i, j);
      if (!seen.has(key)) {
        seen.add(key);
        edges.push([i, j]);
      }
    }
  });
  const edgeBuffer: number[] = [];
  for (const [a, b] of edges) edgeBuffer.push(...positions[a].toArray(), ...positions[b].toArray());
  const edgeGeometry = new BufferGeometry();
  edgeGeometry.setAttribute("position", new Float32BufferAttribute(edgeBuffer, 3));
  cloud.add(
    new LineSegments(
      edgeGeometry,
      new LineBasicMaterial({
        color: colors.b.clone().lerp(new Color("#ffffff"), 0.35),
        transparent: true,
        opacity: 0.38,
      }),
    ),
  );

  // ── Pulses running along random edges ──────────────────────────────────
  const pulseMesh = new InstancedMesh(
    new SphereGeometry(0.24, 10, 8),
    new MeshBasicMaterial({
      color: colors.a.clone().lerp(new Color("#ffffff"), 0.55),
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
    PULSES,
  );
  cloud.add(pulseMesh);
  const pulses = Array.from({ length: PULSES }, (_, i) => ({
    edge: Math.floor(rng() * edges.length),
    age: (i / PULSES) * PULSE_SECONDS,
  }));
  const here = new Vector3();
  const placePulses = (dt: number) => {
    for (let i = 0; i < PULSES; i++) {
      const pulse = pulses[i];
      pulse.age += dt;
      if (pulse.age > PULSE_SECONDS) {
        pulse.age -= PULSE_SECONDS;
        pulse.edge = Math.floor(rng() * edges.length);
      }
      const edge = edges[pulse.edge];
      const u = pulse.age / PULSE_SECONDS;
      here.lerpVectors(positions[edge[0]], positions[edge[1]], u);
      dummy.position.copy(here);
      dummy.scale.setScalar(Math.sin(u * Math.PI) * 1.2 + 0.2);
      dummy.updateMatrix();
      pulseMesh.setMatrixAt(i, dummy.matrix);
    }
    pulseMesh.instanceMatrix.needsUpdate = true;
  };
  placePulses(0);

  // ── The question mark ──────────────────────────────────────────────────
  const markMaterial = new MeshStandardMaterial({
    color: colors.a.clone(),
    emissive: colors.a.clone(),
    emissiveIntensity: 0.7,
    metalness: 0.2,
    roughness: 0.35,
  });
  const hook = new Mesh(
    new TubeGeometry(new CatmullRomCurve3(questionMarkPath()), 72, 0.34, 12, false),
    markMaterial,
  );
  const dot = new Mesh(new SphereGeometry(0.42, 20, 14), markMaterial);
  dot.position.set(0, -1.95, 0);
  hook.position.y = 0.2;
  mark.add(hook, dot);
  mark.scale.setScalar(1.15);

  const halo = new Mesh(
    new TorusGeometry(RADIUS + 1.4, 0.04, 6, 140),
    new MeshBasicMaterial({
      color: colors.b.clone(),
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
      opacity: 0.6,
    }),
  );
  halo.rotation.x = 1.25;
  group.add(halo);

  group.add(createHitProxy(8.2));

  let energy = 0;
  const pose = (t: number) => {
    cloud.rotation.y = 0.4 + t * (0.1 + 0.08 * energy);
    cloud.rotation.x = Math.sin(t * 0.2) * 0.12;
    mark.rotation.y = Math.sin(t * 0.5) * 0.28;
    mark.position.y = Math.sin(t * 0.7) * 0.2;
    markMaterial.emissiveIntensity = 0.45 + energy * 0.55;
    halo.rotation.z = t * 0.15;
  };
  pose(0);

  return {
    group,

    update(t, active, dt) {
      energy = approach(energy, active ? 1 : 0, 2, dt, reduced);
      pose(t);
      if (!reduced) placePulses(dt * (0.6 + energy * 0.8));
    },

    dispose() {
      disposeObject(group);
      group.clear();
    },
  };
}

export const neuralGraph: ArtifactDef = { create };
