// Registry of the procedural project artifacts. `Record<ArtifactKind, …>` makes
// the compiler demand an entry for every kind in `src/data/types.ts`: a new
// project only needs its kind registered here, never a change to the engine.

import type { ArtifactKind } from "@data/types";
import { moduleGlobe } from "./module-globe";
import { neuralGraph } from "./neural-graph";
import { phonePass } from "./phone-pass";
import { qrLattice } from "./qr-lattice";
import { tileGrid } from "./tile-grid";
import type { ArtifactDef } from "./types";

export type { Artifact, ArtifactDef, ArtifactOptions } from "./types";

export const ARTIFACTS: Readonly<Record<ArtifactKind, ArtifactDef>> = {
  "phone-pass": phonePass,
  "qr-lattice": qrLattice,
  "tile-grid": tileGrid,
  "neural-graph": neuralGraph,
  "module-globe": moduleGlobe,
};
