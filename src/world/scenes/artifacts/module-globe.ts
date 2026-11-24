import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Points,
  PointsMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from "three";
import { createRng } from "../../util/rng";
import { disposeObject } from "../../util/dispose";
import { approach } from "../../util/ease";
import { createHitProxy, type Artifact, type ArtifactDef, type ArtifactOptions } from "./types";

const GLOBE_RADIUS = 5;
const MODULE_RADIUS = 8.6;
const MODULES = 12;
const CITIES = 90;
const MERIDIANS = 9;
const PARALLELS = 5;
const SEGMENTS = 72;

/** Latitude/longitude lines as one `LineSegments` geometry. */
function graticule(radius: number): BufferGeometry {
  const buffer: number[] = [];
  const point = (lat: number, lon: number) =>
    [
      Math.cos(lat) * Math.cos(lon) * radius,
      Math.sin(lat) * radius,
      Math.cos(lat) * Math.sin(lon) * radius,
    ] as const;
  for (let m = 0; m < MERIDIANS; m++) {
    const lon = (m / MERIDIANS) * Math.PI * 2;
    for (let s = 0; s < SEGMENTS; s++) {
      const a = -Math.PI / 2 + (s / SEGMENTS) * Math.PI;
      const b = -Math.PI / 2 + ((s + 1) / SEGMENTS) * Math.PI;
      buffer.push(...point(a, lon), ...point(b, lon));
    }
  }
  for (let p = 1; p <= PARALLELS; p++) {
    const lat = -Math.PI / 2 + (p / (PARALLELS + 1)) * Math.PI;
    for (let s = 0; s < SEGMENTS; s++) {
      const a = (s / SEGMENTS) * Math.PI * 2;
      const b = ((s + 1) / SEGMENTS) * Math.PI * 2;
      buffer.push(...point(lat, a), ...point(lat, b));
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(buffer, 3));
  return geometry;
}

/**
 * Wegia: a graticule globe with a scatter of lit "cities", twelve modules
 * docked around it by thin links, and two orbit rings. The globe turns, the
 * modules counter-turn.
 */
function create({ colors, reduced, seed }: ArtifactOptions): Artifact {
  const rng = createRng(seed + 53);
  const group = new Group();
  const globe = new Group();
  const dock = new Group();
  group.add(globe, dock);

  const light = colors.a.clone().lerp(new Color("#ffffff"), 0.3);

  // ── Globe ──────────────────────────────────────────────────────────────
  globe.add(
    new Mesh(
      new SphereGeometry(GLOBE_RADIUS, 48, 32),
      new MeshStandardMaterial({
        color: new Color("#0b2a33"),
        emissive: colors.b.clone(),
        emissiveIntensity: 0.12,
        metalness: 0.45,
        roughness: 0.4,
      }),
    ),
  );
  globe.add(
    new LineSegments(
      graticule(GLOBE_RADIUS + 0.04),
      new LineBasicMaterial({
        color: colors.b.clone().lerp(new Color("#ffffff"), 0.2),
        transparent: true,
        opacity: 0.45,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    ),
  );

  const cityBuffer: number[] = [];
  for (let i = 0; i < CITIES; i++) {
    const y = rng() * 2 - 1;
    const ring = Math.sqrt(1 - y * y);
    const angle = rng() * Math.PI * 2;
    cityBuffer.push(
      Math.cos(angle) * ring * (GLOBE_RADIUS + 0.08),
      y * (GLOBE_RADIUS + 0.08),
      Math.sin(angle) * ring * (GLOBE_RADIUS + 0.08),
    );
  }
  const cityGeometry = new BufferGeometry();
  cityGeometry.setAttribute("position", new Float32BufferAttribute(cityBuffer, 3));
  globe.add(
    new Points(
      cityGeometry,
      new PointsMaterial({
        color: light,
        size: 0.26,
        sizeAttenuation: true,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    ),
  );

  // ── Modules docked around the globe, with their links ──────────────────
  const moduleMesh = new InstancedMesh(
    new BoxGeometry(1.25, 1.25, 1.25),
    new MeshStandardMaterial({ color: new Color("#ffffff"), metalness: 0.5, roughness: 0.32 }),
    MODULES,
  );
  const dummy = new Object3D();
  const tint = new Color();
  const linkBuffer: number[] = [];
  const spot = new Vector3();
  for (let i = 0; i < MODULES; i++) {
    const y = 1 - ((i + 0.5) / MODULES) * 2;
    const ring = Math.sqrt(1 - y * y);
    const angle = i * 2.399963;
    spot.set(Math.cos(angle) * ring, y, Math.sin(angle) * ring);
    dummy.position.copy(spot).multiplyScalar(MODULE_RADIUS);
    dummy.lookAt(0, 0, 0);
    dummy.scale.setScalar(0.8 + (i % 3) * 0.18);
    dummy.updateMatrix();
    moduleMesh.setMatrixAt(i, dummy.matrix);
    moduleMesh.setColorAt(i, tint.copy(i % 2 ? colors.a : colors.b));
    linkBuffer.push(
      ...spot.clone().multiplyScalar(GLOBE_RADIUS).toArray(),
      ...spot.clone().multiplyScalar(MODULE_RADIUS - 0.7).toArray(),
    );
  }
  moduleMesh.instanceMatrix.needsUpdate = true;
  if (moduleMesh.instanceColor) moduleMesh.instanceColor.needsUpdate = true;
  dock.add(moduleMesh);

  const linkGeometry = new BufferGeometry();
  linkGeometry.setAttribute("position", new Float32BufferAttribute(linkBuffer, 3));
  dock.add(
    new LineSegments(
      linkGeometry,
      new LineBasicMaterial({ color: light, transparent: true, opacity: 0.5 }),
    ),
  );

  // ── Orbit rings ────────────────────────────────────────────────────────
  const orbitMaterial = new MeshStandardMaterial({
    color: light,
    emissive: light,
    emissiveIntensity: 0.9,
    metalness: 0.2,
    roughness: 0.4,
  });
  const orbitA = new Mesh(new TorusGeometry(MODULE_RADIUS + 1.2, 0.05, 6, 160), orbitMaterial);
  const orbitB = new Mesh(new TorusGeometry(GLOBE_RADIUS + 1.6, 0.04, 6, 160), orbitMaterial);
  orbitA.rotation.set(1.25, 0, 0.35);
  orbitB.rotation.set(0.5, 0, -0.7);
  group.add(orbitA, orbitB);

  group.add(createHitProxy(9.6));
  group.rotation.x = 0.35;

  let energy = 0;
  const pose = (t: number) => {
    globe.rotation.y = 0.5 + t * (0.12 + 0.1 * energy);
    dock.rotation.y = -t * (0.05 + 0.04 * energy);
    dock.rotation.z = Math.sin(t * 0.2) * 0.08;
    orbitA.rotation.z = 0.35 + t * 0.07;
    orbitB.rotation.z = -0.7 - t * 0.1;
    orbitMaterial.emissiveIntensity = 0.5 + energy * 0.7;
  };
  pose(0);

  return {
    group,

    update(t, active, dt) {
      energy = approach(energy, active ? 1 : 0, 2, dt, reduced);
      pose(t);
    },

    dispose() {
      disposeObject(group);
      group.clear();
    },
  };
}

export const moduleGlobe: ArtifactDef = { create };
