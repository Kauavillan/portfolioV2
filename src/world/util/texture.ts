import {
  DataTexture,
  LinearFilter,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
} from "three";

/**
 * Soft radial falloff (white → transparent), computed in JS: no image asset and
 * no 2D canvas (uploading a canvas can force a GPU readback on some browsers).
 */
export function createGlowTexture(size = 128): DataTexture {
  const data = new Uint8Array(size * size * 4);
  const half = (size - 1) / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - half, y - half) / half; // 0 centre → 1 edge
      // Bright core + soft halo, fading to exactly 0 at the edge.
      const falloff = Math.max(0, 1 - d);
      const alpha = Math.pow(falloff, 2.4) * 0.9 + Math.pow(falloff, 8) * 0.1;
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 255;
      data[i + 3] = Math.round(Math.min(1, alpha) * 255);
    }
  }
  const texture = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType);
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}
