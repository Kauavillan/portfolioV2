"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";
import styles from "@styles/LanguageSelector.module.scss";

/** Each language is named in itself (and announced with its own `lang`). */
const NATIVE_NAMES: Record<string, string> = { en: "English", pt: "Português" };

/**
 * next-intl always navigates to a PREFIXED url when the locale changes
 * (`/en#work`); for the default locale the proxy then redirects `/en` → `/`,
 * and that redirect drops the `#hash`. We stash it in sessionStorage (it must
 * survive the remount a locale change causes) and put it back afterwards.
 * Storage can throw (private mode, blocked): then the hash is simply not kept.
 */
const HASH_KEY = "kvn:lang-switch-hash";

function stashHash(hash: string) {
  try {
    sessionStorage.setItem(HASH_KEY, hash);
  } catch {
    /* storage unavailable: the hash is not restored */
  }
}

function takeStashedHash(): string {
  try {
    const hash = sessionStorage.getItem(HASH_KEY) ?? "";
    sessionStorage.removeItem(HASH_KEY);
    return hash;
  } catch {
    return "";
  }
}

/**
 * Pill with the active language first; hovering, focusing or pressing the
 * active one reveals the others. Switching keeps the route AND the `#hash`,
 * and does not jump the scroll position.
 */
export default function LanguageSelector() {
  const t = useTranslations("Hud");
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  // Close when clicking/tapping outside.
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen]);

  useEffect(() => {
    const hash = takeStashedHash();
    if (hash && window.location.hash !== hash) {
      const { pathname: path, search } = window.location;
      history.replaceState(null, "", `${path}${search}${hash}`);
    }
  }, [currentLocale]);

  const handlePress = (locale: string) => {
    if (locale === currentLocale) {
      setIsOpen((open) => !open);
      return;
    }
    setIsOpen(false);
    stashHash(window.location.hash);
    router.replace(`${pathname}${window.location.hash}`, {
      locale,
      scroll: false,
    });
  };

  // Active locale first.
  const locales = [
    currentLocale,
    ...routing.locales.filter((locale) => locale !== currentLocale),
  ];

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={t("language.label")}
      className={`${styles.languageSelector} ${isOpen ? styles.open : ""}`}
    >
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          lang={locale}
          aria-label={NATIVE_NAMES[locale] ?? locale}
          aria-current={locale === currentLocale ? "true" : undefined}
          className={locale === currentLocale ? styles.activeLocale : styles.locale}
          onClick={() => handlePress(locale)}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
