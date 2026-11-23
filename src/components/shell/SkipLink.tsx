import { useTranslations } from "next-intl";

/** First focusable element of the page (F01). Stays off-screen until focused. */
export default function SkipLink() {
  const t = useTranslations("Hud");
  return (
    <a className="skip-link" href="#main">
      {t("skip")}
    </a>
  );
}
