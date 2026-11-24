// World engine entry point (three.js). The ONLY module the rest of the app may
// reach, and only through a dynamic `import("@world")` inside a client-component
// effect (ARCHITECTURE §2, §11). It never receives text and talks to the UI
// through the callbacks in `WorldOptions`.

import {
  ACESFilmicToneMapping,
  AmbientLight,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";
import { STATE } from "@lib/contract";
import { createEnvironment } from "./environment";
import {
  TIERS,
  createSampler,
  initialTier,
  type QualityEnv,
  type QualityName,
  type QualityTier,
} from "./quality";
import { createPicker } from "./picking";
import { loadComposer, type Post } from "./post";
import { createRig } from "./rig";
import { createApertureRegion } from "./scenes/aperture";
import { createBeaconRegion } from "./scenes/beacon";
import { createCoreRegion } from "./scenes/core";
import { createJourneyRegion } from "./scenes/journey";
import { createSkillsRegion } from "./scenes/skills";
import { createWorkRegion } from "./scenes/work";
import type { Region, Station, WorldHandle, WorldOptions } from "./types";
import { readCssColor } from "./util/css";
import { WORLD_SEED } from "./util/rng";
import { FADE_FLOOR, distanceFade } from "./util/ease";
import { yieldToMain } from "./util/yield";

export type {
  QualityName,
  QualityTier,
  Region,
  Station,
  StationEvent,
  WorldHandle,
  WorldOptions,
} from "./types";

/** Reduced motion: the canvas fades out/in while the pose swaps (ms). */
const CUT_SWAP_MS = 200;
const CUT_TOTAL_MS = 360;
/** Mood tint easing per frame at 60 fps. */
const MOOD_RATE = 0.02;

const abortError = () => new DOMException("World boot aborted", "AbortError");

export async function createWorld(o: WorldOptions): Promise<WorldHandle> {
  const { container, reduced } = o;
  const html = document.documentElement;
  const cleanups: (() => void)[] = [];
  let disposed = false;

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const fn of cleanups.splice(0).reverse()) {
      try {
        fn();
      } catch (error) {
        console.warn("[world] cleanup failed", error);
      }
    }
  };

  /** One boot stage: measured, then the main thread is handed back. */
  const stage = async <T>(name: string, fn: () => T | Promise<T>): Promise<T> => {
    const mark = `world:${name}:start`;
    performance.mark(mark);
    const result = await fn();
    performance.measure(`world:${name}`, mark);
    performance.clearMarks(mark);
    await yieldToMain();
    if (o.signal?.aborted) throw abortError();
    return result;
  };

  try {
    // ── quality (initial pick; applied after the scenes exist) ───────────
    const env: QualityEnv = {
      cores: navigator.hardwareConcurrency || 4,
      viewportWidth: window.innerWidth,
      deviceMemory: (navigator as { deviceMemory?: number }).deviceMemory,
      coarsePointer: window.matchMedia("(pointer: coarse)").matches,
    };
    let tierName: QualityName = initialTier(env);
    let tier: QualityTier = TIERS[tierName];
    const pixelRatioFor = (t: QualityTier) =>
      Math.min(window.devicePixelRatio || 1, t.dpr);

    // Declared up front: `resize` (first called inside the renderer stage) reaches them.
    const regions: Region[] = [];
    const viewport = { width: 1, height: 1, pixelRatio: 1 };
    let post: Post | null = null;
    let invalidate = () => {}; // reduced motion: "something changed outside the loop"
    // Culling of faded-out scenes starts after the compile stage: `compile` only
    // prepares what is visible, and anything hidden at that moment would compile
    // lazily (a hitch) the first time the camera brings it back.
    let culling = false;

    // ── renderer (includes the first sizing: allocating the drawing buffer is
    //    the most expensive part of creating a context on weak/software GPUs) ──
    const { renderer, scene, camera, ink, resize } = await stage("renderer", () => {
      const canvas = document.createElement("canvas");
      canvas.setAttribute("aria-hidden", "true");
      const renderer = new WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.toneMapping = ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.outputColorSpace = SRGBColorSpace;
      // Same color as the page (`--ink`) so the fade-in never "jumps".
      const ink = readCssColor(container, "--ink", "#06070e");
      renderer.setClearColor(ink);
      container.appendChild(canvas);
      cleanups.push(() => {
        renderer.dispose();
        renderer.forceContextLoss();
        canvas.remove();
      });

      const scene = new Scene();
      const camera = new PerspectiveCamera(42, 1, 0.5, 4000);
      const ambient = new AmbientLight("#6d78a6", 0.4);
      const sun = new DirectionalLight("#ffd9b8", 1.1);
      sun.position.set(30, 50, 40);
      scene.add(ambient, sun);

      const resize = () => {
        const rect = container.getBoundingClientRect();
        const width = Math.max(1, Math.round(rect.width));
        const height = Math.max(1, Math.round(rect.height));
        const pixelRatio = pixelRatioFor(tier);
        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.fov = camera.aspect < 0.8 ? 58 : 42; // portrait phones need a wider lens
        camera.updateProjectionMatrix();
        Object.assign(viewport, { width, height, pixelRatio });
        post?.setSize(width, height, pixelRatio);
        for (const region of regions) region.setViewport?.(width, height, pixelRatio);
      };
      resize();
      return { renderer, scene, camera, ink, resize };
    });

    // ── environment ──────────────────────────────────────────────────────
    const environment = await stage("environment", () => {
      const e = createEnvironment(renderer, scene, {
        ink,
        tier,
        pixelRatio: pixelRatioFor(tier),
        seed: WORLD_SEED,
      });
      cleanups.push(e.dispose);
      return e;
    });
    await stage("reflections", () => environment.bakeReflections());

    // ── regions (scenes) ─────────────────────────────────────────────────
    const addRegion = <R extends Region>(region: R): R => {
      scene.add(region.group);
      cleanups.push(region.dispose);
      regions.push(region);
      return region;
    };
    const core = await stage("core", () => addRegion(createCoreRegion({ reduced })));
    const aperture = await stage("aperture", () => addRegion(createApertureRegion({ reduced })));
    const work = await stage("artifacts", () =>
      addRegion(
        createWorkRegion({
          reduced,
          camera,
          projects: o.projects,
          maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
          signal: o.signal,
          invalidate: () => invalidate(),
          cull: () => culling,
        }),
      ),
    );
    const skills = await stage("skills", () =>
      addRegion(createSkillsRegion({ reduced, skillGroups: o.skillGroups })),
    );
    const journey = await stage("journey", () =>
      addRegion(createJourneyRegion({ reduced, milestoneCount: o.milestoneCount })),
    );
    const beacon = await stage("beacon", () => addRegion(createBeaconRegion({ reduced })));

    // ── rig ──────────────────────────────────────────────────────────────
    const stationMap: Record<string, Station> = Object.assign(
      {},
      ...regions.map((r) => r.stations),
    );
    const firstStation = Object.values(stationMap)[0];
    const rig = await stage("rig", () => {
      const r = createRig(camera, stationMap);
      r.rebuild();
      // Never leave the camera at the origin: start from the first station.
      camera.position.copy(firstStation.position);
      camera.lookAt(firstStation.target);
      if (reduced && r.active) r.snapTo(r.nearestIndexAt(window.scrollY));
      return r;
    });

    // ── quality ──────────────────────────────────────────────────────────
    const sampler = reduced ? null : createSampler(tierName);
    // Bloom lives on the high tier only: its chunk is fetched when the sampler first
    // steps up to `high`, and the composer is dropped again if the tier falls.
    let postLoading = false;
    const syncPost = () => {
      if (tier.bloom) {
        if (post || postLoading || disposed) return;
        postLoading = true;
        loadComposer(renderer, scene, camera, viewport)
          .then((loaded) => {
            postLoading = false;
            if (disposed || !tier.bloom) loaded.dispose();
            else {
              post = loaded;
              environment.setDither(false); // the composer's last pass dithers instead
              invalidate(); // reduced motion has no loop: draw the first composed frame
            }
          })
          .catch((error) => {
            postLoading = false;
            console.warn("[world] bloom unavailable, rendering directly:", error);
          });
      } else if (post) {
        post.dispose();
        post = null;
        environment.setDither(true);
        invalidate();
      }
    };
    cleanups.push(() => {
      post?.dispose();
      post = null;
    });

    const applyTier = (name: QualityName) => {
      tierName = name;
      tier = TIERS[name];
      resize(); // applies the tier's pixel ratio
      environment.setPixelRatio(pixelRatioFor(tier));
      environment.applyQuality(tier);
      regions.forEach((r) => r.setQuality?.(tier));
      syncPost();
      o.onQuality?.(name);
    };
    await stage("quality", () => applyTier(tierName));

    // ── frame ────────────────────────────────────────────────────────────
    const pointer = { x: 0, y: 0 };
    const parallax =
      !reduced && window.matchMedia("(pointer: fine)").matches;
    let time = 0;
    let reportedIndex = -1;

    const activeStation = (): { key: string | null; station: Station } => {
      const entry = rig.active ? rig.stationAt(rig.activeIndex) : undefined;
      return entry ?? { key: null, station: firstStation };
    };

    const renderFrame = (dt: number) => {
      if (!reduced) rig.update(dt, window.scrollY, pointer, parallax);
      o.onFrame(camera);

      const { key, station } = activeStation();
      if (key !== null && rig.activeIndex !== reportedIndex) {
        reportedIndex = rig.activeIndex;
        o.onStation({ index: reportedIndex, key, station });
      }
      const k = reduced ? 1 : 1 - Math.pow(1 - MOOD_RATE, dt * 60);
      environment.setMood(station.mood[0], station.mood[1], k);
      for (const region of regions) {
        if (region.fade) {
          const fade = distanceFade(
            camera.position.distanceTo(region.emitter),
            region.fade.near,
            region.fade.far,
          );
          region.group.scale.setScalar(fade);
          if (culling && region.fade.cull !== false) region.group.visible = fade > FADE_FLOOR;
        }
        region.update(time, key !== null && key in region.stations, dt, key);
      }
      environment.update(time, camera);
      if (post) post.render(dt);
      else renderer.render(scene, camera);
    };

    // Compile the shaders now, off the first visible frame.
    await stage("compile", async () => {
      renderFrame(1 / 60);
      if (renderer.extensions.has("KHR_parallel_shader_compile")) {
        await renderer.compileAsync(scene, camera);
      } else {
        renderer.compile(scene, camera);
      }
    });
    culling = true;

    // ── loop ─────────────────────────────────────────────────────────────
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = 0;
      const rawMs = now - last;
      last = now;
      const dt = Math.min(0.05, rawMs / 1000);
      time += dt;
      if (sampler && sampler.sample(rawMs, now) !== 0) applyTier(sampler.tier);
      picker.update(now);
      renderFrame(dt);
      schedule();
    };
    const schedule = () => {
      if (!raf && !disposed && !reduced && !document.hidden) {
        raf = requestAnimationFrame(loop);
      }
    };

    // Reduced motion: no loop; render when something changed ("dirty").
    let renderQueued = false;
    const requestRender = () => {
      if (renderQueued || disposed) return;
      renderQueued = true;
      requestAnimationFrame(() => {
        renderQueued = false;
        if (!disposed) renderFrame(0);
      });
    };
    invalidate = () => {
      if (reduced) requestRender();
    };

    // ── picking: hover + click on the project objects (T25) ──────────────
    const picker = createPicker({
      camera,
      container,
      pickables: work.pickables,
      // Only while the camera is in the work corridor: far objects seen through the fog are not clickable.
      enabled: () => {
        const key = rig.activeKey;
        return key !== null && key in work.stations;
      },
      hover: window.matchMedia("(pointer: fine)").matches,
      onDemand: reduced,
      onHover: (id) => {
        work.setHover(id);
        if (id !== null) o.onHover(id);
        if (reduced) requestRender();
      },
      onPick: (id) => o.onPick(id),
    });
    cleanups.push(picker.dispose);

    let cutSwap = 0;
    let cutEnd = 0;
    const startCut = (index: number) => {
      container.classList.add(STATE.isCut);
      window.clearTimeout(cutSwap);
      window.clearTimeout(cutEnd);
      cutSwap = window.setTimeout(() => {
        rig.snapTo(index);
        requestRender();
      }, CUT_SWAP_MS);
      cutEnd = window.setTimeout(() => container.classList.remove(STATE.isCut), CUT_TOTAL_MS);
    };
    const onScroll = () => {
      if (!rig.active) return;
      const next = rig.nearestIndexAt(window.scrollY);
      if (next !== rig.activeIndex) startCut(next);
    };

    const onVisibility = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      } else {
        last = performance.now(); // don't count the time spent hidden
        if (reduced) requestRender();
        else schedule();
      }
    };
    const onResize = () => {
      resize();
      rig.measure();
      if (reduced) requestRender();
    };
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointer.x = event.clientX / window.innerWidth - 0.5;
      pointer.y = event.clientY / window.innerHeight - 0.5;
    };
    const onContextLost = (event: Event) => {
      if (disposed) return;
      event.preventDefault();
      window.cancelAnimationFrame(raf);
      raf = 0;
      container.classList.remove(STATE.isReady);
      html.classList.add(STATE.noWebgl);
    };
    const onContextRestored = () => {
      if (disposed) return;
      html.classList.remove(STATE.noWebgl);
      container.classList.add(STATE.isReady);
      if (reduced) requestRender();
      else {
        last = performance.now();
        schedule();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", onResize);
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    renderer.domElement.addEventListener("webglcontextrestored", onContextRestored);
    if (parallax) window.addEventListener("pointermove", onPointer, { passive: true });
    if (reduced) window.addEventListener("scroll", onScroll, { passive: true });
    cleanups.push(() => {
      window.cancelAnimationFrame(raf);
      raf = 0;
      window.clearTimeout(cutSwap);
      window.clearTimeout(cutEnd);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      renderer.domElement.removeEventListener("webglcontextrestored", onContextRestored);
      container.classList.remove(STATE.isReady, STATE.isCut);
    });

    // First visible frame, then fade in (CSS does the 1.4s fade).
    renderFrame(1 / 60);
    container.classList.add(STATE.isReady);
    schedule();

    const handle: WorldHandle = {
      rig: { intro: rig.intro, focus: rig.focus },
      get quality() {
        return tierName;
      },
      emitters: [
        { key: "home", position: core.emitter },
        { key: "about", position: aperture.emitter },
        { key: "work", position: work.emitter },
        { key: "skills", position: skills.emitter },
        { key: "journey", position: journey.emitter },
        { key: "contact", position: beacon.emitter },
      ],
      projectEmitters: work.projectEmitters,
      lightSkill(key, on) {
        if (disposed) return;
        skills.light(key, on);
        if (reduced) requestRender();
      },
      refresh() {
        if (disposed) return;
        rig.rebuild();
        if (reduced && rig.active) {
          rig.snapTo(rig.nearestIndexAt(window.scrollY));
          requestRender();
        }
      },
      dispose,
    };
    return handle;
  } catch (error) {
    dispose();
    throw error;
  }
}
