"use client";

import { useEffect, useState } from "react";
import { authService } from "../../services/authService";
import styles from "@/styles/components/layout/Header.module.scss";
import floatingStyles from "@/styles/components/FloatingMenu.module.scss";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function Header() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 600px)");
  const [currentPath, setCurrentPath] = useState("/");
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Mettre à jour le chemin courant
    setCurrentPath(window.location.pathname);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50); // Change d'état après 50px de scroll
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setIsMenuOpen(false);
    }
  }, [isMobile]);

  // Modifier getMenuItems pour filtrer l'item de la page courante
  const getMenuItems = () => {
    const allItems = [
      { path: "/", label: "Accueil", color: "#3b82f6", icon: "🏠" },
      {
        path: "/competitions",
        label: "Compétitions",
        color: "#10b981",
        icon: "🎣",
      },
      { path: "/teams", label: "Équipe", color: "#f59e0b", icon: "👥" },
      ...(user
        ? [
            { path: "/account", label: "Profil", color: "#8b5cf6", icon: "👤" },
            {
              label: "Déconnexion",
              color: "#ef4444",
              icon: "🚪",
              action: handleLogout,
            },
          ]
        : [
            {
              path: "/login",
              label: "Connexion",
              color: "#6366f1",
              icon: "🔑",
            },
            {
              path: "/register",
              label: "Inscription",
              color: "#14b8a6",
              icon: "✍️",
            },
          ]),
      ...(user?.roles?.includes("ROLE_ADMIN")
        ? [
            {
              path: "/dashboard",
              label: "Bureau de l'ombre",
              color: "#6b7280",
              icon: "🕶️",
            },
          ]
        : []),
    ];

    // Filtrer l'item correspondant à la page courante
    return allItems.filter((item) => {
      if (!item.path) return true; // Garder les items sans path (comme déconnexion)
      return item.path !== currentPath; // Retirer l'item de la page courante
    });
  };

  const fetchUser = async () => {
    try {
      if (!localStorage.getItem("token")) {
        console.log("Pas de token, utilisateur non connecté");
        setUser(null);
        return;
      }

      const response = await authService.getCurrentUser();
      console.log("Réponse getCurrentUser:", response);

      if (response.success) {
        setUser(response.user);
      }
    } catch (error) {
      console.error("Erreur fetchUser:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogout = () => {
    console.log("Logging out...");
    authService.logout();
    setUser(null);
    window.location.href = "/login";
  };

  if (loading) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  if (error) {
    return <div className={styles.error}>Erreur: {error}</div>;
  }

  const renderMobileMenu = () => {
    if (!isMobile) return null;

    return (
      <>
        <button
          className={`${floatingStyles.Header__float_button} ${
            isMenuOpen ? floatingStyles.is_open : ""
          }`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          <span>{isMenuOpen ? "×" : "☰"}</span>
        </button>

        {isMenuOpen && (
          <>
            <div
              className={floatingStyles.Header__overlay}
              onClick={() => setIsMenuOpen(false)}
            />
            <button
              className={floatingStyles.Header__close_button}
              onClick={(e) => {
                e.stopPropagation();
                console.log("Bouton de fermeture cliqué");
                setIsMenuOpen(false);
              }}
              aria-label="Fermer le menu"
            >
              ×
            </button>
            <div
              className={floatingStyles.Header__menu_items}
              onClick={(e) => e.stopPropagation()}
            >
              {getMenuItems().map((item, index) => (
                <a
                  key={item.path || item.label}
                  href={item.path}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.action) {
                      item.action(e);
                    }
                    setIsMenuOpen(false);
                  }}
                  style={{ backgroundColor: item.color }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          </>
        )}
      </>
    );
  };

  // Rendu conditionnel du menu selon la taille d'écran
  const renderMenu = () => {
    if (isMobile) {
      return renderMobileMenu();
    }

    // Menu desktop existant
    const menuItems = [
      { path: "/", label: "Accueil" },
      { path: "/competitions", label: "Compétitions" },
      { path: "/teams", label: "Équipe" },
      ...(!user ? [{ path: "/register", label: "Inscription" }] : []),
      ...(user ? [{ path: "/account", label: "Profil" }] : []),
      ...(user?.roles?.includes("ROLE_ADMIN")
        ? [{ path: "/dashboard", label: "Bureau de l'ombre" }]
        : []),
    ];

    // Filtrer l'item correspondant à la page courante
    const filteredMenuItems = menuItems.filter(
      (item) => item.path !== pathname
    );

    return (
      <nav className={styles.Header__nav}>
        <ul className={styles.Header__menu}>
          {filteredMenuItems.map((item) => (
            <li key={item.path} className={styles["Header__menu-item"]}>
              <Link href={item.path} className={styles["Header__menu-link"]}>
                {item.label}
              </Link>
            </li>
          ))}
          <li
            className={`${styles["Header__menu-item"]} ${styles["Header__menu-item--auth"]}`}
          >
            {user ? (
              <button
                onClick={handleLogout}
                className={styles["Header__logout-btn"]}
              >
                Déconnexion
              </button>
            ) : (
              <Link href="/login" className={styles["Header__menu-link"]}>
                Connexion
              </Link>
            )}
          </li>
        </ul>
      </nav>
    );
  };

  return (
    <header
      className={`${styles.Header} ${isScrolled ? styles.scrolled : ""}`}
      data-modal-open="false"
      role="banner"
      aria-label="En-tête du site"
    >
      <div className={styles.Header__container}>
        <div className={styles.Header__logo}>
          <a href="/" className={styles.Header__logo_link}>
            <img
              src="/images/logos/logo_street.png"
              alt="Street Fishing Logo"
              className={styles.Header__logo_image}
            />
          </a>
          {user && (
            <span className={styles.Header__welcome}>
              Bonjour {user.firstname}
            </span>
          )}
        </div>
        <nav role="navigation" aria-label="Navigation principale">
          {renderMenu()}
        </nav>
      </div>
    </header>
  );
}
