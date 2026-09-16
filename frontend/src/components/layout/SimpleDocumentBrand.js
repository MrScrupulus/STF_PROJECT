import styles from "../../styles/pages/legal.module.scss";

export default function SimpleDocumentBrand({ children }) {
  const year = new Date().getFullYear();

  return (
    <div className={styles.legal}>
      <div className={styles.legal__container}>
        <div className={styles.legal__brand}>
          <img
            src="/logo-street.png"
            alt="Street Fishing"
            className={styles.legal__logo}
          />
        </div>
        {children}
        <p className={styles.legal__copyright}>
          © {year} MrScrupulus — Tous droits réservés.
        </p>
      </div>
    </div>
  );
}
