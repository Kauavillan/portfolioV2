"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ATTR, CASE_HASH_PREFIX, attr, caseTitleId } from "@lib/contract";
import type { FeaturedProject } from "@data/index";
import { visible, isVisible } from "@/utils/content";
import { IconsProvider } from "@/providers";
import Button from "@components/items/Button";
import { useUiStore } from "@stores/useUiStore";
import styles from "@styles/Case.module.scss";

interface CaseDialogProps {
  project: FeaturedProject;
  isOpen: boolean;
}

/** Native modal: Esc, focus trap, `aria-modal` and the backdrop come for free. */
export default function CaseDialog({ project, isOpen }: CaseDialogProps) {
  const t = useTranslations("Case");
  const tw = useTranslations("Work");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { id } = project;
  const titleId = caseTitleId(id);

  // Store → dialog.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Dialog → store. Fires for Esc, the Close button and the backdrop.
  const handleClose = () => {
    // Only release the page if THIS case is still the open one: when switching
    // directly A → B, A's (async) close event must not close B.
    if (useUiStore.getState().caseOpen === id) useUiStore.getState().closeCase();

    if (window.location.hash.startsWith(CASE_HASH_PREFIX)) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    const opener = useUiStore.getState().caseOpener;
    if (opener?.isConnected && useUiStore.getState().caseOpen === null) opener.focus();
  };

  // Clicks on the backdrop target the <dialog> itself (it has no padding).
  const handleBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) event.currentTarget.close();
  };

  const list = (key: "features" | "challenges" | "outcomes") =>
    visible(t.raw(`${id}.${key}`) as string[]);
  const problem = t(`${id}.problem`);
  const role = t(`${id}.role`);
  const features = list("features");
  const challenges = list("challenges");
  const outcomes = list("outcomes");
  const { links } = project;

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onClose={handleClose}
      onClick={handleBackdrop}
      {...attr(ATTR.case, id)}
    >
      <div className={styles.panel}>
        <header className={styles.head}>
          <p className="label">{tw(`types.${project.type}`)}</p>
          <button
            type="button"
            className={styles.close}
            aria-label={t("ui.close")}
            onClick={() => dialogRef.current?.close()}
            {...attr(ATTR.caseClose)}
          >
            <IconsProvider name="close" width={18} height={18} />
          </button>
        </header>

        <div ref={scrollRef} className={styles.scroll} {...attr(ATTR.lenisPrevent)}>
          {project.image ? (
            <figure className={styles.media}>
              <Image
                src={project.image.src}
                width={project.image.width}
                height={project.image.height}
                alt={t(`${id}.imageAlt`)}
                sizes="(max-width: 900px) 100vw, 880px"
                loading="lazy"
              />
            </figure>
          ) : null}

          <h2 id={titleId} className="h-project">
            {project.name}
          </h2>
          <p className={`lead ${styles.lead}`}>{tw(`projects.${id}.lead`)}</p>

          <div className={styles.grid}>
            {isVisible(problem) ? (
              <section className={styles.block}>
                <h3>{t("ui.problem")}</h3>
                <p>{problem}</p>
              </section>
            ) : null}
            {isVisible(role) ? (
              <section className={styles.block}>
                <h3>{t("ui.role")}</h3>
                <p>{role}</p>
              </section>
            ) : null}
            {features.length > 0 ? (
              <section className={styles.block}>
                <h3>{t("ui.features")}</h3>
                <ul>
                  {features.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            {challenges.length > 0 ? (
              <section className={styles.block}>
                <h3>{t("ui.challenges")}</h3>
                <ul>
                  {challenges.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          {outcomes.length > 0 ? (
            <section className={`${styles.block} ${styles.wide}`}>
              <h3>{t("ui.outcomes")}</h3>
              <ul>
                {outcomes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className={`${styles.block} ${styles.wide}`}>
            <h3>{t("ui.stack")}</h3>
            <ul className={styles.stack}>
              {project.stack.map((tech) => (
                <li key={tech} className="chip">
                  {tech}
                </li>
              ))}
            </ul>
          </section>

          <div className={styles.actions}>
            {links.website ? (
              <Button variant="solar" link={links.website} text={tw("website")} icon="redirect" />
            ) : null}
            {links.github ? (
              <Button link={links.github} text={tw("source")} icon="github" />
            ) : null}
            {links.appStore ? (
              <Button link={links.appStore} text={tw("appStore")} icon="appStore" />
            ) : null}
            {links.playStore ? (
              <Button link={links.playStore} text={tw("playStore")} icon="googlePlay" />
            ) : null}
          </div>
        </div>
      </div>
    </dialog>
  );
}
