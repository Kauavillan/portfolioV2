import { useState } from "react";
import { NavbarContent } from "./Header";
import LanguageSelector from "./items/LanguageSelector";
import styles from "@styles/Navbar.module.scss";

interface Props {
  content: NavbarContent[];
  activeSection: string;
}

export default function MobileHeader({ content, activeSection }: Props) {
  return (
    <header className={styles.mobileNavbar}>
      <nav>
        <ul>
          {content.map((item, index) => (
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
