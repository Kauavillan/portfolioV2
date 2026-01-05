"use client";
import styles from "../styles/Navbar.module.scss";
import { useTranslations } from "next-intl";
import { useState, useEffect, useRef } from "react";
import LanguageSelector from "./items/LanguageSelector";
import { useScreenSize } from "@/hooks";

export interface NavbarContent {
  link: string;
  text: string;
}

export default function Header() {
  const t = useTranslations("Header");
  const { isMobile } = useScreenSize();
  const [activeSection, setActiveSection] = useState<string>("hero");
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const sectionIds = [
      "hero",
      "about",
      "skills",
      "projects",
      "contact",
    ] as const;
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (intersecting) {
          setActiveSection(intersecting.target.id);
        }
      },
      {
        rootMargin: "-50% 0px -50% 0px",
        threshold: 0,
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const navEl = navRef.current;
    if (!navEl) return;

    // Wait a tick for className updates/layout before measuring.
    const id = window.requestAnimationFrame(() => {
      const activeClass = typeof CSS !== "undefined" ? CSS.escape(styles.active) : styles.active;
      const activeLi = navEl.querySelector(`li.${activeClass}`) as HTMLElement | null;
      if (!activeLi) return;

      const navRect = navEl.getBoundingClientRect();
      const liRect = activeLi.getBoundingClientRect();
      const currentScrollLeft = navEl.scrollLeft;
      const paddingLeft = Number.parseFloat(getComputedStyle(navEl).paddingLeft || "0") || 0;

      // Align the active item to the left edge (inside nav padding).
      const targetLeft = currentScrollLeft + (liRect.left - navRect.left) - paddingLeft;
      const maxLeft = Math.max(0, navEl.scrollWidth - navEl.clientWidth);
      const clampedLeft = Math.min(Math.max(0, targetLeft), maxLeft);

      navEl.scrollTo({ left: clampedLeft, behavior: "smooth" });
    });

    return () => window.cancelAnimationFrame(id);
  }, [activeSection, isMobile]);

  const navbarContent: NavbarContent[] = [
    {
      text: t("home"),
      link: "hero",
    },
    {
      text: t("about"),
      link: "about",
    },
    {
      text: t("skills"),
      link: "skills",
    },
    {
      text: t("projects"),
      link: "projects",
    },
    {
      text: "contact",
      link: "contact",
    },
  ];

  return (
    <header className={styles.navbar}>
      <nav ref={navRef}>
        <ul>
          {navbarContent.map((item, index) => (
            <li
              key={index}
              className={activeSection === item.link ? styles.active : ""}
            >
              <a href={`#${item.link}`}>{item.text}</a>
            </li>
          ))}
        </ul>
      </nav>

      <LanguageSelector />
    </header>
  );
}
