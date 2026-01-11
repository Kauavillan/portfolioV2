import SectionTitle from "./SectionTitle";
import styles from "@styles/About.module.scss";
import { IconsProvider } from "@/providers";
import { useTranslations } from "next-intl";
import richT from "@/utils/richTextTranslationHandler";
import Image from "next/image";

export default function About() {
  const t = useTranslations("About");
  return (
    <section id="about">
      <SectionTitle title={t("title")} />
      <div className={styles.about}>
        <p>{richT(t, "aboutText")}</p>
        <Image
          width={250}
          height={250}
          src="/img/profile-avatar.png"
          alt="Profile picture"
          className={styles.profileAvatar}
        />
      </div>
      <div className={styles.socialLinks}>
        <a
          href="https://github.com/Kauavillan"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
        >
          <IconsProvider name="github" width={32} height={32} />
        </a>
        <a
          href="https://linkedin.com/in/kauã-villa-nova-da-silva"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
        >
          <IconsProvider name="linkedin" width={32} height={32} />
        </a>
        <a href="mailto:kvn.contact.professional@gmail.com" aria-label="Email">
          <IconsProvider name="mail" width={32} height={32} />
        </a>
      </div>
    </section>
  );
}
