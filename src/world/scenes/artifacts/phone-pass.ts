import {
  AdditiveBlending,
  Color,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Shape,
  ShapeGeometry,
  ShaderMaterial,
  TorusGeometry,
  type Texture,
} from "three";
import { PASS_FRAGMENT, PASS_VERTEX } from "../../shaders/pass";
import { disposeObject } from "../../util/dispose";
import { approach } from "../../util/ease";
import { createHitProxy, type Artifact, type ArtifactDef } from "./types";

const WIDTH = 8.8;
const HEIGHT = 14;
const RADIUS = 1.2;
const DEPTH = 0.5;
const BEVEL = 0.12;
const RIPPLES = 3;

function roundedRect(w: number, h: number, r: number): Shape {
  const x = -w / 2;
  const y = -h / 2;
  const s = new Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/**
 * Magipass: a holographic pass card floating above a ripple of NFC rings.
 * Three draw calls for the card (body, foil, rim) plus one per ripple.
 */
function create({ colors, reduced }: { colors: { a: Color; b: Color }; reduced: boolean }): Artifact {
  const group = new Group();
  const card = new Group();
  group.add(card);

  const bodyGeometry = new ExtrudeGeometry(roundedRect(WIDTH, HEIGHT, RADIUS), {
    depth: DEPTH,
    bevelEnabled: true,
    bevelSize: BEVEL,
    bevelThickness: BEVEL,
    bevelSegments: 3,
    curveSegments: 10,
  });
  bodyGeometry.translate(0, 0, -DEPTH / 2);
  card.add(
    new Mesh(
      bodyGeometry,
      new MeshStandardMaterial({ color: new Color("#141a3a"), metalness: 0.7, roughness: 0.3 }),
    ),
  );

  const foil = new ShaderMaterial({
    vertexShader: PASS_VERTEX,
    fragmentShader: PASS_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uActive: { value: 0 },
      uHasMap: { value: 0 },
      uMap: { value: null },
      uColorA: { value: colors.a.clone() },
      uColorB: { value: colors.b.clone() },
    },
  });
  const face = new Mesh(new ShapeGeometry(roundedRect(WIDTH - 0.5, HEIGHT - 0.5, RADIUS - 0.2), 10), foil);
  face.position.z = DEPTH / 2 + BEVEL + 0.01;
  card.add(face);

  // Ripples: thin additive rings that expand and fade behind the card.
  const rippleGeometry = new TorusGeometry(5.2, 0.05, 6, 96);
  const ripples: Mesh<TorusGeometry, MeshBasicMaterial>[] = [];
  for (let i = 0; i < RIPPLES; i++) {
    const ripple = new Mesh(
      rippleGeometry,
      new MeshBasicMaterial({
        color: colors.a.clone().lerp(colors.b, i / RIPPLES),
        blending: AdditiveBlending,
        transparent: true,
        depthWrite: false,
        opacity: 0.4,
      }),
    );
    ripple.position.z = -1.4;
    group.add(ripple);
    ripples.push(ripple);
  }

  group.add(createHitProxy([WIDTH + 0.8, HEIGHT + 0.8, 3]));

  let energy = 0;
  const pose = (t: number) => {
    card.rotation.y = 0.2 + Math.sin(t * 0.45) * 0.34 * (0.5 + 0.5 * energy);
    card.rotation.x = Math.sin(t * 0.31 + 1) * 0.08;
    card.position.y = Math.sin(t * 0.6) * 0.3;
  };
  const rippleFrame = (t: number) => {
    ripples.forEach((ripple, i) => {
      const phase = reduced ? (i + 0.35) / RIPPLES : (t * 0.35 + i / RIPPLES) % 1;
      ripple.scale.setScalar(0.85 + phase * 0.75);
      ripple.material.opacity = (1 - phase) * (0.18 + 0.4 * energy);
    });
  };
  pose(0);
  rippleFrame(0);

  return {
    group,

    update(t, active, dt) {
      energy = approach(energy, active ? 1 : 0, 2.2, dt, reduced);
      foil.uniforms.uTime.value = t;
      foil.uniforms.uActive.value = energy;
      pose(t);
      rippleFrame(t);
    },

    setTexture(texture: Texture) {
      foil.uniforms.uMap.value = texture;
      foil.uniforms.uHasMap.value = 1;
    },

    dispose() {
      disposeObject(group);
      group.clear();
    },
  };
}

export const phonePass: ArtifactDef = { create, wantsTexture: true };
