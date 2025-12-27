"use client";
import { useScreenSize } from "@/hooks";
import { AcceptedIconNames } from "@/providers";
import styles from "../styles/Navbar.module.scss";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import LanguageSelector from "./LanguageSelector";

// Interface base com propriedades comuns
interface BaseNavbarContent {
  link: string;
}

// Union type: ou tem text OU tem icon, mas não ambos
type NavbarContent = BaseNavbarContent &
  ({ text: string; icon?: never } | { icon: AcceptedIconNames; text?: never });

export default function Header() {
  const { width, height, isMobile, isTablet, isDesktop, isLargeDesktop } =
    useScreenSize();
  const t = useTranslations("Header");

  const [activeSection, setActiveSection] = useState<string>("hero");

  // Acessar todas as linguagens disponíveis

  // Função para trocar de idioma

  useEffect(() => {
    const sections = document.querySelectorAll("section[id]");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        threshold: 0.6, // 60% da seção precisa estar visível
        rootMargin: "-80px 0px -20% 0px",
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);
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
  ];

  return (
    <header className={styles.navbar}>
      <nav>
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
