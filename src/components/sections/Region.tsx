import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ATTR, attr, type SectionId } from "@lib/contract";

interface RegionProps {
  id: SectionId;
  /** Id of the heading that names the section (`aria-labelledby`). */
  headingId: string;
  /** 1180px wide instead of the 620px text column. */
  wide?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * One navigable section = one camera station. Stamps the `data-*` contract
 * (section / label / sector / station) so no section repeats it by hand.
 * `label` and `sector` are translated here: the locator reads them from the DOM.
 */
export default function Region({
  id,
  headingId,
  wide = false,
  className,
  children,
}: RegionProps) {
  const nav = useTranslations("Hud.nav");
  const sectors = useTranslations("Sectors");
  const classes = ["region", wide && "region-wide", className]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      id={id}
      className={classes}
      aria-labelledby={headingId}
      {...attr(ATTR.section)}
      {...attr(ATTR.label, nav(id))}
      {...attr(ATTR.sector, sectors(id))}
      {...attr(ATTR.station, id)}
    >
      <div className="region-inner" {...attr(ATTR.revealScope)}>
        {children}
      </div>
    </section>
  );
}
