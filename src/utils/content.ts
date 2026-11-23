// Unwritten content is stored as "TODO(content): …" (CLAUDE.md). It stays
// visible in development so the owner sees what is missing, and is HIDDEN in
// production builds so visitors never read a placeholder.

export const PLACEHOLDER_MARK = "TODO(content)";

export const isPlaceholder = (text: string): boolean =>
  text.startsWith(PLACEHOLDER_MARK);

const showPlaceholders = process.env.NODE_ENV !== "production";

/** Whether this text should be rendered in the current environment. */
export const isVisible = (text: string): boolean =>
  showPlaceholders || !isPlaceholder(text);

/** Filters a list of texts the same way. */
export const visible = (items: readonly string[]): string[] =>
  items.filter(isVisible);
