import { AcceptedIconNames } from "@/providers";
import { useTranslations } from "next-intl";
import styles from "@styles/Projects.module.scss";
import { Project } from "./items/Project";
import richT from "@/utils/richTextTranslationHandler";
import { ReactNode } from "react";

export interface IProject {
  github?: string;
  image: string;
  title: string;
  description: string | ReactNode;
  website?: string;
  googlePlay?: string;
  appStore?: string;
  languagesIcons?: AcceptedIconNames[];
  type?: "professional" | "personal";
}

export default function ProjectsList() {
  const t = useTranslations("Projects");
  const imageBasePath = "/img/projects/";
  const projects: IProject[] = [
    {
      image: "magipass.png",
      title: "Magipass",
      description: richT(t, "descriptions.magipass"),
      website: "https://magipass.com",
      appStore: "https://apps.apple.com/us/app/magipass/id6747272462",
      googlePlay:
        "https://play.google.com/store/apps/details?id=com.prion.magipass",
      languagesIcons: ["expo", "next", "typescript", "csharp", "mariadb"],
      type: "professional",
    },
    {
      image: "qrypt.png",
      title: "QRypt",
      description: richT(t, "descriptions.qrypt"),
      github: "https://github.com/Kauavillan/signed-qr-code",
      languagesIcons: ["expo", "typescript", "nodejs", "postgresql"],
    },
    {
      image: "wegia.png",
      title: "Wegia",
      description: t("descriptions.wegia"),
      website: "https://www.wegia.org",
      languagesIcons: ["html5", "css3", "javascript", "php", "mariadb"],
      type: "professional",
    },
    {
      image: "neonnest.png",
      title: "NeonNest",
      description: t("descriptions.neonnest"),
      website: "https://neon-nest.vercel.app",
      github: "https://github.com/Kauavillan/NeonNest",
      languagesIcons: ["next", "typescript", "sass"],
    },
    {
      image: "multi-step-form.png",
      title: t("titles.multiStepForm"),
      description: t("descriptions.multiStepForm"),
      website: "https://kvn-multi-step-form.vercel.app",
      github: "https://github.com/Kauavillan/multi-step-form",
      languagesIcons: ["next", "javascript", "css3"],
    },
    {
      image: "space-tourism.png",
      title: t("titles.spaceTourism"),
      description: t("descriptions.spaceTourism"),
      website: "https://kauavillan.github.io/space-tourism/",
      github: "https://github.com/Kauavillan/space-tourism",
      languagesIcons: ["react", "javascript", "css3"],
    },
    // {
    //   image: "address-tracker.png",
    //   title: t("titles.ipTracker"),
    //   description: t("descriptions.ipTracker"),
    //   website:
    //     "https://kauavillan.github.io/Projetos/frontendmentor/localizador-ip/",
    //   github:
    //     "https://github.com/Kauavillan/Projetos/tree/main/frontendmentor/localizador-ip",
    //   languagesIcons: ["html5", "css3", "javascript"],
    // },
    {
      image: "card-form.png",
      title: t("titles.interactiveCard"),
      description: t("descriptions.interactiveCard"),
      website:
        "https://kauavillan.github.io/Projetos/frontendmentor/cartao-interativo/",
      github:
        "https://github.com/Kauavillan/Projetos/tree/main/frontendmentor/cartao-interativo",
      languagesIcons: ["html5", "css3", "javascript"],
    },
  ];

  return (
    <div>
      <div className={styles.projectsGrid}>
        {projects.map((project, index) => {
          project.type = project.type ?? "personal";
          return (
            <Project
              key={index}
              project={project}
              imageBasePath={imageBasePath}
            />
          );
        })}
      </div>
    </div>
  );
}
