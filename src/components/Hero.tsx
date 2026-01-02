"use client";
import styles from "@styles/Hero.module.scss";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { useMessages, useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { useTypingEffect } from "@/hooks";

export default function Hero() {
  const fadeInOpacity = useMotionValue(0);
  const smoothFadeIn = useSpring(fadeInOpacity, {
    stiffness: 50,
    damping: 20,
    duration: 0.8,
  });
  const t = useTranslations("Hero");
  const messages = useMessages();
  const texts: string[] = Object.values(messages.Hero.typingTexts || {});

  const { displayText } = useTypingEffect({
    texts,
    typingSpeed: 100,
    deletingSpeed: 50,
    pauseDuration: 2000,
  });

  const { scrollY } = useScroll();
  const maxScroll =
    typeof window !== "undefined" ? window.innerHeight * 0.3 : 400;
  const scrollOpacity = useTransform(scrollY, [0, maxScroll], [1, 0], {
    clamp: true,
  });

  // Combine fade-in and scroll opacity
  const combinedOpacity = useTransform(
    [smoothFadeIn, scrollOpacity],
    ([fadeIn, scroll]) => (fadeIn as number) * (scroll as number)
  );

  useEffect(() => {
    setTimeout(() => {
      fadeInOpacity.set(1);
    }, 3000);
  }, [fadeInOpacity]);

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
      <motion.div
        className={styles.scrollDownIndicator}
        style={{ opacity: combinedOpacity }}
      >
        <div className={styles.mouseScroll} id="mouse"></div>
        <span>Scroll</span>
      </motion.div>
    </section>
  );
}
