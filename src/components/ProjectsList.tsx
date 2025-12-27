import { AcceptedIconNames, IconsProvider } from "@/providers";
import { useTranslations } from "next-intl";
import Image from "next/image";
import styles from "@styles/Projects.module.scss";
import Button from "./Button";

interface ProfessionalProject {
  image: string;
  title: string;
  description: string;
  website?: string;
  googlePlay?: string;
  appStore?: string;
  languagesIcons?: AcceptedIconNames[];
}

interface PersonalProject extends ProfessionalProject {
  github?: string;
}

export default function ProjectsList() {
  const t = useTranslations("Projects.descriptions");
  const imageBasePath = "/img/projects/";
  const projects: {
    professional: ProfessionalProject[];
    personal: PersonalProject[];
  } = {
    professional: [
      {
        image: "",
        title: "Magipass",
        description: "Descrição Magipass",
        website: "https://magipass.com",
        appStore: "https://apps.apple.com/us/app/magipass/id6747272462",
        googlePlay:
          "https://play.google.com/store/apps/details?id=com.prion.magipass",
      },
    ],
    personal: [
      {
        image: "neonnest.png",
        title: "NeonNest",
        description: t("neonnest"),
        website: "https://neon-nest.vercel.app",
        github: "https://github.com/Kauavillan/NeonNest",
        languagesIcons: ["next", "typescript", "sass"],
      },
      {
        image: "space-tourism.png",
        title: "Space Tourism",
        description: t("space-tourism"),
        website: "https://kauavillan.github.io/space-tourism/",
        github: "https://github.com/Kauavillan/space-tourism",
      },
    ],
  };
  console.log(projects.personal[0].description);
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

function Project({
  project,
  imageBasePath,
}: {
  project: ProfessionalProject | PersonalProject;
  imageBasePath: string;
}) {
  const t = useTranslations("Projects");
  return (
    <div className={styles.projectCard}>
      <Image
        src={imageBasePath + project.image}
        alt={project.title}
        width={400}
        height={200}
      />
      <h4>{project.title}</h4>
      <p>{project.description}</p>
      <div className={styles.languagesIcons}>
        {project.languagesIcons &&
          project.languagesIcons.map((icon, index) => (
            <IconsProvider key={index} name={icon} />
          ))}
      </div>
      <div className={styles.buttons}>
        {"github" in project && project.github && (
          <Button
            link={project.github}
            text={t("buttons.view-github")}
            icon="github"
          />
        )}
        {project.website && (
          <Button
            link={project.website}
            text={t("buttons.website")}
            icon="redirect"
          />
        )}
        {project.appStore && (
          <Button
            link={project.appStore}
            text={t("buttons.app-store")}
            icon="appStore"
          />
        )}
        {project.googlePlay && (
          <Button
            link={project.googlePlay}
            text={t("buttons.play-store")}
            icon="googlePlay"
          />
        )}
      </div>
    </div>
  );
}
