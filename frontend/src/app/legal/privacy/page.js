"use client";
import styles from "../../../styles/pages/legal.module.scss";

export default function PrivacyPolicy() {
  return (
    <div className={styles.legal}>
      <div className={styles.legal__container}>
        <h1 className={styles.legal__title}>Politique de Confidentialité</h1>

        <section className={styles.legal__section}>
          <h2>1. Collecte des informations</h2>
          <p>Nous collectons les informations suivantes :</p>
          <ul>
            <li>Nom et prénom</li>
            <li>Adresse email</li>
            <li>Date de naissance</li>
            <li>Numéro de téléphone</li>
            <li>Numéro d'adhérent</li>
          </ul>
        </section>

        <section className={styles.legal__section}>
          <h2>2. Utilisation des informations</h2>
          <p>Les informations collectées sont utilisées pour :</p>
          <ul>
            <li>La gestion de votre compte</li>
            <li>L'inscription aux compétitions</li>
            <li>La communication concernant les événements</li>
            <li>L'amélioration de nos services</li>
          </ul>
        </section>

        <section className={styles.legal__section}>
          <h2>3. Protection des informations</h2>
          <p>
            Nous mettons en œuvre des mesures de sécurité pour protéger vos
            informations...
          </p>
        </section>

        {/* Ajoutez d'autres sections selon vos besoins */}
      </div>
    </div>
  );
}
