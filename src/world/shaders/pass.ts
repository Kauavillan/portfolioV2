// Face of the Magipass card: a holographic foil with a glare sweep, an app-icon
// tile (the project image when it has loaded, a four-point sparkle until then),
// name/detail bars, an NFC mark and a barcode. Everything is drawn from signed
// distance functions: no extra assets.

export const PASS_VERTEX = /* glsl */ `
varying vec2 vP;
varying vec3 vN;
varying vec3 vV;
void main() {
  vP = position.xy;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

export const PASS_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uActive;
uniform float uHasMap;
uniform sampler2D uMap;
uniform vec3 uColorA;
uniform vec3 uColorB;
varying vec2 vP;
varying vec3 vN;
varying vec3 vV;

float rbox(vec2 p, vec2 b, float r) {
  vec2 d = abs(p) - b + r;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}
vec3 hue(float h) {
  return 0.5 + 0.5 * cos(6.28318 * (h + vec3(0.0, 0.33, 0.67)));
}
float sparkle(vec2 p, float s) {
  p = abs(p) / s;
  return smoothstep(1.0, 0.0, sqrt(p.x) + sqrt(p.y));
}
float hash11(float n) { return fract(sin(n * 127.1) * 43758.5453); }

void main() {
  vec2 q = vP; // card space: x ∈ [-4.2, 4.2], y ∈ [-6.8, 6.8]
  vec3 n = normalize(vN);
  vec3 v = normalize(vV);
  float fres = pow(1.0 - abs(dot(n, v)), 2.0);

  // Foil: a slow hue sweep that also shifts with the viewing angle.
  float sweep = q.x * 0.045 + q.y * 0.06 + fres * 1.1 + uTime * 0.04;
  vec3 holo = hue(sweep);
  vec3 base = mix(uColorB * 0.16, uColorA * 0.2, smoothstep(-6.8, 6.8, q.y));
  vec3 col = base + holo * (0.15 + 0.32 * fres + 0.14 * uActive);

  // Glare band travelling diagonally.
  float g = fract(q.x * 0.05 - q.y * 0.035 - uTime * 0.07);
  col += exp(-pow((g - 0.5) * 7.0, 2.0)) * (0.1 + 0.26 * uActive);

  // App-icon tile (top left).
  vec2 ic = vec2(-2.35, 4.75);
  float dIcon = rbox(q - ic, vec2(1.35), 0.42);
  vec2 iuv = (q - ic) / 2.7 + 0.5;
  vec3 iconCol = mix(uColorA, uColorB, 0.35) * 0.9;
  iconCol += vec3(1.0) * sparkle(q - ic - vec2(0.25, -0.1), 0.85) * 0.95;
  iconCol += vec3(1.0) * sparkle(q - ic - vec2(-0.6, 0.55), 0.4) * 0.8;
  iconCol += vec3(1.0) * sparkle(q - ic - vec2(-0.6, -0.65), 0.4) * 0.8;
  if (uHasMap > 0.5) iconCol = texture2D(uMap, iuv).rgb;
  col = mix(col, iconCol, smoothstep(0.03, -0.03, dIcon));

  // Name and detail bars.
  col = mix(col, vec3(0.92, 0.94, 1.0), smoothstep(0.03, -0.03, rbox(q - vec2(1.35, 5.15), vec2(1.9, 0.26), 0.12)) * 0.85);
  col = mix(col, vec3(0.7, 0.75, 0.95), smoothstep(0.03, -0.03, rbox(q - vec2(0.9, 4.45), vec2(1.45, 0.14), 0.07)) * 0.55);
  col = mix(col, vec3(0.7, 0.75, 0.95), smoothstep(0.03, -0.03, rbox(q - vec2(1.1, 4.05), vec2(1.2, 0.14), 0.07)) * 0.35);

  // NFC mark: concentric arcs that ripple outwards.
  vec2 nc = vec2(0.0, 0.2);
  vec2 np = q - nc;
  float r = length(np);
  float arc = smoothstep(0.55, 0.9, np.x / max(r, 0.001)) * step(r, 3.4);
  float ripple = 0.5 + 0.5 * sin(r * 4.2 - uTime * 1.6);
  col += holo * arc * pow(ripple, 3.0) * (0.55 + 0.4 * uActive);
  col += vec3(1.0) * smoothstep(0.32, 0.18, r) * 0.9;

  // Barcode strip.
  vec2 bp = q - vec2(0.0, -4.95);
  float inBar = step(abs(bp.x), 3.4) * step(abs(bp.y), 0.8);
  float cell = floor((bp.x + 3.4) * 5.5);
  float on = step(0.42, hash11(cell + 3.0)) * step(0.18, fract((bp.x + 3.4) * 5.5));
  col = mix(col, vec3(0.9, 0.93, 1.0) * 0.88, inBar * on * 0.8);

  // Inner border.
  float border = smoothstep(0.05, 0.0, abs(rbox(q, vec2(3.95, 6.55), 0.9)) - 0.02);
  col += mix(uColorA, vec3(1.0), 0.4) * border * 0.5;

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;
