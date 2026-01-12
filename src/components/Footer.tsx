import styles from "@styles/Footer.module.scss";
import { useTranslations } from "next-intl";
export default function Footer() {
  const t = useTranslations("Footer");
  return (
    <footer className={styles.footer}>
      <footer>
        <p>
          © {new Date().getFullYear()} Kauã Villa Nova. {t("rightsReserved")}
        </p>
      </footer>
    </footer>
  );
}
