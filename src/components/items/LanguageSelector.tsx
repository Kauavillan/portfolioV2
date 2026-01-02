import { routing } from "@/i18n/routing";
import { useLocale } from "next-intl";
import styles from "@styles/LanguageSelector.module.scss";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useEffect, useState, useRef } from "react";

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const availableLocales = routing.locales;

  // Detect clicks outside the component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // Add event listener only if isOpen is true
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Remove event listener when component unmounts or isOpen changes
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };
  function handlePress(locale: string) {
    locale === currentLocale ? setIsOpen(!isOpen) : switchLocale(locale);
  }
  // Reorganize the locales to set the active one first
  const sortedLocales = [
    currentLocale,
    ...availableLocales.filter((locale) => locale !== currentLocale),
  ];
  return (
    <nav
      ref={navRef}
      className={`${styles.languageSelector} ${isOpen ? styles.open : ""}`}
    >
      {sortedLocales.map((locale) => (
        <button
          key={locale}
          onClick={() => handlePress(locale)}
          className={
            currentLocale === locale ? styles.activeLocale : styles.locale
          }
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </nav>
  );
}
