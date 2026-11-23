import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes } from "react";
import { IconsProvider, type AcceptedIconNames } from "@/providers";

interface ButtonProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  text: string;
  icon?: AcceptedIconNames;
  /** `solar` = the primary accent button. */
  variant?: "default" | "solar";
  /** Secondary, smaller button (≥ 40px target). */
  quiet?: boolean;
  /**
   * With `link` it renders an `<a>`: `#anchors`, `mailto:` and `tel:` open in the
   * same tab; `http(s)` links open in a new tab with `rel="noopener noreferrer"`.
   * Without it, it renders a `<button>`.
   */
  link?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

const isExternal = (href: string) => /^https?:\/\//i.test(href);

/** Styles come from the global `.btn` classes (see `_base.scss`). */
export default function Button({
  text,
  icon,
  variant = "default",
  quiet = false,
  link,
  type = "button",
  disabled = false,
  className,
  ...rest
}: ButtonProps) {
  const classes = [
    "btn",
    variant === "solar" && "btn-solar",
    quiet && "btn-quiet",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const content = (
    <>
      {text}
      {icon ? <IconsProvider name={icon} width={18} height={18} /> : null}
    </>
  );

  if (link) {
    const external = isExternal(link);
    return (
      <a
        {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
        className={classes}
        href={link}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
      className={classes}
      type={type}
      disabled={disabled}
      aria-disabled={disabled || undefined}
    >
      {content}
    </button>
  );
}
