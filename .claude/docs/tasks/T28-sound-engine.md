# T28 — Procedural audio engine

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 3 · M4 | L | T06 (emitters: T15/T18) | F26, F27, F28 |

## Goal
**Real-time generated** sound (no audio files): ambience, spatial emitters per sector that follow the camera, and interface sounds — off by default.

## Scope
- **`src/audio/engine.ts`** with `state`, `subscribe`, `setEnabled`, `setVolume`, `setCategory('ambient'|'interaction', on)`, `setEmitters(list)`, `updateListener(camera)`, `arrive(target, index)`, `open()`, `close()`, `hover()` (API from `ARCHITECTURE.md` §7).
- **Graph (F26):** `master gain → DynamicsCompressor (threshold −18, ratio 3) → destination`; **ambient bus** = drone of 3 low oscillators (≈ 55/82/110 Hz, small detunes) → lowpass (~380 Hz) with a slow LFO on the cutoff + "air" (looped white noise → bandpass with LFO → `StereoPanner` with LFO); **interaction bus**; **reverb** via `ConvolverNode` with a **generated** impulse response (stereo noise ≈ 3.2 s, cubic decay), return ≈ .32. Use **your own** tuning/notes (F26 values are a starting point).
- **Emitters (F27):** one per sector (`home, about, work, skills, journey, contact`) with an **HRTF** `PannerNode` (`inverse`, refDistance ≈ 24, rolloff ≈ 1.3, maxDistance ≈ 600) at the position from `handle.emitters`; each = a dyad of sine waves with a gain LFO. **Listener** follows the camera every frame (`setTargetAtTime(…, .05)` for position/forward/up) via `onFrame`.
- **UI sounds (F28):** `arrive` (chord of 3 partials over a per-index note, short attack, long decay, spatialized), `open`/`close` (descending/ascending blip), `hover` (high tick, **450 ms throttle**).
- **Lifecycle:** `AudioContext` created **only** after a user gesture **and** `enabled`; if `enabled` was already saved, wait for the 1st `pointerdown`/`keydown` (capture) to resume; turn on with a ramp up to `volume·.9` (~1.6 s); turn off with a short ramp and `suspend()`. (Proposed improvement: `suspend()` also on `document.hidden`.)
- **Prefs** in `localStorage['<project>:sound']` = `{enabled:false, volume:.6, ambient:true, interaction:true}` (try/catch). No `AudioContext` ⇒ `supported:false`, no error; `webkitAudioContext` fallback.
- **`SoundProvider`** (client) exposes the engine via context; integrates `onFrame/onHover/onStation` from `WorldCanvas` and `open/close` from the case (T14).

## Out of scope
Panel UI (T29).

## Acceptance criteria
- [ ] Nothing plays or creates an `AudioContext` before the user turns sound on.
- [ ] Turning on: ambience fades in over ≈ 1.6 s; turning off: it vanishes in < .3 s and the context suspends.
- [ ] When scrolling between sectors the active sector's emitter sounds closer / left-right consistent with the camera (test with headphones).
- [ ] Hover/open/close/arrive sound; hover respects the throttle.
- [ ] Prefs persist; without localStorage (private mode) nothing breaks.
- [ ] No overload/clipping (compressor) at 100% volume; no audible clicks on the ramps.
- [ ] Cleanup: context `close()` on unmount, no orphan nodes in StrictMode.
- [ ] Pure part (note table, throttle, prefs merge) testable without an `AudioContext`.

## Technical notes
- Safari requires a gesture for `resume()`; handle the Promise.
- Avoid creating nodes per frame; only on `arrive/hover`, and stop the oscillators (`stop`) to release them.

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F26–F29 · `.claude/docs/ARCHITECTURE.md` §7.
