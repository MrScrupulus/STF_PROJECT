"use client";
import styles from "../../styles/pages/legal.module.scss";

export default function Terms() {
  return (
    <div className={styles.legal}>
      <div className={styles.legal__container}>
        <h1 className={styles.legal__title}>
          Conditions Générales d'Utilisation
        </h1>

        <section className={styles.legal__section}>
          <h2>1. Objet</h2>
          <p>
            Les présentes CGU régissent l'utilisation de la plateforme Street
            Fishing Tournament...
          </p>
        </section>

        <section className={styles.legal__section}>
          <h2>2. Inscription et compte utilisateur</h2>
          <p>Pour participer aux compétitions, l'utilisateur doit :</p>
          <ul>
            
            <li>Posséder une licence de pêche valide</li>
            <li>Fournir des informations exactes</li>
            <li>Respecter le règlement des compétitions</li>
          </ul>
        </section>

        <section className={styles.legal__section}>
          <h2>3. Règles de participation</h2>
          <p>Les participants s'engagent à respecter :</p>
          <ul>
            <li>Le règlement de chaque compétition</li>
            <li>Les zones de pêche autorisées</li>
            <li>Les horaires définis</li>
            <li>L'esprit sportif et le fair-play</li>
          </ul>
        </section>

        {/* Ajoutez d'autres sections selon vos besoins */}
      </div>
    </div>
  );
}
