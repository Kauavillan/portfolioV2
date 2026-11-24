import { useTranslations } from "next-intl";
import { PROFILE } from "@data/profile";
import styles from "@styles/Footer.module.scss";

/** The page's only <footer>. */
export default function Footer() {
  const t = useTranslations("Footer");
  return (
    <footer className={styles.footer}>
      <p>
        © {new Date().getFullYear()} {PROFILE.name}. {t("rightsReserved")}
      </p>
      <p>{t("credit")}</p>
      <p className={styles.world}>{t("world")}</p>
    </footer>
  );
}
