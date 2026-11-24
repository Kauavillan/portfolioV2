import { Color } from "three";

/** Reads a CSS custom property as a color, so the world uses the design tokens. */
export function readCssColor(el: Element, property: string, fallback: string): Color {
  const raw = getComputedStyle(el).getPropertyValue(property).trim();
  try {
    return new Color(raw || fallback);
  } catch {
    return new Color(fallback);
  }
}
