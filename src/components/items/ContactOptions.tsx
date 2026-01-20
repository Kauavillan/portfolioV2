"use client";
import commonUrls from "@/utils/commonUrls";
import Button from "./Button";
import EmailForm from "./EmailForm";
import styles from "@styles/Contact.module.scss";
import { useTranslations } from "next-intl";
import Motion from "./Motion";
import { useResponsiveMotion } from "@/hooks";

export default function ContactOptions() {
  const t = useTranslations("Contact");
  const { isMobile, isReady, motionKey } = useResponsiveMotion();
  const shouldAnimate = isReady;
  return (
    <div className={styles.contactSession}>
      <Motion.div
        initial={{ y: "-20%", opacity: 0 }}
        whileInView={{ y: "0%", opacity: 1 }}
      >
        <h5>{t("subtitle")}</h5>
      </Motion.div>
      <div className={styles.buttons}>
        <Motion.div
          key={`contact-github-${motionKey}`}
          initial={
            shouldAnimate
              ? isMobile
                ? { opacity: 0, y: 12 }
                : { x: "-20%", y: "20%", opacity: 0 }
              : false
          }
          whileInView={
            shouldAnimate
              ? isMobile
                ? { opacity: 1, y: 0 }
                : { x: "0%", y: "0%", opacity: 1 }
              : undefined
          }
          transition={{ delay: 0.5 }}
        >
          <Button text="Github" icon="github" link={commonUrls.githubProfile} />
        </Motion.div>
        <Motion.div
          initial={{ y: "20%", opacity: 0 }}
          transition={{ delay: 0.75 }}
          whileInView={{ y: "0%", opacity: 1 }}
        >
          <Button
            text="LinkedIn"
            icon="linkedin"
            link={commonUrls.linkedinProfile}
          />
        </Motion.div>
        <Motion.div
          key={`contact-email-${motionKey}`}
          initial={
            shouldAnimate
              ? isMobile
                ? { opacity: 0, y: 12 }
                : { x: "20%", y: "20%", opacity: 0 }
              : false
          }
          whileInView={
            shouldAnimate
              ? isMobile
                ? { opacity: 1, y: 0 }
                : { x: "0%", y: "0%", opacity: 1 }
              : undefined
          }
          transition={{ delay: 1 }}
        >
          <Button
            text="Email"
            icon="email"
            link={`mailto:${commonUrls.emailAddress}`}
          />
        </Motion.div>
      </div>
      <Motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ y: "0%", opacity: 1, scale: 1 }}
        transition={{ delay: 1.25 }}
      >
        <h5>{t("preForm")}</h5>
      </Motion.div>
      <Motion.div
        key={`contact-form-${motionKey}`}
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ y: "0%", opacity: 1, scale: 1 }}
        transition={{ delay: shouldAnimate ? (isMobile ? 0.25 : 1.5) : 0 }}
      >
        <EmailForm />
      </Motion.div>
    </div>
  );
}
