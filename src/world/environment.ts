import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  FogExp2,
  Mesh,
  MeshBasicMaterial,
  NormalBlending,
  PlaneGeometry,
  PMREMGenerator,
  Points,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  type PerspectiveCamera,
  type WebGLRenderer,
  type WebGLRenderTarget,
} from "three";
import type { QualityTier } from "./quality";
import { SKY_FRAGMENT, SKY_VERTEX } from "./shaders/sky";
import {
  DUST_FRAGMENT,
  DUST_VERTEX,
  STARS_FRAGMENT,
  STARS_VERTEX,
} from "./shaders/stars";
import { createRng } from "./util/rng";

const SKY_RADIUS = 3000;
const STARS_RADIUS = 2500;
const DUST_BOX = 520;
const FOG_DENSITY = 0.0058;
// Buffers are allocated once at the largest tier; tiers only change the draw range.
const MAX_STARS = 8000;
const MAX_DUST = 1300;

export interface EnvironmentOptions {
  /** Background / fog color (the `--ink` token). */
  ink: Color;
  tier: QualityTier;
  pixelRatio: number;
  seed: number;
}

export interface Environment {
  /** Renders a small environment once into `scene.environment` (for the metals). */
  bakeReflections(): void;
  applyQuality(tier: QualityTier): void;
  setPixelRatio(ratio: number): void;
  /** Eases the nebula tints towards (a, b); `k = 1` switches at once. */
  setMood(a: string, b: string, k: number): void;
  update(t: number, camera: PerspectiveCamera): void;
  dispose(): void;
}

