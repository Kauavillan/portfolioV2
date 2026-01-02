import { Link } from "react-scroll";
interface Props {
  link: string;
  text: string;
}
export default function NavbarLink({ link, text }: Props) {
  return (
    <li>
      <Link
        activeClass="active"
        to={link}
        spy={true}
        smooth={true}
        offset={-100}
        duration={500}
      >
        <span>{text}</span>
      </Link>
    </li>
  );
}
