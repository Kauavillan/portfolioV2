// The audio graph (T28): ambience, spatial emitters, reverb and the interface
// sounds. Everything is generated in real time — there are no audio files.
//
//   ambient bus ─┬──────────────────────────┐
//   interaction bus ────────────────────────┼─► master ─► (compressor ─► out)
//   reverb in ─► convolver (generated IR) ─► wet ┘
//
// This module is loaded by `engine.ts` with a dynamic `import()` the first time
// sound is turned on, so none of it is in the initial bundle. The engine owns
// the `AudioContext`, the master gain and the compressor; this file builds
// everything that feeds `master`.

import type { SectorKey } from "@data/types";
import {
  DRONE,
  SECTOR_DYADS,
  SECTOR_LFO_HZ,
  arriveChord,
  fillImpulse,
  fillNoise,
  listenerPose,
  poseChanged,
  type ListenerPose,
} from "./material";
import type { EmitterInput, ListenerSource, SoundCategory, Vec3 } from "./pure";

export interface GraphOptions {
  /** The graph's output: already wired to the compressor and the destination. */
  master: GainNode;
  ambient: boolean;
  interaction: boolean;
  emitters: readonly EmitterInput[];
  /** The camera as last reported (`null` before the first frame). */
  source: ListenerSource | null;
}

export interface AudioGraph {
  setBus(category: SoundCategory, on: boolean): void;
  setEmitters(list: readonly EmitterInput[]): void;
  /** Moves the Web Audio listener to the camera pose; skipped when it has not moved. */
  applyListener(source: ListenerSource): void;
  arrive(target: Vec3, index: number): void;
  open(): void;
  close(): void;
  hover(at?: Vec3): void;
  dispose(): void;
}

// ── Constants (own tuning; the numbers are behavior, not a copy) ───────────
const DRONE_GAIN = 0.085;
const DRONE_CUTOFF = 380;
const DRONE_CUTOFF_DEPTH = 160;
const DRONE_CUTOFF_LFO_HZ = 0.045;
const AIR_GAIN = 0.022;
const AIR_CENTER = 520;
const AIR_DEPTH = 260;
const AIR_FILTER_LFO_HZ = 0.03;
const AIR_PAN_LFO_HZ = 0.02;
const AIR_PAN_DEPTH = 0.7;
const REVERB_SECONDS = 3.2;
const REVERB_WET = 0.32;
const AMBIENT_REVERB_SEND = 0.3;

const EMITTER_GAIN = 0.05;
const EMITTER_LFO_DEPTH = 0.03;
const EMITTER_REF_DISTANCE = 24;
const EMITTER_ROLLOFF = 1.3;
const EMITTER_MAX_DISTANCE = 600;

/** Interface sounds are placed in space with a gentler falloff than the ambience. */
const UI_REF_DISTANCE = 48;
const UI_ROLLOFF = 0.8;

const ARRIVE_PEAK = 0.11;
const ARRIVE_WEIGHTS = [0.6, 0.3, 0.15] as const;
const ARRIVE_ATTACK = 0.02;
const ARRIVE_DECAY = 2.4;
const ARRIVE_SEND = 0.45;
const MAX_ARRIVALS = 3;

const LISTENER_TAU = 0.05;
const BUS_TAU = 0.08;

interface Emitter {
  panner: PannerNode;
  gain: GainNode;
  nodes: AudioScheduledSourceNode[];
}

interface Voice {
  env: GainNode;
  oscillators: OscillatorNode[];
}

function setParam(param: AudioParam | undefined, value: number): void {
  if (param) param.value = value;
}

/** Sets a panner's position (modern AudioParams, with the legacy setter as fallback). */
function placePanner(panner: PannerNode, at: Vec3): void {
  if (panner.positionX) {
    setParam(panner.positionX, at.x);
    setParam(panner.positionY, at.y);
    setParam(panner.positionZ, at.z);
  } else {
    panner.setPosition(at.x, at.y, at.z);
  }
}

/** Exponential approach to `value` (time constant `tau`), from the current value: no jump, no click. */
function smooth(ctx: AudioContext, param: AudioParam, value: number, tau: number): void {
  const now = ctx.currentTime;
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.setTargetAtTime(value, now, tau);
}

function createReverbBuffer(ctx: AudioContext): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * REVERB_SECONDS));
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  fillImpulse(buffer.getChannelData(0), 0x5eed01);
  fillImpulse(buffer.getChannelData(1), 0x5eed02);
  return buffer;
}

