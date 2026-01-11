import commonUrls from "@/utils/commonUrls";
import Button from "./Button";
import EmailForm from "./EmailForm";
import styles from "@styles/Contact.module.scss";
import { useTranslations } from "next-intl";
export default function ContactOptions() {
  const t = useTranslations("Contact");
  return (
    <div className={styles.contactSession}>
      <h5>{t("subtitle")}</h5>
      <div className={styles.buttons}>
        <Button text="Github" icon="github" link={commonUrls.githubProfile} />
        <Button
          text="LinkedIn"
          icon="linkedin"
          link={commonUrls.linkedinProfile}
        />
        <Button
          text="Email"
          icon="email"
          link={`mailto:${commonUrls.emailAddress}`}
        />
      </div>
      <h5>{t("preForm")}</h5>
      <EmailForm />
    </div>
  );
}
