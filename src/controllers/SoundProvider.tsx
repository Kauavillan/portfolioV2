"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createSoundEngine, type SoundEngine, type SoundState } from "@audio/engine";
import { useUiStore } from "@stores/useUiStore";

const SoundContext = createContext<SoundEngine | null>(null);

/** The audio engine. Stable for the lifetime of the provider. */
export function useSound(): SoundEngine {
  const engine = useContext(SoundContext);
  if (!engine) throw new Error("useSound must be used inside <SoundProvider>");
  return engine;
}

/** The engine's state, re-rendering on change. The server and the first client render agree. */
export function useSoundState(): SoundState {
  const engine = useSound();
  return useSyncExternalStore(engine.subscribe, engine.getState, engine.getServerState);
}

/**
 * Owns the audio engine (T28). Nothing audible — and no `AudioContext` — exists
 * until the visitor turns sound on. The world feeds it through `useSound()`
 * (listener, emitters, stations, hover); the case files feed it from here, by
 * watching the UI store, so the dialog code knows nothing about sound.
 */
export default function SoundProvider({ children }: { children: ReactNode }) {
  // Created once. Safe on the server: it touches no browser API until `mount()`.
  const [engine] = useState(createSoundEngine);

  // `mount` returns its cleanup (closes the context): StrictMode-safe, the engine
  // survives the simulated unmount and starts over from the saved preferences.
  useEffect(() => engine.mount(), [engine]);

  useEffect(
    () =>
      useUiStore.subscribe((state, prev) => {
        if (state.caseOpen === prev.caseOpen) return;
        // Switching straight between two cases is neither an open nor a close.
        if (prev.caseOpen === null) engine.open();
        else if (state.caseOpen === null) engine.close();
      }),
    [engine],
  );

  return <SoundContext.Provider value={engine}>{children}</SoundContext.Provider>;
}
