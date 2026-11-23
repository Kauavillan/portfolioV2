/**
 * Splits text into user-perceived characters. `Intl.Segmenter` keeps accents
 * and cedillas together (`ã`, `ç`) even when they are stored as combining
 * marks, which `Array.from` would split. Falls back to code points.
 */
export function splitGraphemes(text: string): string[] {
  const normalized = text.normalize("NFC");
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return Array.from(segmenter.segment(normalized), (s) => s.segment);
  }
  return Array.from(normalized);
}
