import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations();
  return (
    <div>
      <p>{t("sobre mim")}</p>
    </div>
  );
}
