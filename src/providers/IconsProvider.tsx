import { FaGithub, FaLinkedin } from "react-icons/fa";
import { GrClose } from "react-icons/gr";
import { IoMdMail } from "react-icons/io";

// Mapa de ícones disponíveis - adicione novos ícones aqui
export const ICON_MAP = {
  github: FaGithub,
  linkedin: FaLinkedin,
  close: GrClose,
  "menu-close": GrClose,
  mail: IoMdMail,
  email: IoMdMail,
} as const;

// Tipo dinâmico extraído das chaves do mapa de ícones
export type AcceptedIconNames = keyof typeof ICON_MAP;

interface Props {
  name: AcceptedIconNames;
  width?: number;
  height?: number;
  className?: string;
}

export function IconsProvider({ name, width, height, className }: Props) {
  const iconStyle = { width, height };
  const IconComponent = ICON_MAP[name];

  if (!IconComponent) {
    return null;
  }

  return <IconComponent style={iconStyle} className={className} />;
}
