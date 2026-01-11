import { useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations>;

/**
 * Returns rich text translation with custom components.
 * @param t the ranslation object returned by useTranslations hook
 * @param key the translation key
 * @returns the text translated with rich text components. Accepts "break" and "highlight" tags.
 */
export default function richT(
  t: Translator,
  key: Parameters<Translator["rich"]>[0],
  customValues?: Record<string, React.ReactNode>
) {
  return t.rich(key, {
    break: () => <br key="break" />,
    highlight: (chunks) => <strong key="strong">{chunks}</strong>,
    ...customValues,
  });
}
