import {
  DataTexture,
  LinearFilter,
  RGBAFormat,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  UnsignedByteType,
} from "three";

/** Largest image (px, per side) that may become a texture. */
export const MAX_TEXTURE_SIZE = 1024;

/**
 * Loads a project image as a color texture. Resolves `null` — the artifact then
 * keeps working from geometry and shaders alone — when the image fails to load,
 * the load is aborted, or the image is larger than `MAX_TEXTURE_SIZE` (the
 * large screenshots wait for the optimized variants of T31).
 */
export async function loadProjectTexture(
  src: string,
  anisotropy: number,
  signal?: AbortSignal,
): Promise<Texture | null> {
  try {
    const texture = await new TextureLoader().loadAsync(src);
    const image = texture.image as { width: number; height: number };
    if (signal?.aborted || Math.max(image.width, image.height) > MAX_TEXTURE_SIZE) {
      texture.dispose();
      return null;
    }
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = anisotropy;
    return texture;
  } catch {
    return null;
  }
}

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
