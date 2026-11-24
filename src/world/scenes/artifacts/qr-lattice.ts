import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  EdgesGeometry,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  TorusGeometry,
} from "three";
import { createRng } from "../../util/rng";
import { disposeObject } from "../../util/dispose";
import { approach } from "../../util/ease";
import { createHitProxy, type Artifact, type ArtifactDef, type ArtifactOptions } from "./types";

/** A "version 1" QR code is 21 × 21 modules. */
const N = 21;
const CELL = 0.56;
const BASE_HEIGHT = 0.42;
const WAVE_HEIGHT = 1.1;
/** Modules inside this radius (in cells) are left empty for the padlock. */
const LOCK_CLEARANCE = 3;

type ModuleKind = "finder" | "timing" | "data";

interface Module {
  x: number;
  y: number;
  kind: ModuleKind;
}

/** Finder patterns in three corners, timing lines, seeded data everywhere else. */
function buildModules(rng: () => number): Module[] {
  const out: Module[] = [];
  const centre = (N - 1) / 2;
  const finder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const ring = x === 0 || x === 6 || y === 0 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        if (ring || core) out.push({ x: ox + x, y: oy + y, kind: "finder" });
      }
    }
  };
  finder(0, 0);
  finder(N - 7, 0);
  finder(0, N - 7);

  const reserved = (x: number, y: number) =>
    (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);

  for (let i = 8; i < N - 8; i += 2) {
    out.push({ x: i, y: 6, kind: "timing" });
    out.push({ x: 6, y: i, kind: "timing" });
  }
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (reserved(x, y) || x === 6 || y === 6) continue;
      if (Math.hypot(x - centre, y - centre) <= LOCK_CLEARANCE) continue;
      if (rng() < 0.47) out.push({ x, y, kind: "data" });
    }
  }
  return out;
}

/**
 * QRypt: a lattice of extruded QR modules that ripples outwards from a
 * glowing padlock, circled by two thin rings. One instanced draw call for all modules.
 */
function create({ colors, reduced, seed }: ArtifactOptions): Artifact {
  const rng = createRng(seed);
  const modules = buildModules(rng);
  const group = new Group();
  const tilt = new Group();
  group.add(tilt);

  // ── Modules ────────────────────────────────────────────────────────────
  const cubes = new InstancedMesh(
    new BoxGeometry(1, 1, 1),
    new MeshStandardMaterial({ color: new Color("#ffffff"), metalness: 0.25, roughness: 0.5 }),
    modules.length,
  );
  const palette: Record<ModuleKind, Color> = {
    finder: colors.a.clone().lerp(new Color("#ffffff"), 0.25),
    timing: colors.b.clone().lerp(new Color("#ffffff"), 0.1),
    data: new Color("#c9d3ff"),
  };
  const tint = new Color();
  modules.forEach((m, i) => {
    tint.copy(palette[m.kind]).multiplyScalar(m.kind === "data" ? 0.55 + rng() * 0.45 : 1);
    cubes.setColorAt(i, tint);
  });
  if (cubes.instanceColor) cubes.instanceColor.needsUpdate = true;
  tilt.add(cubes);

  const half = (N - 1) / 2;
  const dummy = new Object3D();
  const place = (t: number, energy: number) => {
    for (let i = 0; i < modules.length; i++) {
      const m = modules[i];
      const dx = m.x - half;
      const dy = m.y - half;
      const wave = 0.5 + 0.5 * Math.sin(Math.hypot(dx, dy) * 0.85 - t * 2.1);
      const height = BASE_HEIGHT + wave * WAVE_HEIGHT * energy * (m.kind === "finder" ? 0.35 : 1);
      dummy.position.set(dx * CELL, -dy * CELL, height / 2);
      dummy.scale.set(CELL * 0.86, CELL * 0.86, height);
      dummy.updateMatrix();
      cubes.setMatrixAt(i, dummy.matrix);
    }
    cubes.instanceMatrix.needsUpdate = true;
  };

  // ── Backing plate and frame ────────────────────────────────────────────
  const size = N * CELL + 1.1;
  const plateGeometry = new BoxGeometry(size, size, 0.3);
  const plate = new Mesh(
    plateGeometry,
    new MeshStandardMaterial({ color: new Color("#0b1030"), metalness: 0.6, roughness: 0.35 }),
  );
  plate.position.z = -0.2;
  tilt.add(plate);
  const frame = new LineSegments(
    new EdgesGeometry(new BoxGeometry(size + 0.5, size + 0.5, 0.5)),
    new LineBasicMaterial({ color: colors.b.clone().lerp(new Color("#ffffff"), 0.3), transparent: true, opacity: 0.7 }),
  );
  frame.position.z = -0.2;
  tilt.add(frame);

  // ── Padlock ────────────────────────────────────────────────────────────
  const lockMaterial = new MeshStandardMaterial({
    color: colors.a.clone(),
    emissive: colors.a.clone(),
    emissiveIntensity: 0.55,
    metalness: 0.4,
    roughness: 0.3,
  });
  const lock = new Group();
  lock.add(new Mesh(new BoxGeometry(2.3, 1.7, 1), lockMaterial));
  const shackle = new Mesh(new TorusGeometry(0.62, 0.17, 12, 28, Math.PI), lockMaterial);
  shackle.position.y = 0.85;
  lock.add(shackle);
  const keyhole = new Mesh(new BoxGeometry(0.28, 0.6, 0.1), new MeshBasicMaterial({ color: new Color("#05060f") }));
  keyhole.position.z = 0.52;
  lock.add(keyhole);
  lock.position.set(0, -0.2, 1.3);
  tilt.add(lock);

  // ── Orbit rings ────────────────────────────────────────────────────────
  const ringMaterial = new MeshBasicMaterial({
    color: colors.a.clone().lerp(colors.b, 0.5),
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
    opacity: 0.75,
  });
  const ringGeometry = new TorusGeometry(4.4, 0.05, 6, 120);
  const ringA = new Mesh(ringGeometry, ringMaterial);
  const ringB = new Mesh(ringGeometry, ringMaterial);
  ringA.position.z = ringB.position.z = 1.3;
  tilt.add(ringA, ringB);

  group.add(createHitProxy([size + 0.6, size + 0.6, 3.5]));

  let energy = 0;
  const pose = (t: number) => {
    tilt.rotation.y = 0.18 + Math.sin(t * 0.32) * 0.38 * (0.5 + 0.5 * energy);
    tilt.rotation.x = -0.12 + Math.sin(t * 0.21 + 2) * 0.09;
    ringA.rotation.set(1.15, t * 0.5, 0);
    ringB.rotation.set(0.35, -t * 0.4, 0.6);
    lockMaterial.emissiveIntensity = 0.4 + energy * 0.5;
  };
  place(0, 0);
  pose(0);

  return {
    group,

    update(t, active, dt) {
      energy = approach(energy, active ? 1 : 0, 2, dt, reduced);
      if (!reduced) place(t, energy);
      pose(t);
    },

    dispose() {
      disposeObject(group);
      group.clear();
    },
  };
}

export const qrLattice: ArtifactDef = { create };
