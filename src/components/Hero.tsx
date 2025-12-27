"use client";
import styles from "@styles/Hero.module.scss";
import { motion } from "framer-motion";
import { useMessages, useTranslations } from "next-intl";
import { useMemo } from "react";
import { useTypingEffect } from "@/hooks";

export default function Hero() {
  const t = useTranslations("Hero");
  const messages = useMessages();
  const texts: string[] = Object.values(messages.Hero.typingTexts || {});

  const { displayText } = useTypingEffect({
    texts,
    typingSpeed: 100,
    deletingSpeed: 50,
    pauseDuration: 2000,
  });

  const DisplayText = useMemo(() => {
    return (
      <motion.strong
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {displayText || "\u00A0"}
      </motion.strong>
    );
  }, [displayText]);
  const DisplayDev = useMemo(() => {
    return (
      <motion.span
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {t("developer")}
      </motion.span>
    );
  }, [t]);

  return (
    <section className={styles.hero} id="hero">
      <div>
        <h1>
          {t("textOrder") === "typing-first" ? (
            <>
              {DisplayText}
              <br />
              {DisplayDev}
            </>
          ) : (
            <>
              {DisplayDev}
              <br />
              {DisplayText}
            </>
          )}
        </h1>
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {t("greeting")}
        </motion.h3>
      </div>
      <div className={styles.scrollDownIndicator}>
        <div className={styles.mouseScroll} id="mouse"></div>
        <span>Scroll</span>
      </div>
    </section>
  );
}
