import { AcceptedIconNames, IconsProvider } from "@/providers";
import { useTranslations } from "next-intl";
import Image from "next/image";
import styles from "@styles/Projects.module.scss";
import Button from "./items/Button";
import { Project } from "./items/Project";

export interface ProfessionalProject {
  image: string;
  title: string;
  description: string;
  website?: string;
  googlePlay?: string;
  appStore?: string;
  languagesIcons?: AcceptedIconNames[];
}

export interface PersonalProject extends ProfessionalProject {
  github?: string;
}

export default function ProjectsList() {
  const t = useTranslations("Projects");
  const imageBasePath = "/img/projects/";
  const projects: {
    professional: ProfessionalProject[];
    personal: PersonalProject[];
  } = {
    professional: [
      {
        image: "magipass.png",
        title: "Magipass",
        description: "Descrição Magipass",
        website: "https://magipass.com",
        appStore: "https://apps.apple.com/us/app/magipass/id6747272462",
        googlePlay:
          "https://play.google.com/store/apps/details?id=com.prion.magipass",
        languagesIcons: ["expo", "next", "typescript", "csharp", "mariadb"],
      },
      {
        image: "wegia.png",
        title: "Wegia",
        description: t("descriptions.wegia"),
        website: "https://www.wegia.org",
        languagesIcons: ["html5", "css3", "javascript", "php", "mariadb"],
      },
    ],
    personal: [
      {
        image: "qrypt.png",
        title: "QRypt",
        description: t("descriptions.neonnest"),
        github: "https://github.com/Kauavillan/signed-qr-code",
        languagesIcons: ["expo", "typescript"],
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
        title: t("titles.multi-step-form"),
        description: t("descriptions.multi-step-form"),
        website: "https://kvn-multi-step-form.vercel.app",
        github: "https://github.com/Kauavillan/multi-step-form",
        languagesIcons: ["next", "javascript", "css3"],
      },
      {
        image: "space-tourism.png",
        title: t("titles.space-tourism"),
        description: t("descriptions.space-tourism"),
        website: "https://kauavillan.github.io/space-tourism/",
        github: "https://github.com/Kauavillan/space-tourism",
        languagesIcons: ["react", "javascript", "css3"],
      },
      // {
      //   image: "address-tracker.png",
      //   title: t("titles.ip-tracker"),
      //   description: t("descriptions.ip-tracker"),
      //   website:
      //     "https://kauavillan.github.io/Projetos/frontendmentor/localizador-ip/",
      //   github:
      //     "https://github.com/Kauavillan/Projetos/tree/main/frontendmentor/localizador-ip",
      //   languagesIcons: ["html5", "css3", "javascript"],
      // },
      {
        image: "card-form.png",
        title: t("titles.interactive-card"),
        description: t("descriptions.interactive-card"),
        website:
          "https://kauavillan.github.io/Projetos/frontendmentor/cartao-interativo/",
        github:
          "https://github.com/Kauavillan/Projetos/tree/main/frontendmentor/cartao-interativo",
        languagesIcons: ["html5", "css3", "javascript"],
      },
    ],
  };

  return (
    <div>
      <div className={styles.projectsGrid}>
        {projects.professional.map((project, index) => (
          <Project
            key={index}
            project={project}
            imageBasePath={imageBasePath}
          />
        ))}
      </div>
      <div className={styles.projectsGrid}>
        {projects.personal.map((project, index) => (
          <Project
            key={index}
            project={project}
            imageBasePath={imageBasePath}
          />
        ))}
      </div>
    </div>
  );
}
