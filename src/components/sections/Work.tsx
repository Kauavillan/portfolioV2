import { useTranslations } from "next-intl";
import {
  ATTR,
  attr,
  projectArticleId,
  projectStation,
} from "@lib/contract";
import { getArchiveProjects, getFeaturedProjects } from "@data/index";
import Button from "@components/items/Button";
import Region from "./Region";
import SectionHeader from "./SectionHeader";
import styles from "@styles/Work.module.scss";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * 03 · Work. The section (`#work`) is the header; each featured project is its
 * own full-screen `article` (= one camera station, `project:<id>`) and the
 * archive closes the block. All of it is driven by `src/data`.
 */
export default function Work() {
  const t = useTranslations("Work");
  const featured = getFeaturedProjects();
  const archive = getArchiveProjects();

  return (
    <>
      <Region id="work" headingId="work-title">
        <SectionHeader
          id="work"
          headingId="work-title"
          title={t("title", { count: featured.length })}
          lead={t("lead")}
        />
      </Region>

      {featured.map((project, i) => {
        const articleId = projectArticleId(project.id);
        const { links } = project;
        return (
          <article
            key={project.id}
            id={articleId}
            className={`region ${styles.station}`}
            aria-labelledby={`${articleId}-title`}
            {...attr(ATTR.station, projectStation(project.id))}
          >
            <div className="region-inner" {...attr(ATTR.revealScope)}>
              <p className="label" {...attr(ATTR.reveal)}>
                {pad(i + 1)} / {pad(featured.length)} · {t(`types.${project.type}`)}
              </p>
              <h3
                id={`${articleId}-title`}
                className="h-project"
                {...attr(ATTR.reveal)}
              >
                {project.name}
              </h3>
              <p className={styles.kind} {...attr(ATTR.reveal)}>
                {t(`projects.${project.id}.kind`)}
              </p>
              <p className="lead" {...attr(ATTR.reveal)}>
                {t(`projects.${project.id}.lead`)}
              </p>

              <ul className={styles.stack} aria-label={t("stack")} {...attr(ATTR.reveal)}>
                {project.stack.map((tech) => (
                  <li key={tech} className="chip">
                    {tech}
                  </li>
                ))}
              </ul>

              <div className={styles.actions} {...attr(ATTR.reveal)}>
                <Button
                  variant="solar"
                  text={t("openCase")}
                  {...attr(ATTR.openCase, project.id)}
                />
                {links.website ? (
                  <Button quiet link={links.website} text={t("website")} icon="redirect" />
                ) : null}
                {links.github ? (
                  <Button quiet link={links.github} text={t("source")} icon="github" />
                ) : null}
                {links.appStore ? (
                  <Button quiet link={links.appStore} text={t("appStore")} icon="appStore" />
                ) : null}
                {links.playStore ? (
                  <Button quiet link={links.playStore} text={t("playStore")} icon="googlePlay" />
                ) : null}
              </div>
            </div>
          </article>
        );
      })}

      {archive.length > 0 ? (
        <div className={`region ${styles.archive}`}>
          <div className="region-inner" {...attr(ATTR.revealScope)}>
            <h3 className="label" {...attr(ATTR.reveal)}>
              {t("archive.title")}
            </h3>
            <ul className={styles.archiveList}>
              {archive.map((project) => {
                const href = project.links.website ?? project.links.github;
                return (
                  <li key={project.id} className={styles.archiveItem} {...attr(ATTR.reveal)}>
                    <div>
                      <h4>{project.name}</h4>
                      <p>{t(`projects.${project.id}.lead`)}</p>
                    </div>
                    {href ? (
                      <Button
                        quiet
                        link={href}
                        text={project.links.website ? t("website") : t("source")}
                        icon={project.links.website ? "redirect" : "github"}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
