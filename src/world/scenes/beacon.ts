import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CircleGeometry,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Points,
  PointsMaterial,
  ShaderMaterial,
  TorusGeometry,
  Vector3,
} from "three";
import { SECTOR_MOODS } from "@data/world";
import type { QualityTier } from "../quality";
import { PORTAL_FRAGMENT, PORTAL_VERTEX } from "../shaders/portal";
import type { Region, Station } from "../types";
import { disposeObject } from "../util/dispose";
import { approach } from "../util/ease";
import { createRng, WORLD_SEED } from "../util/rng";
import { createGlowTexture } from "../util/texture";

const CENTER = new Vector3(0, 0, -1010);
const TORUS_RADIUS = 18;
const PORTAL_RADIUS = 16.4;
const PARTICLES = 250;
/** `uOpen` closes the gap to its goal at this rate per second (≈ 1.5 s to open). */
const OPEN_RATE = 2.1;

/**
 * Contact: a beacon that closes the journey. A large metal torus and a thin
 * emissive ring frame a portal disc that opens when the visitor arrives, with
 * ~250 particles drifting around it. The last section never "leaves", so once
 * open it stays open while the camera rests on the final station.
 */
export function createBeaconRegion(options: { reduced: boolean }): Region {
  const { reduced } = options;
  const group = new Group();
  group.position.copy(CENTER);
  const body = new Group();
  group.add(body);

  // ── Frame ──────────────────────────────────────────────────────────────
  body.add(
    new Mesh(
      new TorusGeometry(TORUS_RADIUS, 1.5, 28, 180),
      new MeshStandardMaterial({ color: new Color("#3a3f66"), metalness: 0.92, roughness: 0.3 }),
    ),
  );
  body.add(
    new Mesh(
      new TorusGeometry(TORUS_RADIUS - 1.9, 0.07, 8, 200),
      new MeshBasicMaterial({ color: new Color("#ff8fb0"), fog: false }),
    ),
  );

  // ── Portal ─────────────────────────────────────────────────────────────
  const portal = new ShaderMaterial({
    vertexShader: PORTAL_VERTEX,
    fragmentShader: PORTAL_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uOpen: { value: 0 },
      uRadius: { value: PORTAL_RADIUS },
      uColorA: { value: new Color("#ff5c8a") },
      uColorB: { value: new Color("#7a5cff") },
      uHot: { value: new Color("#ffe0ec") },
    },
    defines: { OCTAVES: 3 },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: DoubleSide,
    toneMapped: false,
    fog: false,
  });
  const disc = new Mesh(new CircleGeometry(PORTAL_RADIUS, 96), portal);
  disc.position.z = -0.4;
  body.add(disc);

  // ── Particles ──────────────────────────────────────────────────────────
  const rng = createRng(WORLD_SEED + 331);
  const buffer = new Float32Array(PARTICLES * 3);
  for (let i = 0; i < PARTICLES; i++) {
    // A thick ring around the portal, with some stragglers inside and outside.
    const angle = rng() * Math.PI * 2;
    const radius = TORUS_RADIUS * (0.35 + rng() * 1.25);
    buffer[i * 3] = Math.cos(angle) * radius;
    buffer[i * 3 + 1] = Math.sin(angle) * radius;
    buffer[i * 3 + 2] = (rng() - 0.5) * 14;
  }
  const particleGeometry = new BufferGeometry();
  particleGeometry.setAttribute("position", new BufferAttribute(buffer, 3));
  const particles = new Points(
    particleGeometry,
    new PointsMaterial({
      map: createGlowTexture(64),
      color: new Color("#ffb6cc"),
      size: 0.9,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.0,
      blending: AdditiveBlending,
      depthWrite: false,
      fog: false,
    }),
  );
  particles.frustumCulled = false;
  group.add(particles);

  const station: Station = {
    position: CENTER.clone().add(new Vector3(4, 2, 82)),
    target: CENTER.clone(),
    offset: -6,
    offsetNarrow: 0,
    mood: SECTOR_MOODS.contact,
  };

  let open = reduced ? 1 : 0;
  const apply = (t: number) => {
    portal.uniforms.uTime.value = t;
    portal.uniforms.uOpen.value = open;
    (particles.material as PointsMaterial).opacity = 0.15 + open * 0.6;
    body.rotation.z = t * 0.02;
    particles.rotation.z = -t * 0.03;
  };
  apply(0);

  return {
    group,
    stations: { contact: station },
    emitter: CENTER.clone(),
    fade: { near: 100, far: 150 },

    update(t, active, dt) {
      open = approach(open, active ? 1 : 0, OPEN_RATE, dt, reduced);
      apply(t);
    },

    setQuality(tier: QualityTier) {
      // The portal is the only fbm user here: follow the tier (low = 2 octaves).
      const octaves = Math.min(tier.octaves, 4);
      if (portal.defines.OCTAVES !== octaves) {
        portal.defines.OCTAVES = octaves;
        portal.needsUpdate = true;
      }
    },

    dispose() {
      disposeObject(group);
      group.clear();
    },
  };
}
