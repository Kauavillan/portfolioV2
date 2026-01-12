import { useTranslations } from "next-intl";
import ContactOptions from "./items/ContactOptions";
import SectionTitle from "./SectionTitle";

export default function Contact() {
  const t = useTranslations("Contact");

  return (
    <section id="contact">
      <SectionTitle title={t("title")} />
      <ContactOptions />
    </section>
  );
}
