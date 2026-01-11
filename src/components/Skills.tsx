import { useTranslations } from "next-intl";
import SectionTitle from "./SectionTitle";
import SkillsSwiper from "./SkillsSwiper";

export default function Skills() {
  const t = useTranslations("Skills");
  return (
    <section id="skills">
      <SectionTitle
        title={t("title.foreground")}
        backgroundTitle={t("title.background")}
      />
      <SkillsSwiper />
    </section>
  );
}
