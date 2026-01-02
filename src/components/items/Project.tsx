import { useTranslations } from "next-intl";
import { PersonalProject, ProfessionalProject } from "../ProjectsList";
import styles from "@styles/Projects.module.scss";
import Image from "next/image";
import { IconsProvider } from "@/providers";
import Button from "./Button";
export function Project({
  project,
  imageBasePath,
}: {
  project: ProfessionalProject | PersonalProject;
  imageBasePath: string;
}) {
  const t = useTranslations("Projects");
  return (
    <div className={styles.projectCard}>
      <div>
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
