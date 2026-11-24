import { useTranslations } from "next-intl";
import { ATTR, attr } from "@lib/contract";
import { PROFILE } from "@data/profile";
import commonUrls from "@/utils/commonUrls";
import { splitGraphemes } from "@/utils/graphemes";
import { IconsProvider } from "@/providers";
import Button from "@components/items/Button";
import Region from "./Region";
import styles from "@styles/Hero.module.scss";

/**
 * 01 · Home. The name is split into per-letter spans (`data-hero-ch`) so the
 * intro (T27) can animate them; the <h1> keeps the full name in `aria-label`
 * and the spans are `aria-hidden`, so screen readers announce it once.
 * No `data-reveal` here: the intro owns the entrance of this section, through
 * `data-hero-ch` (letters) and `data-hero-item` (everything else, `last` = CTAs).
 * The <h1> is focusable by script so the intro can return focus to it.
 */
export default function Hero() {
  const t = useTranslations("Hero");
  const words = PROFILE.name.split(" ");

  return (
    <Region id="home" headingId="home-title" className={styles.hero}>
      <p className={`label ${styles.kicker}`} {...attr(ATTR.heroItem)}>
        <span>01</span>
        <span>{t("label")}</span>
      </p>

      <h1
        id="home-title"
        className={`h-name ${styles.name}`}
        aria-label={PROFILE.name}
        tabIndex={-1}
      >
        {words.map((word, w) => (
          <span key={w} className={styles.word} aria-hidden="true">
            {splitGraphemes(word).map((ch, i) => (
              <span key={i} className={styles.ch} {...attr(ATTR.heroCh)}>
                {ch}
              </span>
            ))}
          </span>
        ))}
      </h1>

      <p className="lead" {...attr(ATTR.heroItem)}>
        {t("lead")}
      </p>

      <div className={styles.ctas} {...attr(ATTR.heroItem, "last")}>
        <Button variant="solar" link="#work" text={t("ctaWork")} />
        <Button link="#contact" text={t("ctaContact")} />
      </div>

      <div className={styles.meta} {...attr(ATTR.heroItem)}>
        <p className={styles.status}>
          <span className={styles.dot} aria-hidden="true" />
          {t("status")}
        </p>
        <ul className={styles.socials} aria-label={t("socials")}>
          <li>
            <a
              href={commonUrls.githubProfile}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <IconsProvider name="github" width={22} height={22} />
            </a>
          </li>
          <li>
            <a
              href={commonUrls.linkedinProfile}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <IconsProvider name="linkedin" width={22} height={22} />
            </a>
          </li>
        </ul>
      </div>

      <p className={styles.hint} aria-hidden="true" {...attr(ATTR.heroItem, "last")}>
        {t("scroll")}
        <span className={styles.hintLine} />
      </p>
    </Region>
  );
}
