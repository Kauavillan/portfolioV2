"use client";

import SectionTitle from "./SectionTitle";
import styles from "@styles/About.module.scss";
import { IconsProvider } from "@/providers";
import { useTranslations } from "next-intl";
import richT from "@/utils/richTextTranslationHandler";
import Image from "next/image";
import Motion from "@/components/items/Motion";
import { useResponsiveMotion } from "@/hooks";
export default function About() {
  const t = useTranslations("About");
  const { isMobile, isReady, motionKey } = useResponsiveMotion();
  const shouldAnimate = isReady;
  return (
    <section id="about">
      <SectionTitle title={t("title")} />
      <div className={styles.about}>
        <Motion.div
          key={`about-text-${motionKey}`}
          initial={
            shouldAnimate
              ? isMobile
                ? { y: "20%", opacity: 0 }
                : { x: "-20%", opacity: 0 }
              : false
          }
          whileInView={
            shouldAnimate
              ? isMobile
                ? { y: "0%", opacity: 1 }
                : { x: "0%", opacity: 1 }
              : undefined
          }
        >
          <p>{richT(t, "aboutText")}</p>
        </Motion.div>
        <Motion.div
          key={`about-avatar-${motionKey}`}
          initial={
            shouldAnimate
              ? isMobile
                ? { y: "20%", opacity: 0 }
                : { x: "20%", opacity: 0 }
              : false
          }
          whileInView={
            shouldAnimate
              ? isMobile
                ? { y: "0%", opacity: 1 }
                : { x: "0%", opacity: 1 }
              : undefined
          }
          className={styles.profileAvatar}
        >
          <Image
            width={250}
            height={250}
            src="/img/profile-avatar.png"
            alt="Profile picture"
          />
        </Motion.div>
      </div>
      <div className={styles.socialLinks}>
        <Motion.span
          initial={{ y: "50%", opacity: 0 }}
          whileInView={{ y: "0%", opacity: 1 }}
        >
          <a
            href="https://github.com/Kauavillan"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            <IconsProvider name="github" width={32} height={32} />
          </a>
        </Motion.span>
        <Motion.span
          initial={{ y: "50%", opacity: 0 }}
          transition={{ delay: 0.25 }}
          whileInView={{ y: "0%", opacity: 1 }}
        >
          <a
            href="https://linkedin.com/in/kauã-villa-nova-da-silva"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <IconsProvider name="linkedin" width={32} height={32} />
          </a>
        </Motion.span>
        <Motion.span
          initial={{ y: "50%", opacity: 0 }}
          transition={{ delay: 0.5 }}
          whileInView={{ y: "0%", opacity: 1 }}
        >
          <a
            href="mailto:kvn.contact.professional@gmail.com"
            aria-label="Email"
          >
            <IconsProvider name="mail" width={32} height={32} />
          </a>
        </Motion.span>
      </div>
    </section>
  );
}
