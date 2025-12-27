"use client";
import { motion } from "framer-motion";
import styles from "@styles/SectionTitle.module.scss";

interface Props {
  title: string;
  backgroundTitle?: string;
}

export default function SectionTitle({ title, backgroundTitle }: Props) {
  const bgText = (backgroundTitle || title).toUpperCase();

  return (
    <div className={styles.sectionTitle}>
      <motion.h2
        initial={{ x: "-20%", opacity: 0 }}
        whileInView={{ x: "0%", opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true, amount: 0.4 }}
      >
        {title}
      </motion.h2>

      <motion.span
        className="background-title"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.6 }}
        viewport={{ once: true, amount: 0.4 }}
      >
        {bgText}
      </motion.span>
    </div>
  );
}