export function createEnvironment(
  renderer: WebGLRenderer,
  scene: Scene,
  options: EnvironmentOptions,
): Environment {
  const { ink, seed } = options;
  const rng = createRng(seed);

  // ── Sky ────────────────────────────────────────────────────────────────
  const tintA = new Color("#000000");
  const tintB = new Color("#000000");
  const targetA = new Color("#000000");
  const targetB = new Color("#000000");
  let moodA = "";
  let moodB = "";

  const skyMaterial = new ShaderMaterial({
    vertexShader: SKY_VERTEX,
    fragmentShader: SKY_FRAGMENT,
    uniforms: {
      uInk: { value: ink },
      uTintA: { value: tintA },
      uTintB: { value: tintB },
      uTime: { value: 0 },
    },
    defines: { OCTAVES: options.tier.octaves },
    side: BackSide,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    fog: false,
  });
  const sky = new Mesh(new SphereGeometry(SKY_RADIUS, 48, 24), skyMaterial);
  sky.renderOrder = -10;
  sky.frustumCulled = false;
  scene.add(sky);

  // ── Stars (seeded: same seed ⇒ same sky) ───────────────────────────────
  const starPositions = new Float32Array(MAX_STARS * 3);
  const starSizes = new Float32Array(MAX_STARS);
  const starSeeds = new Float32Array(MAX_STARS);
  const starColors = new Float32Array(MAX_STARS * 3);
  const warm = new Color("#ffe3c4");
  const cool = new Color("#c4d8ff");
  const tmp = new Color();
  for (let i = 0; i < MAX_STARS; i++) {
    // Uniform direction on the sphere.
    const z = rng() * 2 - 1;
    const phi = rng() * Math.PI * 2;
    const r = Math.sqrt(1 - z * z);
    starPositions[i * 3] = Math.cos(phi) * r * STARS_RADIUS;
    starPositions[i * 3 + 1] = z * STARS_RADIUS;
    starPositions[i * 3 + 2] = Math.sin(phi) * r * STARS_RADIUS;
    starSizes[i] = 1.1 + Math.pow(rng(), 7) * 3.2; // mostly pin-pricks, a few bright
    starSeeds[i] = rng();
    tmp.copy(cool).lerp(warm, rng());
    const brightness = 0.55 + rng() * 0.45;
    starColors[i * 3] = tmp.r * brightness;
    starColors[i * 3 + 1] = tmp.g * brightness;
    starColors[i * 3 + 2] = tmp.b * brightness;
  }
  const starGeometry = new BufferGeometry();
  starGeometry.setAttribute("position", new BufferAttribute(starPositions, 3));
  starGeometry.setAttribute("aSize", new BufferAttribute(starSizes, 1));
  starGeometry.setAttribute("aSeed", new BufferAttribute(starSeeds, 1));
  starGeometry.setAttribute("aColor", new BufferAttribute(starColors, 3));
  const starMaterial = new ShaderMaterial({
    vertexShader: STARS_VERTEX,
    fragmentShader: STARS_FRAGMENT,
    uniforms: {
      uPixelRatio: { value: options.pixelRatio },
      uTime: { value: 0 },
    },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    fog: false,
  });
  const stars = new Points(starGeometry, starMaterial);
  stars.renderOrder = -9;
  stars.frustumCulled = false;
  scene.add(stars);

  // ── Dust (wraps around the camera on the GPU) ──────────────────────────
  const dustPositions = new Float32Array(MAX_DUST * 3);
  const dustSeeds = new Float32Array(MAX_DUST);
  for (let i = 0; i < MAX_DUST; i++) {
    dustPositions[i * 3] = rng();
    dustPositions[i * 3 + 1] = rng();
    dustPositions[i * 3 + 2] = rng();
    dustSeeds[i] = rng();
  }
  const dustGeometry = new BufferGeometry();
  dustGeometry.setAttribute("position", new BufferAttribute(dustPositions, 3));
  dustGeometry.setAttribute("aSeed", new BufferAttribute(dustSeeds, 1));
  const dustMaterial = new ShaderMaterial({
    vertexShader: DUST_VERTEX,
    fragmentShader: DUST_FRAGMENT,
    uniforms: {
      uCamera: { value: new Vector3() },
      uBox: { value: DUST_BOX },
      uPixelRatio: { value: options.pixelRatio },
      uTime: { value: 0 },
      uColor: { value: new Color("#d9dcf2") },
    },
    transparent: true,
    blending: NormalBlending,
    depthWrite: false,
    toneMapped: false,
    fog: false,
  });
  const dust = new Points(dustGeometry, dustMaterial);
  dust.renderOrder = -8;
  dust.frustumCulled = false;
  scene.add(dust);

  // ── Fog ────────────────────────────────────────────────────────────────
  scene.fog = new FogExp2(ink.getHex(), FOG_DENSITY);

  // ── Reflections ────────────────────────────────────────────────────────
  let reflections: WebGLRenderTarget | null = null;

  const environment: Environment = {
    bakeReflections() {
      if (reflections) return;
      const generator = new PMREMGenerator(renderer);
      const envScene = new Scene();

      // A soft gradient dome (cool below, warm above) plus three bright
      // "softbox" panels, which give the metals something to reflect.
      const dome = new Mesh(
        new SphereGeometry(40, 32, 16),
        new ShaderMaterial({
          side: BackSide,
          uniforms: {
            uTop: { value: new Color("#3a2a3f") },
            uHorizon: { value: new Color("#0d1020") },
            uBottom: { value: new Color("#16254a") },
          },
          vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
          fragmentShader: `uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uBottom; varying vec3 vDir;
            void main(){ float h = vDir.y; vec3 c = h > 0.0 ? mix(uHorizon, uTop, pow(h, 0.7)) : mix(uHorizon, uBottom, pow(-h, 0.7)); gl_FragColor = vec4(c, 1.0); }`,
        }),
      );
      envScene.add(dome);

      const panels: [string, number, [number, number, number]][] = [
        ["#ffc9a0", 7, [18, 14, 12]], // warm key
        ["#9fbcff", 5, [-20, 4, 10]], // cool fill
        ["#ffffff", 9, [2, -10, -22]], // white rim
      ];
      const panelGeometry = new PlaneGeometry(16, 9);
      const panelMaterials: MeshBasicMaterial[] = [];
      for (const [hex, gain, [x, y, z]] of panels) {
        const material = new MeshBasicMaterial({ color: new Color(hex).multiplyScalar(gain), side: DoubleSide });
        panelMaterials.push(material);
        const panel = new Mesh(panelGeometry, material);
        panel.position.set(x, y, z);
        panel.lookAt(0, 0, 0);
        envScene.add(panel);
      }

      reflections = generator.fromScene(envScene, 0.02);
      scene.environment = reflections.texture;
      scene.environmentIntensity = 0.9;

      dome.geometry.dispose();
      (dome.material as ShaderMaterial).dispose();
      panelGeometry.dispose();
      panelMaterials.forEach((m) => m.dispose());
      generator.dispose();
    },

    applyQuality(tier) {
      starGeometry.setDrawRange(0, Math.min(tier.stars, MAX_STARS));
      dustGeometry.setDrawRange(0, Math.min(tier.dust, MAX_DUST));
      if (skyMaterial.defines.OCTAVES !== tier.octaves) {
        skyMaterial.defines.OCTAVES = tier.octaves;
        skyMaterial.needsUpdate = true;
      }
    },

    setPixelRatio(ratio) {
      starMaterial.uniforms.uPixelRatio.value = ratio;
      dustMaterial.uniforms.uPixelRatio.value = ratio;
    },

    setMood(a, b, k) {
      if (a !== moodA) {
        moodA = a;
        targetA.set(a);
      }
      if (b !== moodB) {
        moodB = b;
        targetB.set(b);
      }
      tintA.lerp(targetA, k);
      tintB.lerp(targetB, k);
    },

    update(t, camera) {
      sky.position.copy(camera.position);
      stars.position.copy(camera.position);
      skyMaterial.uniforms.uTime.value = t;
      starMaterial.uniforms.uTime.value = t;
      dustMaterial.uniforms.uTime.value = t;
      (dustMaterial.uniforms.uCamera.value as Vector3).copy(camera.position);
    },

    dispose() {
      scene.remove(sky, stars, dust);
      sky.geometry.dispose();
      skyMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      dustGeometry.dispose();
      dustMaterial.dispose();
      reflections?.dispose();
      reflections = null;
      scene.environment = null;
      scene.fog = null;
    },
  };

  environment.applyQuality(options.tier);
  return environment;
}
