import { ATTR, STATE, sel } from "@lib/contract";

const closest = (target: EventTarget | null, selector: string): HTMLElement | null =>
  target instanceof Element ? target.closest<HTMLElement>(selector) : null;

/**
 * The DOM → 3D half of the skills bridge (F21): hovering or focusing a chip
 * (`[data-skill]`) lights its star, hovering a group (`[data-skill-group]`)
 * — its own area, not one of its chips — lights the whole group. Keys are the canonical `group:name` strings from the
 * markup, so switching language changes nothing.
 *
 * It listens on `document` (delegation) rather than on the chips: the chips are
 * replaced when the language changes, and the bridge must outlive that.
 * Returns the cleanup, which also switches everything off.
 */
export function bindSkillBridge(light: (key: string, on: boolean) => void): () => void {
  const chipSelector = sel(ATTR.skill);
  const groupSelector = sel(ATTR.skillGroup);

  let hoverKey: string | null = null;
  let groupKey: string | null = null;
  let focusKey: string | null = null;
  let hoverChip: HTMLElement | null = null;
  let focusChip: HTMLElement | null = null;

  // Hover and focus can light the same star at once: it only goes out when both let go.
  const holds = new Map<string, number>();
  const acquire = (key: string) => {
    const count = holds.get(key) ?? 0;
    holds.set(key, count + 1);
    if (count === 0) light(key, true);
  };
  const release = (key: string) => {
    const count = holds.get(key) ?? 0;
    if (count <= 1) {
      holds.delete(key);
      if (count === 1) light(key, false);
    } else {
      holds.set(key, count - 1);
    }
  };
  const swap = (current: string | null, next: string | null) => {
    if (current === next) return;
    if (next) acquire(next);
    if (current) release(current);
  };
  const mark = (el: HTMLElement | null, on: boolean) => el?.classList.toggle(STATE.isLit, on);

  const setHover = (chip: HTMLElement | null, group: HTMLElement | null) => {
    const nextKey = chip?.getAttribute(ATTR.skill) ?? null;
    // Over a chip: that one star. Over the group's own area (heading, gaps): the whole group.
    const nextGroup = chip ? null : (group?.getAttribute(ATTR.skillGroup) ?? null);
    if (hoverChip !== chip && hoverChip !== focusChip) mark(hoverChip, false);
    mark(chip, true);
    swap(hoverKey, nextKey);
    swap(groupKey, nextGroup);
    hoverChip = chip;
    hoverKey = nextKey;
    groupKey = nextGroup;
  };
  const setFocus = (chip: HTMLElement | null) => {
    const nextKey = chip?.getAttribute(ATTR.skill) ?? null;
    if (focusChip !== chip && focusChip !== hoverChip) mark(focusChip, false);
    mark(chip, true);
    swap(focusKey, nextKey);
    focusChip = chip;
    focusKey = nextKey;
  };

  const onOver = (event: PointerEvent) => {
    // Touch has no hover: a tap reaches the star through focus instead.
    if (event.pointerType === "touch") return;
    setHover(closest(event.target, chipSelector), closest(event.target, groupSelector));
  };
  const onOut = (event: PointerEvent) => {
    if (event.relatedTarget === null) setHover(null, null); // left the window
  };
  const onFocusIn = (event: FocusEvent) => setFocus(closest(event.target, chipSelector));
  const onFocusOut = (event: FocusEvent) => {
    if (closest(event.relatedTarget, chipSelector) === null) setFocus(null);
  };

  document.addEventListener("pointerover", onOver, { passive: true });
  document.addEventListener("pointerout", onOut, { passive: true });
  document.addEventListener("focusin", onFocusIn);
  document.addEventListener("focusout", onFocusOut);

  return () => {
    document.removeEventListener("pointerover", onOver);
    document.removeEventListener("pointerout", onOut);
    document.removeEventListener("focusin", onFocusIn);
    document.removeEventListener("focusout", onFocusOut);
    setHover(null, null);
    setFocus(null);
  };
}
