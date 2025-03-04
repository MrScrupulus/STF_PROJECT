import React, { useState } from "react";
import styles from "../styles/components/FloatingMenu.module.scss";

const FloatingMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className={`${styles.Header__float_button} ${
          isOpen ? styles.is_open : ""
        }`}
        onClick={() => setIsOpen(true)}
        aria-label="Ouvrir le menu"
      >
        ☰
      </button>

      {isOpen && (
        <>
          <button
            className={styles.Header__close_button}
            onClick={() => setIsOpen(false)}
            aria-label="Fermer le menu"
          >
            ×
          </button>
          <div className={styles.Header__menu_items}>
            {/* Vos liens de menu */}
          </div>
        </>
      )}
    </>
  );
};

export default FloatingMenu;