export function createAudioGraph(ctx: AudioContext, options: GraphOptions): AudioGraph {
  const { master } = options;
  let disposed = false;
  let lastPose: ListenerPose | null = null;
  const emitters = new Map<SectorKey, Emitter>();
  const voices: Voice[] = [];

  // ── Buses and reverb ─────────────────────────────────────────────────────
  const ambientBus = ctx.createGain();
  ambientBus.gain.value = options.ambient ? 1 : 0;
  const interactionBus = ctx.createGain();
  interactionBus.gain.value = options.interaction ? 1 : 0;
  ambientBus.connect(master);
  interactionBus.connect(master);

  // Everything that wants space sends into `reverbIn`.
  const reverbIn = ctx.createGain();
  const convolver = ctx.createConvolver();
  convolver.buffer = createReverbBuffer(ctx);
  const wet = ctx.createGain();
  wet.gain.value = REVERB_WET;
  reverbIn.connect(convolver).connect(wet).connect(master);
  const ambientSend = ctx.createGain();
  ambientSend.gain.value = AMBIENT_REVERB_SEND;
  ambientBus.connect(ambientSend).connect(reverbIn);

  // ── Ambience: drone + air ────────────────────────────────────────────────
  // Drone: three low oscillators → lowpass whose cutoff drifts slowly.
  const droneFilter = ctx.createBiquadFilter();
  droneFilter.type = "lowpass";
  droneFilter.frequency.value = DRONE_CUTOFF;
  droneFilter.Q.value = 0.6;
  const droneGain = ctx.createGain();
  droneGain.gain.value = DRONE_GAIN;
  droneFilter.connect(droneGain).connect(ambientBus);
  for (const voice of DRONE) {
    const osc = ctx.createOscillator();
    osc.type = voice.type;
    osc.frequency.value = voice.hz;
    osc.detune.value = voice.detune;
    osc.connect(droneFilter);
    osc.start();
  }
  const droneLfo = ctx.createOscillator();
  droneLfo.frequency.value = DRONE_CUTOFF_LFO_HZ;
  const droneLfoDepth = ctx.createGain();
  droneLfoDepth.gain.value = DRONE_CUTOFF_DEPTH;
  droneLfo.connect(droneLfoDepth).connect(droneFilter.frequency);
  droneLfo.start();

  // Air: looped noise → bandpass (drifting) → slow stereo pan.
  const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  fillNoise(noise.getChannelData(0), 0xa17001);
  const air = ctx.createBufferSource();
  air.buffer = noise;
  air.loop = true;
  const airFilter = ctx.createBiquadFilter();
  airFilter.type = "bandpass";
  airFilter.frequency.value = AIR_CENTER;
  airFilter.Q.value = 0.8;
  const airLfo = ctx.createOscillator();
  airLfo.frequency.value = AIR_FILTER_LFO_HZ;
  const airLfoDepth = ctx.createGain();
  airLfoDepth.gain.value = AIR_DEPTH;
  airLfo.connect(airLfoDepth).connect(airFilter.frequency);
  const airPan = ctx.createStereoPanner();
  const panLfo = ctx.createOscillator();
  panLfo.frequency.value = AIR_PAN_LFO_HZ;
  const panDepth = ctx.createGain();
  panDepth.gain.value = AIR_PAN_DEPTH;
  panLfo.connect(panDepth).connect(airPan.pan);
  const airGain = ctx.createGain();
  airGain.gain.value = AIR_GAIN;
  air.connect(airFilter).connect(airPan).connect(airGain);
  airGain.connect(ambientBus);
  airGain.connect(reverbIn);
  air.start();
  airLfo.start();
  panLfo.start();

  // ── Spatial emitters ─────────────────────────────────────────────────────
  const removeEmitter = (key: SectorKey) => {
    const emitter = emitters.get(key);
    if (!emitter) return;
    emitters.delete(key);
    for (const node of emitter.nodes) {
      try {
        node.stop();
      } catch {
        /* already stopped */
      }
    }
    emitter.panner.disconnect();
    emitter.gain.disconnect();
  };

  const addEmitter = (key: SectorKey, position: Vec3) => {
    const panner = ctx.createPanner();
    panner.panningModel = "HRTF";
    panner.distanceModel = "inverse";
    panner.refDistance = EMITTER_REF_DISTANCE;
    panner.rolloffFactor = EMITTER_ROLLOFF;
    panner.maxDistance = EMITTER_MAX_DISTANCE;
    placePanner(panner, position);
    const gain = ctx.createGain();
    gain.gain.value = EMITTER_GAIN;
    gain.connect(panner).connect(ambientBus);

    // A dyad of sine waves with a slow gain LFO: each sector hums in its own interval.
    const nodes: AudioScheduledSourceNode[] = [];
    for (const hz of SECTOR_DYADS[key]) {
      const osc = ctx.createOscillator();
      osc.frequency.value = hz;
      osc.connect(gain);
      osc.start();
      nodes.push(osc);
    }
    const lfo = ctx.createOscillator();
    lfo.frequency.value = SECTOR_LFO_HZ[key];
    const depth = ctx.createGain();
    depth.gain.value = EMITTER_LFO_DEPTH;
    lfo.connect(depth).connect(gain.gain);
    lfo.start();
    nodes.push(lfo);

    emitters.set(key, { panner, gain, nodes });
  };

  const setEmitters = (list: readonly EmitterInput[]) => {
    const wanted = new Map(list.map((e) => [e.key, e.position]));
    for (const key of [...emitters.keys()]) if (!wanted.has(key)) removeEmitter(key);
    for (const [key, position] of wanted) {
      const existing = emitters.get(key);
      if (existing) placePanner(existing.panner, position);
      else addEmitter(key, position);
    }
  };

  // ── Listener ─────────────────────────────────────────────────────────────
  /** `snap` skips the smoothing (the very first pose must not glide in from the origin). */
  const aimListener = (source: ListenerSource, snap: boolean) => {
    const pose = listenerPose(source);
    if (!snap && !poseChanged(lastPose, pose)) return;
    lastPose = pose;
    const { listener, currentTime } = ctx;
    const { position: p, forward: f, up: u } = pose;
    if (listener.positionX) {
      const aim = (param: AudioParam, value: number) => {
        if (snap) param.value = value;
        else param.setTargetAtTime(value, currentTime, LISTENER_TAU);
      };
      aim(listener.positionX, p.x);
      aim(listener.positionY, p.y);
      aim(listener.positionZ, p.z);
      aim(listener.forwardX, f.x);
      aim(listener.forwardY, f.y);
      aim(listener.forwardZ, f.z);
      aim(listener.upX, u.x);
      aim(listener.upY, u.y);
      aim(listener.upZ, u.z);
    } else {
      listener.setPosition(p.x, p.y, p.z);
      listener.setOrientation(f.x, f.y, f.z, u.x, u.y, u.z);
    }
  };

  // ── One-shot sounds ──────────────────────────────────────────────────────
  const spatial = (at: Vec3): PannerNode => {
    const panner = ctx.createPanner();
    panner.panningModel = "HRTF";
    panner.distanceModel = "inverse";
    panner.refDistance = UI_REF_DISTANCE;
    panner.rolloffFactor = UI_ROLLOFF;
    panner.maxDistance = EMITTER_MAX_DISTANCE;
    placePanner(panner, at);
    return panner;
  };

  /** A short glide from `from` to `to` Hz with an exponential decay; centered unless `at` is given. */
  const blip = (from: number, to: number, seconds: number, peak: number, at?: Vec3) => {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(from, t);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t + seconds);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(peak, t + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    const send = ctx.createGain();
    send.gain.value = 0.3;
    osc.connect(env);
    const panner = at ? spatial(at) : null;
    const out: AudioNode = panner ?? env;
    if (panner) env.connect(panner);
    out.connect(interactionBus);
    out.connect(send).connect(reverbIn);
    osc.onended = () => {
      osc.disconnect();
      env.disconnect();
      send.disconnect();
      panner?.disconnect();
    };
    osc.start(t);
    osc.stop(t + seconds + 0.05);
  };

  const releaseVoice = (voice: Voice) => {
    const t = ctx.currentTime;
    voice.env.gain.cancelScheduledValues(t);
    voice.env.gain.setValueAtTime(voice.env.gain.value, t);
    voice.env.gain.linearRampToValueAtTime(0, t + 0.08);
    for (const osc of voice.oscillators) {
      try {
        osc.stop(t + 0.1);
      } catch {
        /* already stopped */
      }
    }
  };

  // ── Initial state ────────────────────────────────────────────────────────
  setEmitters(options.emitters);
  if (options.source) aimListener(options.source, true);

  return {
    setBus(category, on) {
      const bus = category === "ambient" ? ambientBus : interactionBus;
      smooth(ctx, bus.gain, on ? 1 : 0, BUS_TAU);
    },

    setEmitters,

    applyListener(source) {
      if (!disposed) aimListener(source, false);
    },

    arrive(target, index) {
      if (disposed) return;
      const t = ctx.currentTime;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(ARRIVE_PEAK, t + ARRIVE_ATTACK);
      env.gain.exponentialRampToValueAtTime(0.0001, t + ARRIVE_DECAY);
      const panner = spatial(target);
      const send = ctx.createGain();
      send.gain.value = ARRIVE_SEND;
      env.connect(panner);
      panner.connect(interactionBus);
      panner.connect(send).connect(reverbIn);

      const chord = arriveChord(index);
      const oscillators = chord.map((hz, i) => {
        const osc = ctx.createOscillator();
        osc.frequency.value = hz;
        const weight = ctx.createGain();
        weight.gain.value = ARRIVE_WEIGHTS[i] ?? 0.1;
        osc.connect(weight).connect(env);
        osc.start(t);
        osc.stop(t + ARRIVE_DECAY + 0.05);
        return osc;
      });

      const voice: Voice = { env, oscillators };
      oscillators[0].onended = () => {
        const at = voices.indexOf(voice);
        if (at >= 0) voices.splice(at, 1);
        for (const osc of oscillators) osc.disconnect();
        env.disconnect();
        panner.disconnect();
        send.disconnect();
      };
      voices.push(voice);
      // A long jump across the page passes several stations: keep the newest few.
      while (voices.length > MAX_ARRIVALS) {
        const oldest = voices.shift();
        if (oldest) releaseVoice(oldest);
      }
    },

    open() {
      if (!disposed) blip(784, 470, 0.2, 0.07);
    },

    close() {
      if (!disposed) blip(420, 560, 0.16, 0.06);
    },

    hover(at) {
      if (!disposed) blip(1480, 1480, 0.09, 0.025, at);
    },

    dispose() {
      disposed = true;
      voices.length = 0;
      emitters.clear();
    },
  };
}
