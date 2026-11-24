// Stars: fixed directions on a huge sphere that follows the camera (so they
// read as infinitely far), twinkling slowly. Additive, no depth.
export const STARS_VERTEX = /* glsl */ `
attribute float aSize;
attribute float aSeed;
attribute vec3 aColor;
uniform float uPixelRatio;
uniform float uTime;
varying vec3 vColor;
varying float vTwinkle;
void main() {
  float tw = 0.72 + 0.28 * sin(uTime * (0.5 + aSeed * 1.5) + aSeed * 40.0);
  vTwinkle = tw;
  vColor = aColor;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uPixelRatio * (0.85 + 0.15 * tw);
}
`;

export const STARS_FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vTwinkle;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  a *= a;
  gl_FragColor = vec4(vColor * vTwinkle, a);
  #include <colorspace_fragment>
}
`;

// Dust: a box of particles that always surrounds the camera. Positions are
// stored in [0,1)³ and wrapped around the camera ON THE GPU, so there is no
// per-frame CPU work and the field never "ends".
export const DUST_VERTEX = /* glsl */ `
attribute float aSeed;
uniform vec3 uCamera;
uniform float uBox;
uniform float uPixelRatio;
uniform float uTime;
varying float vAlpha;
void main() {
  vec3 base = position * uBox;
  vec3 rel = mod(base - uCamera + uBox * 0.5, uBox) - uBox * 0.5;
  rel += vec3(sin(uTime * 0.11 + aSeed * 40.0), cos(uTime * 0.09 + aSeed * 23.0), sin(uTime * 0.07 + aSeed * 31.0)) * 0.6;
  vec4 mv = viewMatrix * vec4(uCamera + rel, 1.0);
  gl_Position = projectionMatrix * mv;
  float dist = length(rel);
  vAlpha = smoothstep(uBox * 0.5, uBox * 0.18, dist) * (0.35 + 0.65 * aSeed);
  gl_PointSize = clamp(uPixelRatio * (70.0 / max(1.0, -mv.z)) * (0.6 + aSeed), 1.0, 5.0 * uPixelRatio);
}
`;

export const DUST_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.05, d) * vAlpha * 0.55;
  gl_FragColor = vec4(uColor, a);
  #include <colorspace_fragment>
}
`;
