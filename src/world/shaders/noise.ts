/**
 * Own GLSL value noise + fbm (written for this project). `OCTAVES` is a
 * `define` so the quality tiers can lower the cost of every fbm user.
 */
export const NOISE_GLSL = /* glsl */ `
float hash31(vec3 p) {
  p = fract(p * vec3(0.1597, 0.2315, 0.1837));
  p += dot(p, p.zxy + 31.37);
  return fract((p.x + p.y) * p.z);
}

float vnoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash31(i);
  float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash31(i + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z
  );
}

#ifndef OCTAVES
#define OCTAVES 3
#endif

float fbm(vec3 p) {
  float amplitude = 0.5;
  float sum = 0.0;
  for (int i = 0; i < OCTAVES; i++) {
    sum += amplitude * vnoise(p);
    p = p * 2.02 + vec3(5.3, 1.7, 9.2);
    amplitude *= 0.5;
  }
  return sum;
}
`;
