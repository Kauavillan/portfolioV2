import styles from "@styles/Navbar.module.scss";
import { NavbarContent } from "./Header";
import LanguageSelector from "./items/LanguageSelector";

interface Props {
  content: NavbarContent[];
  activeSection: string;
}
export default function DesktopHeader({ content, activeSection }: Props) {
  return (
    <header className={styles.navbar}>
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
