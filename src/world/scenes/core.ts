import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  TorusGeometry,
  Vector3,
} from "three";
import { SECTOR_MOODS } from "@data/world";
import type { QualityTier } from "../quality";
import { PLASMA_FRAGMENT, PLASMA_VERTEX } from "../shaders/plasma";
import type { Region } from "../types";
import { disposeObject } from "../util/dispose";
import { createGlowTexture } from "../util/texture";

const STAR_RADIUS = 5;
const GLOW_SCALE = 30;
const TICK_COUNT = 96;
const TICK_RADIUS = 14.6;

/** Rings: radius, tube, tilt (x, z) and spin speed (rad/s). Own arrangement. */
const RINGS = [
  { radius: 7.8, tube: 0.24, tilt: [0.34, 0.1], speed: 0.11 },
  { radius: 9.9, tube: 0.2, tilt: [-0.52, 0.42], speed: -0.075 },
  { radius: 12.2, tube: 0.18, tilt: [0.16, -0.7], speed: 0.05 },
] as const;

/**
 * Home: a plasma star, three tilted metal rings (each with a thin emissive
 * twin and a small orbiter) and a ring of 96 ticks drawn in ONE instanced call.
 * Sits at the origin; the camera station looks at it from the front.
 */
export function createCoreRegion(options: { reduced: boolean }): Region {
  const group = new Group();

  // ── Star ───────────────────────────────────────────────────────────────
  const plasma = new ShaderMaterial({
    vertexShader: PLASMA_VERTEX,
    fragmentShader: PLASMA_FRAGMENT,
    uniforms: { uTime: { value: 0 }, uHeat: { value: 0.35 } },
    defines: { OCTAVES: 3 },
  });
  const star = new Mesh(new SphereGeometry(STAR_RADIUS, 64, 48), plasma);
  group.add(star);

  const glow = new Sprite(
    new SpriteMaterial({
      map: createGlowTexture(),
      color: new Color("#ff8a5c"),
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
      fog: false,
      opacity: 0.8,
    }),
  );
  glow.scale.setScalar(GLOW_SCALE);
  group.add(glow);

  // ── Rings ──────────────────────────────────────────────────────────────
  const metal = new MeshStandardMaterial({
    color: new Color("#cfd2dc"),
    metalness: 1,
    roughness: 0.26,
  });
  const lineMaterial = new MeshBasicMaterial({ color: new Color("#ffd2a8"), fog: false });
  const orbiterMaterial = new MeshBasicMaterial({ color: new Color("#ffe6cc"), fog: false });
  const orbiterGeometry = new SphereGeometry(0.42, 16, 12);

  const spinners: { group: Group; speed: number }[] = [];
  RINGS.forEach((ring, i) => {
    const tilt = new Group();
    tilt.rotation.set(ring.tilt[0], 0, ring.tilt[1]);
    const spin = new Group();
    tilt.add(spin);
    spin.add(new Mesh(new TorusGeometry(ring.radius, ring.tube, 24, 160), metal));
    spin.add(new Mesh(new TorusGeometry(ring.radius + ring.tube + 0.12, 0.045, 8, 200), lineMaterial));
    const orbiter = new Mesh(orbiterGeometry, orbiterMaterial);
    const angle = (i / RINGS.length) * Math.PI * 2 + 0.6;
    orbiter.position.set(Math.cos(angle) * ring.radius, Math.sin(angle) * ring.radius, 0);
    spin.add(orbiter);
    group.add(tilt);
    spinners.push({ group: spin, speed: ring.speed });
  });

  // ── Ticks (one InstancedMesh = one draw call) ──────────────────────────
  const tickMaterial = new MeshBasicMaterial({ color: new Color("#ffffff") });
  const ticks = new InstancedMesh(new BoxGeometry(0.1, 0.9, 0.1), tickMaterial, TICK_COUNT);
  const dummy = new Object3D();
  const base = new Color("#7e86a3");
  const accent = new Color("#ffcf9e");
  for (let i = 0; i < TICK_COUNT; i++) {
    const a = (i / TICK_COUNT) * Math.PI * 2;
    const major = i % 8 === 0;
    dummy.position.set(Math.cos(a) * TICK_RADIUS, Math.sin(a) * TICK_RADIUS, 0);
    dummy.rotation.set(0, 0, a - Math.PI / 2);
    dummy.scale.set(major ? 1.6 : 1, major ? 1.9 : 1, major ? 1.6 : 1);
    dummy.updateMatrix();
    ticks.setMatrixAt(i, dummy.matrix);
    ticks.setColorAt(i, major ? accent : base);
  }
  ticks.instanceMatrix.needsUpdate = true;
  if (ticks.instanceColor) ticks.instanceColor.needsUpdate = true;
  const tickTilt = new Group();
  tickTilt.rotation.set(0.12, 0, -0.05);
  tickTilt.add(ticks);
  group.add(tickTilt);

  let heat = 0.35;
  const station = {
    position: new Vector3(0, 6, 60),
    target: new Vector3(0, 0, 0),
    offset: -6,
    offsetNarrow: 0,
    mood: SECTOR_MOODS.home,
  };

  return {
    group,
    stations: { home: station },
    emitter: new Vector3(0, 0, 0),

    update(t, active, dt) {
      plasma.uniforms.uTime.value = t;
      const goal = active ? 1 : 0.35;
      heat = options.reduced ? goal : heat + (goal - heat) * (1 - Math.exp(-dt * 2));
      plasma.uniforms.uHeat.value = heat;
      glow.material.opacity = 0.55 + heat * 0.35;
      star.rotation.y += dt * 0.03;
      for (const s of spinners) s.group.rotation.z += dt * s.speed;
      tickTilt.rotation.z += dt * 0.012;
    },

    setQuality(tier: QualityTier) {
      const octaves = Math.min(tier.octaves + 1, 4); // the star is the hero: one more octave than the sky
      if (plasma.defines.OCTAVES !== octaves) {
        plasma.defines.OCTAVES = octaves;
        plasma.needsUpdate = true;
      }
    },

    dispose() {
      disposeObject(group);
      group.clear();
    },
  };
}
