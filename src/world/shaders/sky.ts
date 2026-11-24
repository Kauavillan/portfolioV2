import { NOISE_GLSL } from "./noise";

export const SKY_VERTEX = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
`;

// A faint nebula: two fbm layers tinted by the station's mood. Kept dark and
// low-contrast on purpose — text sits on top of it. Final dithering hides 8-bit
// banding in the gradients.
export const SKY_FRAGMENT = /* glsl */ `
uniform vec3 uInk;
uniform vec3 uTintA;
uniform vec3 uTintB;
uniform float uTime;
varying vec3 vDir;
${NOISE_GLSL}

void main() {
  vec3 d = normalize(vDir);
  vec3 q = d * 2.1 + vec3(uTime * 0.004, 0.0, uTime * 0.003);
  float a = fbm(q);
  float b = fbm(q * 1.9 + vec3(11.3, 4.1, 2.7));
  float cloud = smoothstep(0.34, 0.92, a * 0.9 + b * 0.45);
  float mixAB = clamp(b * 1.6 - 0.25 + d.y * 0.45, 0.0, 1.0);
  vec3 col = uInk;
  col += mix(uTintA, uTintB, mixAB) * cloud * 0.42;
  col += uTintB * pow(1.0 - abs(d.y), 3.0) * 0.05;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
  gl_FragColor.rgb += (hash31(vec3(gl_FragCoord.xy, uTime)) - 0.5) / 255.0;
}
`;
