import { AcceptedIconNames, IconsProvider } from "@/providers";
import styles from "@styles/Button.module.scss";
import Link from "next/link";
interface ButtonProps {
  link: string;
  text: string;
  icon?: AcceptedIconNames;
  onclick?: () => void;
  lightMode?: boolean;
  target?: "_blank" | "_self" | "_parent" | "_top";
  download?: boolean;
}
export default function Button({
  link,
  text,
  icon,
  onclick,
  lightMode = false,
  target = "_blank",
  download = false,
}: ButtonProps) {
  return (
    <>
      {download ? (
        <button
          onClick={onclick}
          className={`${styles.button} ${lightMode && styles.light}`}
        >
          {text} {icon && <IconsProvider name={icon} />}
        </button>
      ) : link == "#" ? (
        <button
          onClick={onclick}
          className={`${styles.button} ${lightMode && styles.light}`}
        >
          {text} {icon && <IconsProvider name={icon} />}
        </button>
      ) : (
        <Link className={styles.button} href={link} target={target}>
          {text} {icon && <IconsProvider name={icon} />}
        </Link>
      )}
    </>
  );
}
