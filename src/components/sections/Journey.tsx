import { useLocale, useTranslations } from "next-intl";
import { ATTR, attr } from "@lib/contract";
import { MILESTONES } from "@data/index";
import Region from "./Region";
import SectionHeader from "./SectionHeader";
import styles from "@styles/Journey.module.scss";

/** 05 · Journey. Chronological timeline; `MILESTONES.length` feeds the 3D helix. */
export default function Journey() {
  const t = useTranslations("Journey");
  const locale = useLocale();
  // `YYYY-MM` is a calendar month: format in UTC so the zone can't shift it.
  const format = new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <Region id="journey" headingId="journey-title">
      <SectionHeader id="journey" headingId="journey-title" title={t("title")} lead={t("lead")} />

      <ol className={styles.timeline}>
        {MILESTONES.map((m) => (
          <li key={m.id} className={styles.milestone} {...attr(ATTR.reveal)}>
            <time dateTime={m.date}>{format.format(new Date(`${m.date}-01T00:00:00Z`))}</time>
            <h3>{t(`milestones.${m.id}.title`)}</h3>
            <p>{t(`milestones.${m.id}.text`)}</p>
          </li>
        ))}
      </ol>
    </Region>
  );
}
