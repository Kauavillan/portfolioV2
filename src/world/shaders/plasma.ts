import { NOISE_GLSL } from "./noise";

export const PLASMA_VERTEX = /* glsl */ `
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
  vPos = position;
  vNormal = normalMatrix * normal;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vViewDir = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

// A churning star surface: domain-warped fbm drives a deep-red → coral → pale
// ramp, latitude bands add shear, and a fresnel rim fakes the corona.
// `uHeat` (0..1) brightens it while the section is in focus.
export const PLASMA_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uHeat;
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vViewDir;
${NOISE_GLSL}

void main() {
  vec3 dir = normalize(vPos);
  vec3 p = dir * 1.8;
  vec3 warp = vec3(
    fbm(p + vec3(0.0, uTime * 0.05, 0.0)),
    fbm(p + vec3(3.1, -uTime * 0.04, 1.3)),
    fbm(p + vec3(7.7, 2.2, uTime * 0.03))
  );
  float n = fbm(p * 1.4 + warp * 1.25 + vec3(0.0, uTime * 0.07, 0.0));
  float bands = 0.5 + 0.5 * sin(dir.y * 11.0 + n * 4.5 + uTime * 0.12);
  float heat = clamp(n * 1.05 + bands * 0.28 - 0.22, 0.0, 1.0);

  vec3 deep = vec3(0.30, 0.02, 0.05);
  vec3 mid = vec3(1.00, 0.26, 0.11);
  vec3 hot = vec3(1.00, 0.78, 0.52);
  vec3 col = mix(deep, mid, smoothstep(0.12, 0.55, heat));
  col = mix(col, hot, smoothstep(0.70, 1.00, heat) * 0.9);

  float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), 2.6);
  col += vec3(1.0, 0.45, 0.28) * rim * (0.9 + uHeat * 0.8);
  col *= 1.0 + uHeat * 0.3;

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;
