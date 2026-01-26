"use client";
import Link from "next/link";
import styles from "../styles/components/Footer.module.scss";
import { useState } from "react";

export default function Footer() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <footer
      role="contentinfo"
      aria-label="Pied de page"
      className={styles.footer}
    >
      <div className={styles.footer__container}>
        <div className={styles.footer__content}>
          <div className={styles.footer__section}>
            <h3 className={styles.footer__title}>Street Fishing Tournament</h3>
            <p className={styles.footer__description}>
              La plateforme de référence pour les compétitions de street fishing
            </p>
          </div>

          <div className={styles.footer__section}>
            <h4 className={styles.footer__subtitle}>Liens utiles</h4>
            <ul className={styles.footer__links}>
              <li>
                <Link href="/legal/privacy" className={styles.footer__link}>
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className={styles.footer__link}>
                  Conditions générales d'utilisation
                </Link>
              </li>
              <li>
                <Link href="/contact" className={styles.footer__link}>
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.footer__bottom}>
          <p className={styles.footer__copyright}>
            © {new Date().getFullYear()} MrScrupulus - Tous droits réservés.
          </p>
        </div>
      </div>


      <div role="search">
        <label htmlFor="search" className="sr-only">
          Rechercher
        </label>
        <input
          type="search"
          id="search"
          aria-label="Champ de recherche"
          placeholder="Rechercher..."
        />
      </div>

      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-expanded={isMenuOpen}
        aria-controls="mobile-menu"
        aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
      >
        Menu
      </button>
    </footer>
  );
}
