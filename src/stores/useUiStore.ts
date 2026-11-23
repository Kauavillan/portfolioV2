import { create } from "zustand";

export type WorldStatus = "idle" | "loading" | "ready" | "unavailable";

/**
 * UI state shared between the client controllers (ARCHITECTURE §5).
 *
 * `scrollLocks` is a counter: the intro, the mobile menu and a case file can
 * each lock the page scroll and they must not release each other's lock. The
 * actions below keep it consistent (each open/close pair changes it once).
 */
interface UiState {
  introActive: boolean;
  navOpen: boolean;
  /** Id of the open case file. */
  caseOpen: string | null;
  /** Element that opened the case file — focus returns to it on close. */
  caseOpener: HTMLElement | null;
  worldStatus: WorldStatus;
  scrollLocks: number;

  lockScroll: () => void;
  unlockScroll: () => void;
  setIntroActive: (active: boolean) => void;
  setNavOpen: (open: boolean) => void;
  toggleNav: () => void;
  openCase: (id: string, opener?: HTMLElement | null) => void;
  closeCase: () => void;
  setWorldStatus: (status: WorldStatus) => void;
}

const inc = (n: number) => n + 1;
const dec = (n: number) => Math.max(0, n - 1);

export const useUiStore = create<UiState>((set, get) => ({
  introActive: false,
  navOpen: false,
  caseOpen: null,
  caseOpener: null,
  worldStatus: "idle",
  scrollLocks: 0,

  lockScroll: () => set((s) => ({ scrollLocks: inc(s.scrollLocks) })),
  unlockScroll: () => set((s) => ({ scrollLocks: dec(s.scrollLocks) })),

  setIntroActive: (active) =>
    set((s) =>
      s.introActive === active
        ? s
        : {
            introActive: active,
            scrollLocks: active ? inc(s.scrollLocks) : dec(s.scrollLocks),
          },
    ),

  setNavOpen: (open) =>
    set((s) =>
      s.navOpen === open
        ? s
        : {
            navOpen: open,
            scrollLocks: open ? inc(s.scrollLocks) : dec(s.scrollLocks),
          },
    ),
  toggleNav: () => get().setNavOpen(!get().navOpen),

  openCase: (id, opener = null) =>
    set((s) => {
      if (s.caseOpen === id) return s;
      // Switching directly between two cases keeps the single lock.
      return {
        caseOpen: id,
        caseOpener: s.caseOpen === null ? opener : s.caseOpener,
        scrollLocks: s.caseOpen === null ? inc(s.scrollLocks) : s.scrollLocks,
      };
    }),
  closeCase: () =>
    set((s) =>
      s.caseOpen === null
        ? s
        : { caseOpen: null, scrollLocks: dec(s.scrollLocks) },
    ),

  setWorldStatus: (worldStatus) => set({ worldStatus }),
}));
