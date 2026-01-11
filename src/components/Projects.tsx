import { useTranslations } from "next-intl";
import ProjectsList from "./ProjectsList";
import SectionTitle from "./SectionTitle";

export default function Projects() {
  const t = useTranslations("Projects");
  return (
    <section id="projects">
      <SectionTitle title={t("title")} />
      <ProjectsList />
    </section>
  );
}
