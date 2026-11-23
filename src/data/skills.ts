import type { SkillGroup } from "./types";

// `evidence` must be honest (CONTENT.md): `shipped` only for what appears in a
// published project of `projects.ts`; everything else is `stated`.
// Group labels live in i18n (`Skills.groups.<id>`).
//
// TODO(content): confirm Stripe / RevenueCat — if they ship in Magipass, flip to
// "shipped" and add them to its stack.

export const SKILL_GROUPS: readonly SkillGroup[] = [
  {
    id: "languages",
    skills: [
      { name: "TypeScript", evidence: "shipped" },
      { name: "JavaScript", evidence: "shipped" },
      { name: "C#", evidence: "shipped" },
      { name: "PHP", evidence: "shipped" },
      { name: "Java", evidence: "stated" },
      { name: "C/C++", evidence: "stated" },
    ],
  },
  {
    id: "frontend",
    skills: [
      { name: "React", evidence: "shipped" },
      { name: "Next.js", evidence: "shipped" },
      { name: "HTML5", evidence: "shipped" },
      { name: "CSS3", evidence: "shipped" },
      { name: "Sass", evidence: "shipped" },
      { name: "Tailwind CSS", evidence: "shipped" },
    ],
  },
  {
    id: "mobile",
    skills: [
      { name: "Expo", evidence: "shipped" },
      { name: "React Native", evidence: "shipped" },
    ],
  },
  {
    id: "backend",
    skills: [
      { name: "Node.js", evidence: "shipped" },
      { name: "REST APIs", evidence: "shipped" },
      { name: "MariaDB", evidence: "shipped" },
      { name: "PostgreSQL", evidence: "shipped" },
    ],
  },
  {
    id: "payments",
    skills: [
      { name: "Stripe", evidence: "stated" },
      { name: "RevenueCat", evidence: "stated" },
    ],
  },
  {
    id: "tools",
    skills: [
      { name: "Git", evidence: "shipped" },
      { name: "Gemini API", evidence: "shipped" },
    ],
  },
];
