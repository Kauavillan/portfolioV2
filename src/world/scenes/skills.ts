import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  LineSegments,
  Points,
  ShaderMaterial,
  Vector3,
} from "three";
import type { WorldData } from "@data/types";
import { SECTOR_MOODS } from "@data/world";
import type { Station, SkillsRegion } from "../types";
import {
  CHAIN_FRAGMENT,
  CHAIN_VERTEX,
  STAR_FRAGMENT,
  STAR_VERTEX,
} from "../shaders/constellation";
import { disposeObject } from "../util/dispose";
import { approach } from "../util/ease";
import { createRng, WORLD_SEED } from "../util/rng";

const CENTER = new Vector3(6, 34, -760);
/** Hub ellipse (semi-axes) and the skill spiral around each hub. */
const ELLIPSE_X = 20;
const ELLIPSE_Y = 11.5;
const ELLIPSE_Z = 6;
const SPIRAL_BASE = 2.6;
const SPIRAL_STEP = 1.9;
const GOLDEN_ANGLE = 2.399963;
/** Star sizes (relative): hub > shipped > stated. */
const SIZE = { hub: 9, shipped: 6, stated: 3.6 } as const;
/** World units per size unit. */
const UNIT = 0.27;
/** How quickly a star follows `light()`, per second. */
const LIT_RATE = 9;
const REVEAL_RATE = 1.6;

interface Star {
  group: number;
  /** `null` for a hub. */
  skill: string | null;
}

/**
 * Skills: every skill is a star, every group a hub with its skills on a
 * golden-angle spiral, chained hub → skill → skill. One `Points` and one
 * `LineSegments` draw call in total. `light()` is driven by the DOM chips.
 */
