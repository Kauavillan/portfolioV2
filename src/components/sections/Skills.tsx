import { useTranslations } from "next-intl";
import { ATTR, attr } from "@lib/contract";
import { SKILL_GROUPS } from "@data/index";
import Region from "./Region";
import SectionHeader from "./SectionHeader";
import styles from "@styles/Skills.module.scss";

/**
 * 04 · Skills. Chips grouped by area, each carrying the data the 3D world uses:
 * `data-skill="<group>:<name>"` (canonical, untranslated name) and
 * `data-evidence`. Chips are focusable so keyboard focus lights up the star too.
 * `evidence` is honest: bright = shipped in a project above, dim = stated.
 */
export default function Skills() {
  const t = useTranslations("Skills");

  return (
    <Region id="skills" headingId="skills-title" wide>
      <SectionHeader id="skills" headingId="skills-title" title={t("title")} lead={t("lead")} />

      <div className={styles.groups}>
        {SKILL_GROUPS.map((group) => (
          <div
            key={group.id}
            className={styles.group}
            {...attr(ATTR.skillGroup, group.id)}
            {...attr(ATTR.reveal)}
          >
            <h3>{t(`groups.${group.id}`)}</h3>
            <ul className={styles.list}>
              {group.skills.map((skill) => (
                <li
                  key={skill.name}
                  className={`chip ${styles.skill}`}
                  tabIndex={0}
                  {...attr(ATTR.skill, `${group.id}:${skill.name}`)}
                  {...attr(ATTR.evidence, skill.evidence)}
                >
                  {skill.name}
                  <span className="sr-only">: {t(`legend.${skill.evidence}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <ul className={styles.legend} aria-label={t("legend.label")} {...attr(ATTR.reveal)}>
        <li className={styles.legendShipped}>{t("legend.shipped")}</li>
        <li className={styles.legendStated}>{t("legend.stated")}</li>
      </ul>
    </Region>
  );
}
