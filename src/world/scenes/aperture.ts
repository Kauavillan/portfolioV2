import {
  BoxGeometry,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PointLight,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from "three";
import { SECTOR_MOODS } from "@data/world";
import type { QualityTier } from "../quality";
import type { Region } from "../types";
import { disposeObject } from "../util/dispose";

const CENTER = new Vector3(80, -2, -118);

const BLADES = 9;
/** Radius of the blade pivots (hidden under the housing) and blade length. */
const PIVOT_RADIUS = 11.2;
const BLADE_LENGTH = 10.5;
/** Blade swing: 0 = tangent (open), ~π/2 = pointing at the centre (closed). */
const OPEN = 0.22;
const CLOSED = 1.1;
/** Smoothing of the iris: ~0.04 per frame at 60 fps. */
const IRIS_RATE = 2.4;

const MARKER_COUNT = 72;
const MARKER_RADIUS = 15.4;

/** One blade: a leaf-shaped plate, pivot at the origin, pointing along +x. */
function createBladeGeometry(): ExtrudeGeometry {
  const L = BLADE_LENGTH;
  const shape = new Shape();
  shape.moveTo(0, -1.9);
  shape.quadraticCurveTo(L * 0.55, -3.6, L, -0.7);
  shape.lineTo(L, 0.5);
  shape.quadraticCurveTo(L * 0.5, 1.7, 0, 1.9);
  shape.closePath();
  return new ExtrudeGeometry(shape, { depth: 0.28, bevelEnabled: false, curveSegments: 14 });
}

/**
 * About: an optical assembly. A dark housing with a brass trim and a thin
 * emissive ring, 72 instanced markers, nine iris blades (ONE shared geometry)
 * that swing open while the section is in focus, and a coated lens behind them.
 */
export function createApertureRegion(options: { reduced: boolean }): Region {
  const group = new Group();
  group.position.copy(CENTER);

  // ── Housing, trim, glow ring ───────────────────────────────────────────
  const housing = new Mesh(
    new TorusGeometry(12.6, 1.5, 28, 160),
    new MeshStandardMaterial({ color: new Color("#3a4260"), metalness: 0.92, roughness: 0.3 }),
  );
  const trim = new Mesh(
    new TorusGeometry(11, 0.45, 20, 160),
    new MeshStandardMaterial({ color: new Color("#d2ab70"), metalness: 1, roughness: 0.22 }),
  );
  const glowRing = new Mesh(
    new TorusGeometry(12.1, 0.06, 8, 200),
    new MeshBasicMaterial({ color: new Color("#7da2ff"), fog: false }),
  );
  const casing = new Group();
  casing.add(housing, trim, glowRing);
  group.add(casing);

  // ── Markers (one instanced draw call) ──────────────────────────────────
  const markers = new InstancedMesh(
    new BoxGeometry(0.18, 0.9, 0.18),
    new MeshBasicMaterial({ color: new Color("#ffffff") }),
    MARKER_COUNT,
  );
  const dummy = new Object3D();
  const markerBase = new Color("#6f7894");
  const markerAccent = new Color("#7da2ff");
  for (let i = 0; i < MARKER_COUNT; i++) {
    const a = (i / MARKER_COUNT) * Math.PI * 2;
    const major = i % 6 === 0;
    dummy.position.set(Math.cos(a) * MARKER_RADIUS, Math.sin(a) * MARKER_RADIUS, 0);
    dummy.rotation.set(0, 0, a - Math.PI / 2);
    dummy.scale.set(major ? 1.5 : 1, major ? 2 : 1, 1);
    dummy.updateMatrix();
    markers.setMatrixAt(i, dummy.matrix);
    markers.setColorAt(i, major ? markerAccent : markerBase);
  }
  markers.instanceMatrix.needsUpdate = true;
  if (markers.instanceColor) markers.instanceColor.needsUpdate = true;
  casing.add(markers);

  // ── Iris: 1 geometry, N meshes ─────────────────────────────────────────
  const bladeGeometry = createBladeGeometry();
  const bladeMaterial = new MeshStandardMaterial({
    color: new Color("#4a5784"),
    metalness: 0.75,
    roughness: 0.34,
    side: DoubleSide,
  });
  const blades: { pivot: Group; theta: number }[] = [];
  for (let i = 0; i < BLADES; i++) {
    const theta = (i / BLADES) * Math.PI * 2;
    const pivot = new Group();
    // Slightly different depths avoid z-fighting where blades overlap.
    pivot.position.set(
      Math.cos(theta) * PIVOT_RADIUS,
      Math.sin(theta) * PIVOT_RADIUS,
      -1.8 - i * 0.03,
    );
    pivot.add(new Mesh(bladeGeometry, bladeMaterial));
    group.add(pivot);
    blades.push({ pivot, theta });
  }

  // ── Lens behind the iris ───────────────────────────────────────────────
  const lens = new Mesh(
    new SphereGeometry(6, 48, 32),
    new MeshPhysicalMaterial({
      color: new Color("#27498a"),
      metalness: 0.55,
      roughness: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    }),
  );
  lens.scale.set(1, 1, 0.5);
  lens.position.z = -3.4;
  group.add(lens);

  // ── Lights (warm / cool / white) so the metals read ────────────────────
  const warm = new PointLight(new Color("#ffa476"), 1400);
  warm.position.set(16, 12, 18);
  const cool = new PointLight(new Color("#9bb8ff"), 900);
  cool.position.set(-18, -8, 16);
  const white = new PointLight(new Color("#ffffff"), 700);
  white.position.set(0, 18, 24);
  group.add(warm, cool, white);

  let beta = CLOSED;
  const applyIris = () => {
    for (const { pivot, theta } of blades) {
      pivot.rotation.z = theta + Math.PI / 2 + beta;
    }
  };
  applyIris();

  const station = {
    position: CENTER.clone().add(new Vector3(6, 2, 72)),
    target: CENTER.clone(),
    offset: -6,
    offsetNarrow: 0,
    mood: SECTOR_MOODS.about,
  };

  return {
    group,
    stations: { about: station },
    emitter: CENTER.clone(),

    update(t, active, dt) {
      const goal = active ? OPEN : CLOSED;
      beta = options.reduced ? goal : beta + (goal - beta) * (1 - Math.exp(-dt * IRIS_RATE));
      applyIris();
      casing.rotation.z += dt * 0.012;
      lens.rotation.y = Math.sin(t * 0.3) * 0.25;
      lens.position.z = -3.4 + Math.sin(t * 0.5) * 0.25;
    },

    setQuality(tier: QualityTier) {
      // The third light is the first thing to go on the weakest tier.
      white.visible = tier.name !== "low";
    },

    dispose() {
      disposeObject(group);
      group.clear();
    },
  };
}