export function createSkillsRegion(options: {
  reduced: boolean;
  skillGroups: WorldData["skillGroups"];
}): SkillsRegion {
  const { reduced, skillGroups } = options;
  const rng = createRng(WORLD_SEED + 211);
  const group = new Group();
  group.position.copy(CENTER);

  const hubColor = new Color("#a9d8ff");
  const shippedColor = new Color("#ffe2b0");
  const statedColor = new Color("#b6bdd8").multiplyScalar(0.7);

  // ── Layout ─────────────────────────────────────────────────────────────
  const stars: Star[] = [];
  const positions: number[] = [];
  const sizes: number[] = [];
  const colors: number[] = [];
  const seeds: number[] = [];
  const chain: number[] = []; // pairs of star indices
  const skillIndex = new Map<string, number>();
  const groupIndex = new Map<string, number[]>();

  const push = (g: number, skill: string | null, at: Vector3, size: number, color: Color) => {
    const index = stars.length;
    stars.push({ group: g, skill });
    positions.push(at.x, at.y, at.z);
    sizes.push(size);
    colors.push(color.r, color.g, color.b);
    seeds.push(rng());
    return index;
  };

  skillGroups.forEach((g, gi) => {
    const theta = (gi / skillGroups.length) * Math.PI * 2 + 0.35;
    const hub = new Vector3(
      Math.cos(theta) * ELLIPSE_X,
      Math.sin(theta) * ELLIPSE_Y,
      Math.sin(theta * 2) * ELLIPSE_Z,
    );
    const members: number[] = [];
    const hubIdx = push(gi, null, hub, SIZE.hub, hubColor);
    members.push(hubIdx);
    let previous = hubIdx;

    const phase = rng() * Math.PI * 2;
    g.skills.forEach((skill, k) => {
      const angle = phase + k * GOLDEN_ANGLE;
      const radius = SPIRAL_BASE + Math.sqrt(k + 1) * SPIRAL_STEP;
      const at = new Vector3(
        hub.x + Math.cos(angle) * radius,
        hub.y + Math.sin(angle) * radius * 0.8,
        hub.z + (rng() - 0.5) * 3.2,
      );
      const idx = push(
        gi,
        skill.name,
        at,
        skill.evidence === "shipped" ? SIZE.shipped : SIZE.stated,
        skill.evidence === "shipped" ? shippedColor : statedColor,
      );
      skillIndex.set(`${g.id}:${skill.name}`, idx);
      members.push(idx);
      chain.push(previous, idx);
      previous = idx;
    });
    groupIndex.set(g.id, members);
  });

  const count = stars.length;
  const lit = new Float32Array(count);
  /** A star is lit if its own flag OR its group's flag is set. */
  const litSkill = new Uint8Array(count);
  const litGroup = new Uint8Array(skillGroups.length);
  const groupOfId = new Map(skillGroups.map((g, i) => [g.id, i]));

  // ── Stars (one Points draw call) ───────────────────────────────────────
  const litColor = new Color("#ff7a59").lerp(new Color("#ffd2a8"), 0.35); // the page's `--solar`, brightened
  const starUniforms = {
    uTime: { value: 0 },
    uReveal: { value: reduced ? 1 : 0 },
    uViewportH: { value: 900 },
    uUnit: { value: UNIT },
    uLitColor: { value: litColor },
  };
  const starGeometry = new BufferGeometry();
  starGeometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  starGeometry.setAttribute("aSize", new BufferAttribute(new Float32Array(sizes), 1));
  starGeometry.setAttribute("aColor", new BufferAttribute(new Float32Array(colors), 3));
  starGeometry.setAttribute("aSeed", new BufferAttribute(new Float32Array(seeds), 1));
  const litAttribute = new BufferAttribute(lit, 1);
  starGeometry.setAttribute("aLit", litAttribute);
  const points = new Points(
    starGeometry,
    new ShaderMaterial({
      vertexShader: STAR_VERTEX,
      fragmentShader: STAR_FRAGMENT,
      uniforms: starUniforms,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      fog: false,
    }),
  );
  points.frustumCulled = false;
  group.add(points);

  // ── Chains (one LineSegments draw call; `aLit` follows its endpoints) ───
  const linePositions = new Float32Array(chain.length * 3);
  const lineLit = new Float32Array(chain.length);
  chain.forEach((starIdx, i) => {
    linePositions[i * 3] = positions[starIdx * 3];
    linePositions[i * 3 + 1] = positions[starIdx * 3 + 1];
    linePositions[i * 3 + 2] = positions[starIdx * 3 + 2];
  });
  const lineGeometry = new BufferGeometry();
  lineGeometry.setAttribute("position", new BufferAttribute(linePositions, 3));
  const lineLitAttribute = new BufferAttribute(lineLit, 1);
  lineGeometry.setAttribute("aLit", lineLitAttribute);
  const lines = new LineSegments(
    lineGeometry,
    new ShaderMaterial({
      vertexShader: CHAIN_VERTEX,
      fragmentShader: CHAIN_FRAGMENT,
      uniforms: {
        uColor: { value: new Color("#7fb6d8") },
        uLitColor: { value: litColor },
        uReveal: starUniforms.uReveal,
      },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      fog: false,
    }),
  );
  lines.frustumCulled = false;
  group.add(lines);

  const station: Station = {
    position: CENTER.clone().add(new Vector3(0, 2, 70)),
    target: CENTER.clone(),
    offset: -6,
    offsetNarrow: 0,
    mood: SECTOR_MOODS.skills,
  };

  let reveal = reduced ? 1 : 0;

  return {
    group,
    stations: { skills: station },
    emitter: CENTER.clone(),
    fade: { near: 100, far: 150 },

    light(key, on) {
      const flag = on ? 1 : 0;
      const single = skillIndex.get(key);
      if (single !== undefined) {
        litSkill[single] = flag;
        return;
      }
      const g = groupOfId.get(key);
      if (g !== undefined) litGroup[g] = flag;
      // Anything else is ignored: the DOM may name a skill the world doesn't have.
    },

    setViewport(_width, height, pixelRatio) {
      starUniforms.uViewportH.value = height * pixelRatio;
    },

    update(t, active, dt) {
      starUniforms.uTime.value = t;
      reveal = approach(reveal, active ? 1 : 0.35, REVEAL_RATE, dt, reduced);
      starUniforms.uReveal.value = reveal;
      group.rotation.y = Math.sin(t * 0.07) * 0.12;
      group.rotation.x = Math.sin(t * 0.05 + 1) * 0.04;

      let changed = false;
      for (let i = 0; i < count; i++) {
        const goal = litSkill[i] === 1 || litGroup[stars[i].group] === 1 ? 1 : 0;
        const next = approach(lit[i], goal, LIT_RATE, dt, reduced);
        if (Math.abs(next - lit[i]) > 1e-4) {
          lit[i] = Math.abs(next - goal) < 1e-3 ? goal : next;
          changed = true;
        }
      }
      if (changed) {
        litAttribute.needsUpdate = true;
        for (let i = 0; i < chain.length; i++) lineLit[i] = lit[chain[i]];
        lineLitAttribute.needsUpdate = true;
      }
    },

    dispose() {
      disposeObject(group);
      group.clear();
    },
  };
}
