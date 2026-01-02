import commonUrls from "@/utils/commonUrls";
import Button from "./Button";
import EmailForm from "./EmailForm";
import styles from "@styles/Contact.module.scss";
export default function ContactOptions() {
  return (
    <div className={styles.contactSession}>
      <h5>Se interessou pelo meu trabalho? Não hesite em falar comigo!</h5>
      <div className={styles.buttons}>
        <Button text="Github" icon="github" link={commonUrls.githubProfile} />
        <Button
          text="LinkedIn"
          icon="linkedin"
          link={commonUrls.linkedinProfile}
        />
        <Button
          text="Email"
          icon="email"
          link={`mailto:${commonUrls.emailAddress}`}
        />
      </div>
      <h5>Ou me mande uma mensagem diretamente por aqui!</h5>
      <EmailForm />
    </div>
  );
}
