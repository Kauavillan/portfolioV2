import {
  Texture,
  type BufferGeometry,
  type InstancedMesh,
  type Material,
  type Object3D,
} from "three";

/** Disposes a material and every texture it holds (maps and shader uniforms). */
export function disposeMaterial(material: Material): void {
  for (const value of Object.values(material)) {
    if (value instanceof Texture) value.dispose();
  }
  const uniforms = (material as { uniforms?: Record<string, { value: unknown }> }).uniforms;
  if (uniforms) {
    for (const uniform of Object.values(uniforms)) {
      if (uniform.value instanceof Texture) uniform.value.dispose();
    }
  }
  material.dispose();
}

/** Walks an object tree releasing geometries, materials, textures and instance buffers. */
export function disposeObject(root: Object3D): void {
  root.traverse((object) => {
    const node = object as {
      geometry?: BufferGeometry;
      material?: Material | Material[];
    };
    node.geometry?.dispose();
    if (Array.isArray(node.material)) node.material.forEach(disposeMaterial);
    else if (node.material) disposeMaterial(node.material);
    if ((object as InstancedMesh).isInstancedMesh) (object as InstancedMesh).dispose();
  });
}
