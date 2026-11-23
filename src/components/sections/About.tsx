import Image from "next/image";
import { useTranslations } from "next-intl";
import { ATTR, attr } from "@lib/contract";
import { PROFILE } from "@data/profile";
import richT from "@/utils/richTextTranslationHandler";
import { isVisible } from "@/utils/content";
import Region from "./Region";
import SectionHeader from "./SectionHeader";
import styles from "@styles/About.module.scss";

const SERVICES = ["mobile", "web"] as const;

/** 02 · About: title, three short paragraphs and two services. */
export default function About() {
  const t = useTranslations("About");
  // `p3` is a TODO(content) placeholder until it is written (hidden in production).
  const paragraphs = (["p1", "p2", "p3"] as const).filter((key) =>
    isVisible(t.raw(key) as string),
  );

  return (
    <Region id="about" headingId="about-title">
      <SectionHeader id="about" headingId="about-title" title={t("title")} />

      <div className={styles.person} {...attr(ATTR.reveal)}>
        <Image
          className={styles.avatar}
          src="/img/profile-avatar.png"
          alt={PROFILE.name}
          width={176}
          height={176}
          sizes="88px"
        />
      </div>

      <div className="prose" {...attr(ATTR.reveal)}>
        {paragraphs.map((key) => (
          <p key={key}>{richT(t, key)}</p>
        ))}
      </div>

      <h3 className={`label ${styles.servicesLabel}`} {...attr(ATTR.reveal)}>
        {t("servicesLabel")}
      </h3>
      <ul className={styles.services}>
        {SERVICES.map((key) => (
          <li key={key} className={styles.service} {...attr(ATTR.reveal)}>
            <h4>{t(`services.${key}.title`)}</h4>
            <p>{t(`services.${key}.text`)}</p>
          </li>
        ))}
      </ul>
    </Region>
  );
}
