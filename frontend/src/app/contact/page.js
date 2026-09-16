"use client";
import styles from "../../styles/pages/legal.module.scss";

export default function ContactPage() {
  return (
    <>
        <h1 className={styles.legal__title}>Contact</h1>
        <section className={styles.legal__section}>
          <h2>Support Street Fishing</h2>
          <p>
            Pour toute question sur l’application (compte, compétitions,
            TestFlight) :
          </p>
          <p>
            <a href="mailto:noreply@scrupy.com">noreply@scrupy.com</a>
          </p>
          <p>
            <a href="/legal/privacy">Politique de confidentialité</a>
            {" · "}
            <a href="/legal/terms">Conditions générales d’utilisation</a>
          </p>
        </section>
    </>
  );
}
