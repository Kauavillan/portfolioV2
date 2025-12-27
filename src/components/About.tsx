import SectionTitle from "./SectionTitle";
import styles from "@styles/About.module.scss";
import { IconsProvider } from "@/providers";

export default function About() {
  return (
    <section id="about">
      <SectionTitle title="About me" />
      <div className={styles.about}>
        <p>
          I am a passionate software developer with experience in building web
          and mobile applications. I enjoy learning new technologies and
          improving my skills to create efficient and user-friendly solutions.
        </p>
        <img
          src="/img/profile-avatar.png"
          alt="Profile picture"
          className={styles.profileAvatar}
        />
      </div>
      <div className={styles.socialLinks}>
        <a
          href="https://github.com/Kauavillan"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
        >
          <IconsProvider name="github" width={32} height={32} />
        </a>
        <a
          href="https://linkedin.com/in/kauã-villa-nova-da-silva"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
        >
          <IconsProvider name="linkedin" width={32} height={32} />
        </a>
        <a href="mailto:kvn.contact.professional@gmail.com" aria-label="Email">
          <IconsProvider name="mail" width={32} height={32} />
        </a>
      </div>
    </section>
  );
}
