"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { ATTR, attr } from "@lib/contract";
import { useSound, useSoundState } from "@controllers/SoundProvider";
import styles from "@styles/Sound.module.scss";

/**
 * Bottom-right sound control (F29): an on/off toggle with animated bars, and a
 * settings button that opens a small panel (volume, ambience, interface sounds,
 * output note). Hidden until the client knows what the browser supports and
 * what was saved, so there is no flash of a wrong state. Off by default.
 *
 * The panel follows the buttons in the DOM (so Tab goes from the settings button
 * straight into it) and is drawn above them (`column-reverse`).
 *
 * The toggle's name is "Sound" + its state text, and `aria-pressed` carries the
 * state for assistive tech; nothing relies on color alone.
 */
export default function SoundControl() {
  const t = useTranslations("Sound");
  const engine = useSound();
  const state = useSoundState();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLButtonElement>(null);

  const playing = state.enabled && !state.waiting;
  const stateText = !state.supported
    ? t("unavailable")
    : state.waiting
      ? t("waiting")
      : state.enabled
        ? t("on")
        : t("off");

  // A pointer-down anywhere outside the control folds the panel (the click still reaches its target).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open]);

  // Esc closes the panel from anywhere inside the control and hands focus back to the button.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && open) {
      event.stopPropagation();
      setOpen(false);
      settingsRef.current?.focus();
    }
  };

  return (
    <div
      ref={rootRef}
      className={styles.root}
      {...attr(ATTR.sound)}
      hidden={!state.ready}
      onKeyDown={onKeyDown}
      onBlur={(event) => {
        // Focus moved on to something outside the control (Tab away): fold the panel.
        if (open && event.relatedTarget && !rootRef.current?.contains(event.relatedTarget as Node)) {
          setOpen(false);
        }
      }}
    >
      <div className={styles.bar}>
        <button
          type="button"
          className={`btn btn-quiet ${styles.toggle}`}
          aria-pressed={state.enabled}
          disabled={!state.supported}
          data-on={playing ? "true" : "false"}
          // A click is the gesture a saved "on" was waiting for: it starts, it does not toggle off.
          onClick={() => engine.setEnabled(state.waiting ? true : !state.enabled)}
          {...attr(ATTR.soundToggle)}
        >
          <span className={styles.bars} aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className={styles.label}>{t("label")}</span>
          <span className={styles.state}>{stateText}</span>
        </button>
        <button
          ref={settingsRef}
          type="button"
          className={`btn btn-quiet ${styles.settings}`}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={t("settings")}
          disabled={!state.supported}
          onClick={() => setOpen((value) => !value)}
          {...attr(ATTR.soundSettings)}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
            <circle cx="15" cy="7" r="2" />
            <circle cx="9" cy="17" r="2" />
          </svg>
        </button>
      </div>

      <div
        id={panelId}
        role="group"
        aria-label={t("settings")}
        className={styles.panel}
        hidden={!open}
        {...attr(ATTR.soundPanel)}
      >
        <label className={styles.volume}>
          <span>{t("volume")}</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(state.volume * 100)}
            onChange={(event) => engine.setVolume(Number(event.target.value) / 100)}
            {...attr(ATTR.soundVolume)}
          />
          <output aria-hidden="true">{Math.round(state.volume * 100)}%</output>
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={state.ambient}
            onChange={(event) => engine.setCategory("ambient", event.target.checked)}
            {...attr(ATTR.soundAmbient)}
          />
          <span>{t("ambience")}</span>
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={state.interaction}
            onChange={(event) => engine.setCategory("interaction", event.target.checked)}
            {...attr(ATTR.soundInteraction)}
          />
          <span>{t("interface")}</span>
        </label>
        <p className={styles.note}>{state.channels > 2 ? t("outputMulti") : t("outputStereo")}</p>
      </div>
    </div>
  );
}
