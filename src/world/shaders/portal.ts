import { NOISE_GLSL } from "./noise";

// The contact portal: a disc whose swirl, rings and soft edge are drawn in the
// fragment shader. `uOpen` (0 → 1) grows it from a pinpoint to the full disc.
// Additive, and capped well below 1 so a bloom pass can never blow out the text.

export const PORTAL_VERTEX = /* glsl */ `
varying vec2 vP;
void main() {
  vP = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const PORTAL_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uOpen;
uniform float uRadius;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uHot;
varying vec2 vP;
${NOISE_GLSL}

void main() {
  vec2 p = vP / uRadius;          // -1 … 1 across the disc
  float r = length(p);
  float angle = atan(p.y, p.x);
  float open = uOpen;

  // Opening: the lit disc grows from the centre; the rim stays soft.
  float reach = open * 1.02;
  float mask = smoothstep(reach, reach - 0.28, r) * smoothstep(0.0, 0.12, open);
  float edge = smoothstep(1.0, 0.78, r);

  // Swirl: noise sampled on a spiral, drifting slowly.
  float twist = angle + r * 3.4 - uTime * 0.32;
  vec3 q = vec3(cos(twist) * r * 1.9, sin(twist) * r * 1.9, uTime * 0.1);
  float n = fbm(q * 1.5);

  // Concentric rings that travel inwards.
  float rings = 0.5 + 0.5 * sin(r * 26.0 + uTime * 1.9 + n * 3.0);
  rings = pow(rings, 7.0) * smoothstep(1.0, 0.25, r);

  float core = exp(-r * r * 6.0);

  vec3 col = mix(uColorA, uColorB, smoothstep(0.25, 0.85, n)) * (0.28 + n * 0.75);
  col += uColorA * rings * 0.5;
  col += uHot * core * 0.55;

  float alpha = mask * edge * (0.3 + 0.55 * n + 0.45 * core);
  gl_FragColor = vec4(min(col, vec3(0.85)), clamp(alpha, 0.0, 0.9));
  #include <colorspace_fragment>
}
`;
