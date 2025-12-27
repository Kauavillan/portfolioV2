import {
  FaGithub,
  FaLinkedin,
  FaStripeS,
  FaHtml5,
  FaCss3Alt,
} from "react-icons/fa";
import { BsBoxArrowUpRight } from "react-icons/bs";

import { FaReact, FaAppStore } from "react-icons/fa6";
import { GrClose } from "react-icons/gr";
import { IoMdMail } from "react-icons/io";
import { IoLogoJavascript, IoLogoGooglePlaystore } from "react-icons/io5";
import {
  SiTypescript,
  SiMariadb,
  SiExpo,
  SiNextdotjs,
  SiSass,
  SiPhp,
} from "react-icons/si";
import Image from "next/image";

/** Icons from /public/icons with suffix Colored */
const COLORED_ICONS_MAP = {
  javascriptColored: "javascript",
  typescriptColored: "typescript",
  reactColored: "react",
  reactNativeColored: "react-native",
  nextColored: "next",
  html5Colored: "html5",
  css3Colored: "css3",
  sassColored: "sass",
  phpColored: "php",
  javaColored: "java",
  cColored: "c",
  gitColored: "git",
  mariadbColored: "mariadb",
  csharpColored: "csharp",
  stripeColored: "stripe",
  revenuecatColored: "revenuecat",
  expoColored: "expo",
};

export const ICON_MAP = {
  github: FaGithub,
  linkedin: FaLinkedin,
  close: GrClose,
  "menu-close": GrClose,
  mail: IoMdMail,
  email: IoMdMail,
  javascript: IoLogoJavascript,
  typescript: SiTypescript,
  stripe: FaStripeS,
  react: FaReact,
  mariadb: SiMariadb,
  html5: FaHtml5,
  css3: FaCss3Alt,
  expo: SiExpo,
  next: SiNextdotjs,
  sass: SiSass,
  php: SiPhp,
  redirect: BsBoxArrowUpRight,
  googlePlay: IoLogoGooglePlaystore,
  appStore: FaAppStore,
  ...COLORED_ICONS_MAP,
} as const;

export type AcceptedIconNames = keyof typeof ICON_MAP;

interface Props {
  name: AcceptedIconNames;
  width?: number;
  height?: number;
  className?: string;
}

export function IconsProvider({
  name,
  width = 24,
  height = 24,
  className,
}: Props) {
  const icon = ICON_MAP[name];

  if (!icon) {
    return null;
  }

  if (typeof icon === "function") {
    const IconComponent = icon as React.ComponentType<any>;
    return <IconComponent style={{ width, height }} className={className} />;
  }

  if (typeof icon === "string") {
    return (
      <Image
        src={`/icons/${icon}.svg`}
        alt={name}
        width={width}
        height={height}
        className={className}
      />
    );
  }

  return null;
}
