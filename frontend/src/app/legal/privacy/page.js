"use client";
import Link from "next/link";
import styles from "../../../styles/pages/legal.module.scss";

export default function PrivacyPolicy() {
  return (
    <>
        <h1 className={styles.legal__title}>Mentions légales et confidentialité</h1>
        <p>
          Street Fishing — application et site. Dernière mise à jour : 13 septembre 2026.
          Même contenu que l’onglet « Mentions légales » de l’application.
        </p>

        <section className={styles.legal__section}>
          <h2>A. Éditeur et hébergement</h2>
          <p>
            Street Fishing est une application de gestion de compétitions de pêche urbaine.
            L’application et l’API sont hébergées sur nos serveurs (scrupy.com / api.scrupy.com), accès HTTPS.
          </p>
          <p>
            Textes, images, logos et icônes sont la propriété de Street Fishing, sauf mention contraire.
          </p>
        </section>

        <section className={styles.legal__section}>
          <h2>B. Politique de confidentialité</h2>
          <p>Données collectées :</p>
          <ul>
            <li>Compte : nom, prénom, e-mail, mot de passe (haché), éventuellement téléphone et date de naissance</li>
            <li>Usage : équipes, inscriptions, prises (espèce, taille, photo, commentaire)</li>
            <li>Localisation : pendant une compétition, pour vérifier la zone autorisée</li>
            <li>Photos : stockées sur nos serveurs ; galerie de l’appareil si vous l’autorisez</li>
            <li>Notifications : jeton de l’appareil si vous les acceptez</li>
            <li>Stockage local : préférences sur l’appareil</li>
          </ul>
          <p>
            Finalités : compte, compétitions, scores, classements, e-mails de service.
            Pas de vente de données à des tiers.
          </p>
          <p>
            Droits RGPD (accès, rectification, suppression, opposition) :
            via le profil dans l’application ou{" "}
            <a href="mailto:noreply@scrupy.com">noreply@scrupy.com</a>.
          </p>
        </section>

        <section className={styles.legal__section}>
          <h2>C. Conditions d’utilisation</h2>
          <p>
            L’usage de Street Fishing (app et site) implique de fournir des informations exactes
            et de respecter le règlement, les zones et horaires de chaque compétition, ainsi que l’esprit sportif.
          </p>
          <p>
            Détail : <Link href="/legal/terms">Conditions générales d’utilisation</Link>.
          </p>
        </section>

        <section className={styles.legal__section}>
          <h2>D. Contact</h2>
          <p>
            <a href="mailto:noreply@scrupy.com">noreply@scrupy.com</a>
            {" · "}
            <Link href="/contact">Page contact</Link>
          </p>
        </section>
    </>
  );
}
