"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "../../services/authService";
import styles from "../../styles/components/layout/BottomNavBar.module.scss";

export default function BottomNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!localStorage.getItem("token")) {
          setUser(null);
          setIsAdmin(false);
          return;
        }

        const response = await authService.getCurrentUser();
        if (response.success) {
          setUser(response.user);
          setIsAdmin(response.user?.roles?.includes("ROLE_ADMIN") || false);
        }
      } catch (error) {
        setUser(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleNavigation = (path) => {
    if (!user) {
      router.push("/login");
      return;
    }
    router.push(path);
  };

  const handleAddCatch = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    router.push("/catch/add");
  };

  // Ne pas afficher sur certaines pages (login, register, etc.)
  const hiddenPaths = ["/login", "/register", "/forgot-password", "/reset-password"];
  if (hiddenPaths.some((path) => pathname.startsWith(path))) {
    return null;
  }

  if (loading) {
    return null;
  }

  return (
    <nav className={styles.bottomNav} role="navigation" aria-label="Navigation principale">
      <div className={styles.bottomNav__container}>
        {/* Bouton Compétitions */}
        <button
          className={`${styles.bottomNav__button} ${
            pathname === "/competitions" ? styles.bottomNav__button_active : ""
          }`}
          onClick={() => handleNavigation("/competitions")}
          aria-label="Compétitions"
        >
          <span className={styles.bottomNav__icon}>🏆</span>
          <span className={styles.bottomNav__label}>Compétitions</span>
        </button>

        {/* Bouton central pour ajouter une prise */}
        <button
          className={styles.bottomNav__addButton}
          onClick={handleAddCatch}
          aria-label="Ajouter une prise"
        >
          <span className={styles.bottomNav__addIcon}>📷</span>
        </button>

        {/* Bouton Mon équipe ou Validation */}
        <button
          className={`${styles.bottomNav__button} ${
            pathname === "/teams" || pathname === "/dashboard"
              ? styles.bottomNav__button_active
              : ""
          }`}
          onClick={() =>
            handleNavigation(isAdmin ? "/dashboard" : "/teams")
          }
          aria-label={isAdmin ? "Validation de prises" : "Mon équipe"}
        >
          <span className={styles.bottomNav__icon}>
            {isAdmin ? "✓" : "👥"}
          </span>
          <span className={styles.bottomNav__label}>
            {isAdmin ? "Validation" : "Mon équipe"}
          </span>
        </button>
      </div>
    </nav>
  );
}
