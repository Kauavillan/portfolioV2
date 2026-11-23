import type { Project } from "./types";

// Decision D2 (CONTENT.md): five featured projects (article + case file + 3D
// artifact), the rest go to the archive. Order = order on the page.

export const PROJECTS: readonly Project[] = [
  {
    id: "magipass",
    name: "Magipass",
    featured: true,
    type: "professional",
    artifact: "phone-pass",
    mood: ["#ff7a59", "#7a5cff"],
    image: { src: "/img/projects/magipass.png", width: 512, height: 512 },
    stack: ["Expo", "Next.js", "TypeScript", "C#", "MariaDB"],
    links: {
      website: "https://magipass.com",
      appStore: "https://apps.apple.com/us/app/magipass/id6747272462",
      playStore: "https://play.google.com/store/apps/details?id=com.prion.magipass",
    },
  },
  {
    id: "qrypt",
    name: "QRypt",
    featured: true,
    type: "personal",
    artifact: "qr-lattice",
    mood: ["#35d0a5", "#2c5bff"],
    image: { src: "/img/projects/qrypt.png", width: 1024, height: 1024 },
    stack: ["Expo", "TypeScript", "Node.js", "PostgreSQL"],
    links: { github: "https://github.com/Kauavillan/signed-qr-code" },
  },
  {
    id: "entropyle",
    name: "Entropyle",
    featured: true,
    type: "personal",
    artifact: "tile-grid",
    mood: ["#ffcf5c", "#ff5c8a"],
    image: { src: "/img/projects/entropyle.png", width: 2393, height: 2035 },
    stack: ["Next.js", "TypeScript", "Node.js", "Tailwind CSS"],
    links: {
      website: "https://entropyle.vercel.app",
      github: "https://github.com/Kauavillan/Entropyle",
    },
  },
  {
    id: "deepquiz",
    name: "DeepQuiz",
    featured: true,
    type: "personal",
    artifact: "neural-graph",
    mood: ["#7da2ff", "#c05cff"],
    image: { src: "/img/projects/deep-quiz.png", width: 2926, height: 1654 },
    stack: ["Next.js", "TypeScript", "Node.js", "Tailwind CSS", "Gemini API"],
    links: {
      website: "https://deep-quiz-ai.vercel.app",
      github: "https://github.com/Kauavillan/DeepQuiz",
    },
  },
  {
    id: "wegia",
    name: "Wegia",
    featured: true,
    type: "professional",
    artifact: "module-globe",
    mood: ["#4ade80", "#1fa8c9"],
    image: { src: "/img/projects/wegia.png", width: 1863, height: 962 },
    stack: ["HTML5", "CSS3", "JavaScript", "PHP", "MariaDB"],
    links: { website: "https://www.wegia.org" },
  },
  // ── Archive ──
  {
    id: "neonnest",
    name: "NeonNest",
    featured: false,
    type: "personal",
    stack: ["Next.js", "TypeScript", "Sass"],
    links: {
      website: "https://neon-nest.vercel.app",
      github: "https://github.com/Kauavillan/NeonNest",
    },
  },
  {
    id: "space-tourism",
    name: "Space Tourism",
    featured: false,
    type: "personal",
    stack: ["React", "JavaScript", "CSS3"],
    links: {
      website: "https://kauavillan.github.io/space-tourism/",
      github: "https://github.com/Kauavillan/space-tourism",
    },
  },
];
