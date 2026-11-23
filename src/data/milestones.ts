import type { Milestone } from "./types";

// Only milestones that can be grounded in the repository history are listed.
// TODO(content): add the ones the history can't date — first projects
// (Frontend Mentor), Wegia internship, Magipass, QRypt, the degree — each needs
// an id here, a `date`, and `Journey.milestones.<id>.{title,text}` in en/pt.
// `milestoneCount` for the 3D helix is `MILESTONES.length`.

export const MILESTONES: readonly Milestone[] = [
  { id: "portfolio-v1", date: "2025-06" },
  { id: "portfolio-v2", date: "2026-01" },
  { id: "deepquiz", date: "2026-03" },
  { id: "entropyle", date: "2026-07" },
  { id: "portfolio-v3", date: "2026-11" },
];
