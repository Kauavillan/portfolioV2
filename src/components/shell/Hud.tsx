import { useTranslations } from "next-intl";
import { PROFILE } from "@data/profile";
import LanguageSelector from "@components/items/LanguageSelector";
import MenuToggle from "./MenuToggle";
import styles from "@styles/Hud.module.scss";

/**
 * Top HUD: wordmark, "get in touch" CTA (desktop), language selector and the
 * mobile menu button. Fixed; the gradients keep it legible over the scene.
 * The section nav lives in <NavRail/> (right rail on desktop, overlay on mobile).
 */
export default function Hud() {
  const t = useTranslations("Hud");
  return (
    <>
      <div className={`${styles.fade} ${styles.fadeTop}`} aria-hidden="true" />
      <div className={`${styles.fade} ${styles.fadeBottom}`} aria-hidden="true" />
      <header className={styles.top}>
        <a
          className={styles.wordmark}
          href="#home"
          aria-label={`${PROFILE.name} — ${t("backToTop")}`}
        >
          {PROFILE.name}
        </a>
        <div className={styles.actions}>
          <a className={`btn btn-solar ${styles.cta}`} href="#contact">
            {t("cta")}
          </a>
          <LanguageSelector />
          <MenuToggle />
        </div>
      </header>
    </>
  );
}
