// Audio engine (T28): state, preferences and the AudioContext lifecycle.
//
// Everything is generated in real time — there are no audio files. This file is
// deliberately small because it is part of the initial bundle: it owns the
// state, the autoplay-policy dance and the `AudioContext` + master gain +
// compressor. The sound itself (ambience, spatial emitters, reverb, interface
// sounds) is `./graph`, loaded with a dynamic `import()` the first time sound
// starts, so no WebAudio graph code ships until a visitor turns sound on.
//
// `AudioContext` is created only after a user gesture AND with sound enabled;
// until then nothing here allocates anything. Pure helpers: `./pure`, `./prefs`.

import { ATTR, sel } from "@lib/contract";
import type { AudioGraph } from "./graph";
import { loadPrefs, savePrefs, clamp01, type SoundPrefs } from "./prefs";
import {
  FADE_IN_S,
  FADE_OUT_S,
  HOVER_THROTTLE_MS,
  SUSPEND_DELAY_MS,
  createThrottle,
  masterTarget,
  type EmitterInput,
  type ListenerSource,
  type SoundCategory,
  type Vec3,
} from "./pure";

export type { EmitterInput, ListenerSource, SoundCategory, Vec3 };

export interface SoundState extends SoundPrefs {
  /** `mount()` ran: the client knows what the browser supports and what was saved. */
  ready: boolean;
  /** The browser has Web Audio. */
  supported: boolean;
  /** Sound is on but the browser has not let it start yet (autoplay policy). */
  waiting: boolean;
  /** Channels of the output device (2 until a context exists). */
  channels: number;
}

export interface SoundEngine {
  getState(): SoundState;
  /** The state the server (and the first client render) uses. */
  getServerState(): SoundState;
  subscribe(listener: () => void): () => void;
  /** Reads prefs, wires the gesture/visibility listeners. Returns the cleanup (closes the context). */
  mount(): () => void;
  setEnabled(on: boolean): void;
  setVolume(volume: number): void;
  setCategory(category: SoundCategory, on: boolean): void;
  /** One spatial source per sector, at the positions the world reports. `[]` removes them. */
  setEmitters(list: readonly EmitterInput[]): void;
  /** Call every frame: the listener follows the camera. Cheap when sound is off. */
  updateListener(camera: ListenerSource): void;
  /** Arrival chord at a station (`target` = what the camera looks at). */
  arrive(target: Vec3, index: number): void;
  open(): void;
  close(): void;
  /** Hover tick (throttled), optionally placed in space. */
  hover(at?: Vec3): void;
}

const RESUME_FADE_S = 0.4;
const GESTURE_EVENTS = ["pointerdown", "pointerup", "keydown"] as const;

type AudioContextCtor = typeof AudioContext;

function audioContextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as typeof globalThis & { webkitAudioContext?: AudioContextCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/** The context and the three nodes that never change; `graph` arrives once its chunk has loaded. */
interface Runtime {
  ctx: AudioContext;
  master: GainNode;
  graph: AudioGraph | null;
  onStateChange: () => void;
}

const INITIAL_STATE: SoundState = {
  enabled: false,
  volume: 0.6,
  ambient: true,
  interaction: true,
  ready: false,
  supported: false,
  waiting: false,
  channels: 2,
};

/** Glides `param` to `value` with a linear ramp, starting from where it is now (no jump, no click). */
function ramp(ctx: AudioContext, param: AudioParam, value: number, seconds: number): void {
  const now = ctx.currentTime;
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.linearRampToValueAtTime(value, now + seconds);
}

/** Exponential approach to `value` (time constant `tau`), from the current value. */
function smooth(ctx: AudioContext, param: AudioParam, value: number, tau: number): void {
  const now = ctx.currentTime;
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.setTargetAtTime(value, now, tau);
}

export function createSoundEngine(): SoundEngine {
  let state: SoundState = INITIAL_STATE;
  const listeners = new Set<() => void>();
  let rt: Runtime | null = null;
  let mounted = false;
  let suspendTimer = 0;
  let gesturesArmed = false;
  let lastSource: ListenerSource | null = null;
  let emitterList: EmitterInput[] = [];
  const hoverThrottle = createThrottle(HOVER_THROTTLE_MS);

  // ── State ────────────────────────────────────────────────────────────────
  const setState = (patch: Partial<SoundState>) => {
    const changed = (Object.keys(patch) as (keyof SoundState)[]).some(
      (key) => state[key] !== patch[key],
    );
    if (!changed) return;
    state = { ...state, ...patch };
    listeners.forEach((fn) => fn());
  };

  const persist = () =>
    savePrefs({
      enabled: state.enabled,
      volume: state.volume,
      ambient: state.ambient,
      interaction: state.interaction,
    });

  const isRunning = () => rt !== null && rt.ctx.state === "running";
  const syncWaiting = () => setState({ waiting: state.enabled && !isRunning() });

  // ── Context ──────────────────────────────────────────────────────────────
  /** The graph chunk, requested once per context. A failure leaves sound silent, never broken. */
  const loadGraph = (r: Runtime) => {
    import("./graph")
      .then(({ createAudioGraph }) => {
        if (rt !== r) return; // closed while the chunk was loading
        r.graph = createAudioGraph(r.ctx, {
          master: r.master,
          ambient: state.ambient,
          interaction: state.interaction,
          emitters: emitterList,
          source: lastSource,
        });
      })
      .catch((error) => console.warn("[audio] could not load the sound engine:", error));
  };

  /** Created synchronously, inside the user gesture that asked for sound (Safari insists). */
  const ensureRuntime = (): Runtime | null => {
    if (rt) return rt;
    const Ctor = audioContextCtor();
    if (!Ctor) return null;
    let ctx: AudioContext;
    try {
      ctx = new Ctor({ latencyHint: "playback" });
    } catch {
      setState({ supported: false, enabled: false, waiting: false });
      return null;
    }
    const master = ctx.createGain();
    master.gain.value = 0; // silent until the fade-in
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.ratio.value = 3;
    master.connect(compressor).connect(ctx.destination);

    const r: Runtime = {
      ctx,
      master,
      graph: null,
      onStateChange: () => {
        if (rt !== r) return;
        if (ctx.state === "running") disarmGestures();
        syncWaiting();
      },
    };
    ctx.addEventListener("statechange", r.onStateChange);
    rt = r;
    setState({ channels: ctx.destination.maxChannelCount || 2 });
    loadGraph(r);
    return r;
  };

  const teardown = () => {
    const r = rt;
    rt = null;
    if (!r) return;
    r.ctx.removeEventListener("statechange", r.onStateChange);
    r.graph?.dispose();
    void r.ctx.close().catch(() => {});
  };

  // ── Start / stop ─────────────────────────────────────────────────────────
  function disarmGestures() {
    if (!gesturesArmed) return;
    gesturesArmed = false;
    for (const type of GESTURE_EVENTS) window.removeEventListener(type, onGesture, true);
  }

  function armGestures() {
    if (gesturesArmed || typeof window === "undefined") return;
    gesturesArmed = true;
    for (const type of GESTURE_EVENTS) window.addEventListener(type, onGesture, true);
  }

  /** The first pointer/key event after load lets a saved "on" preference start (autoplay policy). */
  function onGesture(event: Event) {
    // The sound control starts it itself (a click on it must not be pre-empted).
    if (event.target instanceof Element && event.target.closest(sel(ATTR.sound))) return;
    if (state.enabled && !document.hidden) start(FADE_IN_S);
  }

  function start(fadeSeconds: number) {
    if (!state.enabled || !state.supported) return;
    const r = ensureRuntime();
    if (!r) return;
    window.clearTimeout(suspendTimer);
    ramp(r.ctx, r.master.gain, masterTarget(state.volume), fadeSeconds);
    const settle = () => {
      if (r.ctx.state === "running") disarmGestures();
      else if (state.enabled) armGestures();
      syncWaiting();
    };
    r.ctx.resume().then(settle, settle);
    // Not allowed yet (no activation): try again on the next gesture.
    if (r.ctx.state !== "running") armGestures();
    syncWaiting();
  }

  /** Fades out; then suspends unless `keepGoing()` says sound came back in the meantime. */
  function fadeOutAndSuspend(r: Runtime, stillWanted: () => boolean) {
    window.clearTimeout(suspendTimer);
    ramp(r.ctx, r.master.gain, 0, FADE_OUT_S);
    suspendTimer = window.setTimeout(() => {
      if (rt === r && !stillWanted()) void r.ctx.suspend().catch(() => {});
    }, SUSPEND_DELAY_MS);
  }

  function halt() {
    disarmGestures();
    window.clearTimeout(suspendTimer);
    if (rt) fadeOutAndSuspend(rt, () => state.enabled);
    syncWaiting();
  }

  const onVisibility = () => {
    if (!state.enabled || !rt) return;
    if (document.hidden) fadeOutAndSuspend(rt, () => !document.hidden);
    else start(RESUME_FADE_S);
  };

  // ── One-shot sounds ──────────────────────────────────────────────────────
  /** Playable now: sound on, running, graph loaded, and the category switched on. */
  const canPlay = (category: SoundCategory): AudioGraph | null => {
    if (!state.enabled || !state[category] || !isRunning()) return null;
    return rt?.graph ?? null;
  };

  // ── API ──────────────────────────────────────────────────────────────────
  return {
    getState: () => state,
    getServerState: () => INITIAL_STATE,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    mount() {
      if (mounted) return () => {};
      mounted = true;
      const prefs = loadPrefs();
      const supported = audioContextCtor() !== null;
      state = { ...state, ...prefs, supported, enabled: supported && prefs.enabled, ready: true, waiting: false };
      listeners.forEach((fn) => fn());
      document.addEventListener("visibilitychange", onVisibility);
      // A saved "on" needs a user gesture before touching audio. Normally that is the
      // first pointer/key event after load; but if the visitor already interacted with
      // this document (a language switch remounts everything) the browser has no
      // objection, so sound picks up where it was.
      if (state.enabled) {
        if (navigator.userActivation?.hasBeenActive) start(FADE_IN_S);
        else armGestures();
        syncWaiting();
      }
      return () => {
        mounted = false;
        document.removeEventListener("visibilitychange", onVisibility);
        disarmGestures();
        window.clearTimeout(suspendTimer);
        teardown();
        setState({ ready: false, waiting: false, channels: INITIAL_STATE.channels });
      };
    },

    setEnabled(on) {
      if (!state.supported) return;
      if (state.enabled === on) {
        // Already on but the browser had not let it start: a click is the gesture it needed.
        if (on && !isRunning()) start(FADE_IN_S);
        return;
      }
      setState({ enabled: on });
      persist();
      if (on) start(FADE_IN_S);
      else halt();
    },

    setVolume(volume) {
      const next = clamp01(volume);
      if (next === state.volume) return;
      setState({ volume: next });
      persist();
      if (rt && state.enabled) smooth(rt.ctx, rt.master.gain, masterTarget(next), 0.04);
    },

    setCategory(category, on) {
      if (state[category] === on) return;
      setState({ [category]: on } as Pick<SoundState, SoundCategory>);
      persist();
      rt?.graph?.setBus(category, on);
    },

    setEmitters(list) {
      emitterList = list.map((e) => ({
        key: e.key,
        position: { x: e.position.x, y: e.position.y, z: e.position.z },
      }));
      rt?.graph?.setEmitters(emitterList);
    },

    updateListener(camera) {
      lastSource = camera;
      if (!state.enabled || !isRunning()) return;
      rt?.graph?.applyListener(camera);
    },

    arrive(target, index) {
      canPlay("interaction")?.arrive(target, index);
    },

    open() {
      canPlay("interaction")?.open();
    },

    close() {
      canPlay("interaction")?.close();
    },

    hover(at) {
      const graph = canPlay("interaction");
      if (graph && hoverThrottle.allow(performance.now())) graph.hover(at);
    },
  };
}
