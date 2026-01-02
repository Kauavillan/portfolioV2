import { AcceptedIconNames, IconsProvider } from "@/providers";
import styles from "@styles/Button.module.scss";
import Link from "next/link";
interface ButtonProps {
  link?: string;
  text: string;
  icon?: AcceptedIconNames;
  onclick?: () => void;
  lightMode?: boolean;
  target?: "_blank" | "_self" | "_parent" | "_top";
  download?: boolean;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}
export default function Button({
  link,
  text,
  icon,
  onclick,
  lightMode = false,
  target = "_blank",
  download = false,
  type,
  disabled = false,
}: ButtonProps) {
  return (
    <>
      {download ? (
        <button
          onClick={onclick}
          disabled={disabled}
          type={type}
          aria-disabled={disabled}
          className={`${styles.button} ${lightMode && styles.light}`}
        >
          {text} {icon && <IconsProvider name={icon} />}
        </button>
      ) : link == "#" || !link ? (
        <button
          type={type}
          onClick={onclick}
          disabled={disabled}
          aria-disabled={disabled}
          className={`${styles.button} ${lightMode && styles.light}`}
        >
          {text} {icon && <IconsProvider name={icon} />}
        </button>
      ) : (
        <Link
          className={styles.button}
          href={link}
          target={target}
          aria-disabled={disabled}
        >
          {text} {icon && <IconsProvider name={icon} />}
        </Link>
      )}
    </>
  );
}
