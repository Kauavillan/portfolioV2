// Skills constellation: stars as additive point sprites and the chains that link
// them as line segments. Both read `aLit` (0..1), the "highlighted by the page"
// amount, so a chip hover can swell a star and brighten its chain.

export const STAR_VERTEX = /* glsl */ `
attribute float aSize;
attribute float aLit;
attribute float aSeed;
attribute vec3 aColor;
uniform float uTime;
uniform float uReveal;
uniform float uViewportH;
uniform float uUnit;
varying vec3 vColor;
varying float vLit;
varying float vGlow;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float twinkle = 0.8 + 0.2 * sin(uTime * (0.7 + aSeed * 1.5) + aSeed * 50.0);
  float world = aSize * uUnit * (1.0 + 1.4 * aLit) * twinkle * uReveal;
  // World diameter → pixels with this camera's own projection.
  gl_PointSize = world * projectionMatrix[1][1] * uViewportH * 0.5 / max(0.5, -mv.z);
  vColor = aColor;
  vLit = aLit;
  vGlow = uReveal * twinkle;
}
`;

export const STAR_FRAGMENT = /* glsl */ `
uniform vec3 uLitColor;
varying vec3 vColor;
varying float vLit;
varying float vGlow;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float core = pow(1.0 - d, 1.6);
  float halo = pow(1.0 - d, 3.4);
  vec3 col = mix(vColor, uLitColor, vLit);
  float a = (core * 0.6 + halo * 0.8) * vGlow * (1.0 + vLit * 0.8);
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}
`;

export const CHAIN_VERTEX = /* glsl */ `
attribute float aLit;
uniform float uReveal;
varying float vLit;
void main() {
  vLit = aLit;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const CHAIN_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uLitColor;
uniform float uReveal;
varying float vLit;
void main() {
  vec3 col = mix(uColor, uLitColor, vLit);
  float a = (0.16 + 0.55 * vLit) * uReveal;
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}
`;
