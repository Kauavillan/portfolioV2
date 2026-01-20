"use client";
import Motion from "@/components/items/Motion";
import styles from "@styles/SectionTitle.module.scss";
import { useResponsiveMotion } from "@/hooks";

interface Props {
  title: string;
  backgroundTitle?: string;
}

export default function SectionTitle({ title, backgroundTitle }: Props) {
  const bgText = (backgroundTitle || title).toUpperCase();
  const { isMobile, isReady, motionKey } = useResponsiveMotion();
  const shouldAnimate = isReady;

  return (
    <div className={styles.sectionTitle}>
      <Motion.h2
        key={`section-title-${motionKey}`}
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
        {title}
      </Motion.h2>

      <Motion.span
        className="background-title"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {bgText}
      </Motion.span>
    </div>
  );
}
