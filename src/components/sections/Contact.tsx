import { useTranslations } from "next-intl";
import { ATTR, attr } from "@lib/contract";
import commonUrls from "@/utils/commonUrls";
import { IconsProvider, type AcceptedIconNames } from "@/providers";
import Button from "@components/items/Button";
import EmailForm from "@components/items/EmailForm";
import Region from "./Region";
import SectionHeader from "./SectionHeader";
import styles from "@styles/Contact.module.scss";

const bare = (url: string) => url.replace(/^https?:\/\//, "");

/**
 * 06 · Contact: title, primary CTA, contact list and the e-mail form.
 * It is the last section, so its content does NOT hide when scrolled past
 * (see RevealController).
 */
export default function Contact() {
  const t = useTranslations("Contact");
  const mailto = `mailto:${commonUrls.emailAddress}`;

  const contacts: {
    key: string;
    label: string;
    value: string;
    href: string;
    icon: AcceptedIconNames;
    external: boolean;
  }[] = [
    { key: "email", label: "Email", value: commonUrls.emailAddress, href: mailto, icon: "mail", external: false },
    { key: "github", label: "GitHub", value: bare(commonUrls.githubProfile), href: commonUrls.githubProfile, icon: "github", external: true },
    { key: "linkedin", label: "LinkedIn", value: bare(commonUrls.linkedinProfile), href: commonUrls.linkedinProfile, icon: "linkedin", external: true },
  ];

  return (
    <Region id="contact" headingId="contact-title" className={styles.contact}>
      <SectionHeader id="contact" headingId="contact-title" title={t("title")} lead={t("lead")} />

      <div className={styles.actions} {...attr(ATTR.reveal)}>
        <Button
          variant="solar"
          icon="mail"
          text={t("email")}
          link={`${mailto}?subject=${encodeURIComponent(t("mailSubject"))}`}
        />
      </div>

      <ul className={styles.list} aria-label={t("listLabel")} {...attr(ATTR.reveal)}>
        {contacts.map((c) => (
          <li key={c.key}>
            <a
              href={c.href}
              {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              <IconsProvider name={c.icon} width={20} height={20} />
              <span className={styles.name}>{c.label}</span>
              <span className={styles.value}>{c.value}</span>
            </a>
          </li>
        ))}
      </ul>

      <h3 className={`label ${styles.formLabel}`} {...attr(ATTR.reveal)}>
        {t("preForm")}
      </h3>
      <div {...attr(ATTR.reveal)}>
        <EmailForm />
      </div>
    </Region>
  );
}
