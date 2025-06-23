import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "pt"],
  localePrefix: "as-needed",
  defaultLocale: "en",
});
