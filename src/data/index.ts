import { MILESTONES } from "./milestones";
import { PROJECTS } from "./projects";
import { SKILL_GROUPS } from "./skills";
import type {
  ArchiveProject,
  FeaturedProject,
  Project,
  WorldData,
} from "./types";

export { MILESTONES } from "./milestones";
export { PROJECTS } from "./projects";
export { SKILL_GROUPS } from "./skills";
export { ARTIFACT_KINDS, SECTOR_MOODS, SECTOR_ORDER } from "./world";
export type * from "./types";

const isFeatured = (p: Project): p is FeaturedProject => p.featured;
const isArchive = (p: Project): p is ArchiveProject => !p.featured;

/** Projects that get an article, a case file and a 3D artifact, in page order. */
export function getFeaturedProjects(): FeaturedProject[] {
  return PROJECTS.filter(isFeatured);
}

/** Smaller projects listed under "also in the archive". */
export function getArchiveProjects(): ArchiveProject[] {
  return PROJECTS.filter(isArchive);
}

export function getProject(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}

/**
 * Exactly what the 3D world needs (`WorldOptions` minus callbacks/DOM): ids,
 * artifacts, moods, evidence and the milestone count. No translatable text.
 */
export function getWorldData(): WorldData {
  return {
    projects: getFeaturedProjects().map((p) => ({
      id: p.id,
      artifact: p.artifact,
      mood: p.mood,
      ...(p.image ? { image: p.image.src } : {}),
    })),
    skillGroups: SKILL_GROUPS.map((g) => ({
      id: g.id,
      skills: g.skills.map((s) => ({ name: s.name, evidence: s.evidence })),
    })),
    milestoneCount: MILESTONES.length,
  };
}
