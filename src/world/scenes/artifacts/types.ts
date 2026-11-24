import {
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  type BufferGeometry,
  type Color,
  type Group,
  type Texture,
} from "three";

export interface ArtifactOptions {
  /** The project's two mood colors, as linear `Color`s: artifacts are tinted by them. */
  colors: { a: Color; b: Color };
  reduced: boolean;
  /** Seed for any deterministic layout (the same world on every reload). */
  seed: number;
}

/** One procedural 3D object, centred on the origin and roughly ±10 units wide. */
export interface Artifact {
  group: Group;
  /** `active` = this project's station is the one in focus. */
  update(t: number, active: boolean, dt: number): void;
  /** Only called for kinds registered with `wantsTexture`, once the image has loaded. */
  setTexture?(texture: Texture): void;
  dispose(): void;
}

export interface ArtifactDef {
  create(options: ArtifactOptions): Artifact;
  /** The artifact can show the project's image (loaded lazily, ≤ 1024 px). */
  wantsTexture?: boolean;
}

/**
 * An invisible solid that makes sparse artifacts (lattices, graphs, wireframes)
 * easy to hit: a sphere (`radius`) or a box (`[width, height, depth]`) that follows
 * the object's silhouette. `visible = false` keeps it out of the draw calls, but
 * the raycaster still tests it.
 */
export function createHitProxy(shape: number | readonly [number, number, number]): Mesh {
  const geometry: BufferGeometry =
    typeof shape === "number"
      ? new SphereGeometry(shape, 12, 8)
      : new BoxGeometry(shape[0], shape[1], shape[2]);
  const proxy = new Mesh(geometry, new MeshBasicMaterial());
  proxy.visible = false;
  proxy.name = "hit-proxy";
  return proxy;
}
