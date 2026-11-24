// Bloom (F25): a soft glow on the emissives, on the HIGH tier only.
//
// The composer and its passes are `import()`ed here, on demand, so a visitor on
// the low/medium tiers never downloads a byte of them. `loadComposer` is only
// called after the FPS sampler has stepped up to `high` (the world never boots
// on it), and the result is thrown away again if the tier drops.
//
// Colour pipeline: with a composer, the scene is rendered into a half-float
// target, where three applies neither tone mapping nor the sRGB encoding. The
// final `OutputPass` applies BOTH once, reading `renderer.toneMapping` — so the
// renderer keeps its ACES setting and nothing is tone-mapped twice.

import {
  HalfFloatType,
  Vector2,
  WebGLRenderTarget,
  type Camera,
  type Scene,
  type WebGLRenderer,
} from "three";

/** Starting parameters of the bloom; tuned against the scene (see ARCHITECTURE §13). */
export const BLOOM = { strength: 0.55, radius: 0.6, threshold: 0.82 } as const;
/** MSAA samples of the composer's render target (the canvas' own antialiasing doesn't reach it). */
const SAMPLES = 4;

/** ±½ LSB of triangular-free interleaved-gradient noise, added after the sRGB encode. */
const DITHER = {
  uniforms: { tDiffuse: { value: null } },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    float ign(vec2 p) {
      return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
    }
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      c.rgb += (ign(gl_FragCoord.xy) - 0.5) / 255.0;
      gl_FragColor = c;
    }`,
};

export interface Post {
  render(dt: number): void;
  /** CSS pixels + pixel ratio, like the renderer. */
  setSize(width: number, height: number, pixelRatio: number): void;
  dispose(): void;
}

export interface PostSize {
  width: number;
  height: number;
  pixelRatio: number;
}

export async function loadComposer(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  size: PostSize,
): Promise<Post> {
  const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }, { ShaderPass }] =
    await Promise.all([
      import("three/examples/jsm/postprocessing/EffectComposer.js"),
      import("three/examples/jsm/postprocessing/RenderPass.js"),
      import("three/examples/jsm/postprocessing/UnrealBloomPass.js"),
      import("three/examples/jsm/postprocessing/OutputPass.js"),
      import("three/examples/jsm/postprocessing/ShaderPass.js"),
    ]);

  const target = new WebGLRenderTarget(size.width, size.height, {
    type: HalfFloatType,
    samples: SAMPLES,
  });
  const composer = new EffectComposer(renderer, target);
  const renderPass = new RenderPass(scene, camera);
  const bloom = new UnrealBloomPass(
    new Vector2(size.width / 2, size.height / 2),
    BLOOM.strength,
    BLOOM.radius,
    BLOOM.threshold,
  );
  const output = new OutputPass();
  // Last, in display space: the sky's own dither cannot survive the linear half-float target.
  const dither = new ShaderPass(DITHER);
  composer.addPass(renderPass);
  composer.addPass(bloom);
  composer.addPass(output);
  composer.addPass(dither);

  const post: Post = {
    render: (dt) => composer.render(dt),
    setSize(width, height, pixelRatio) {
      composer.setPixelRatio(pixelRatio);
      composer.setSize(width, height);
    },
    dispose() {
      composer.dispose(); // render targets and the copy pass
      renderPass.dispose();
      bloom.dispose();
      output.dispose();
      dither.dispose();
    },
  };
  post.setSize(size.width, size.height, size.pixelRatio);
  // Shader programs depend on the render target they draw into, so the composer's
  // variants are compiled now instead of stalling its first frame.
  renderer.setRenderTarget(target);
  try {
    if (renderer.extensions.has("KHR_parallel_shader_compile")) {
      await renderer.compileAsync(scene, camera);
    } else {
      renderer.compile(scene, camera);
    }
  } finally {
    renderer.setRenderTarget(null);
  }
  return post;
}
