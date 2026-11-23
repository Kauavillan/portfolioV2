import { useTranslations } from "next-intl";
import { ATTR, SECTION_IDS, attr, type SectionId } from "@lib/contract";

interface SectionHeaderProps {
  id: SectionId;
  headingId: string;
  title: string;
  lead?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Label (`03 · Work`) + title + lead, revealed together on scroll. */
export default function SectionHeader({ id, headingId, title, lead }: SectionHeaderProps) {
  const nav = useTranslations("Hud.nav");
  const index = SECTION_IDS.indexOf(id) + 1;

  return (
    <>
      <p className="label" {...attr(ATTR.reveal)}>
        {pad(index)} · {nav(id)}
      </p>
      <h2 id={headingId} className="h-section" {...attr(ATTR.reveal)}>
        {title}
      </h2>
      {lead ? (
        <p className="lead" {...attr(ATTR.reveal)}>
          {lead}
        </p>
      ) : null}
    </>
  );
}
