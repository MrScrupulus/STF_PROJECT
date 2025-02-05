"use client";

import { useEffect, useState } from "react";
import { authService } from "../../services/authService";
import styles from "@/styles/components/layout/Header.module.scss";
import floatingStyles from "@/styles/components/ui/FloatingMenu.module.scss";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePathname } from "next/navigation";

export function Header() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [currentPath, setCurrentPath] = useState("/");
  const pathname = usePathname();

  useEffect(() => {
    // Mettre à jour le chemin courant
    setCurrentPath(window.location.pathname);
  }, []);

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
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("🔒 Aucun token trouvé, utilisateur non connecté");
        setLoading(false);
        return;
      }

      const userData = await authService.getCurrentUser();
      if (userData.success) {
        setUser(userData.user);
      }
    } catch (error) {
      // Ne pas afficher d'erreur si c'est juste que l'utilisateur n'est pas connecté
      if (error.message !== "Invalid credentials.") {
        console.error(
          "❌ Erreur lors de la récupération de l'utilisateur:",
          error
        );
        setError(error.message);
      }
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

  // Rendu conditionnel du menu selon la taille d'écran
  const renderMenu = () => {
    if (isMobile) {
      return (
        <>
          <button
            className={`${floatingStyles.Header__float_button} ${
              isMenuOpen ? floatingStyles.is_open : ""
            }`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            <span className={floatingStyles.Header__float_icon}>
              {isMenuOpen ? "×" : "☰"}
            </span>
          </button>

          <nav
            className={`${floatingStyles.Header__wheel_menu} ${
              isMenuOpen ? floatingStyles.is_open : ""
            }`}
          >
            {getMenuItems().map((item, index) => {
              const rotation = (index * 360) / getMenuItems().length;
              return (
                <a
                  key={item.path || item.label}
                  href={item.path}
                  onClick={item.action}
                  className={`${floatingStyles.Header__menu_item} ${
                    isMenuOpen ? floatingStyles.is_open : ""
                  }`}
                  style={{
                    "--rotation": `${rotation}deg`,
                    backgroundColor: item.color,
                  }}
                >
                  <span className={floatingStyles.Header__menu_icon}>
                    {item.icon}
                  </span>
                  <span className={floatingStyles.Header__menu_label}>
                    {item.label}
                  </span>
                </a>
              );
            })}
          </nav>
        </>
      );
    }

    // Menu desktop existant
    const menuItems = [
      { path: "/", label: "Accueil" },
      { path: "/competitions", label: "Compétitions" },
      { path: "/teams", label: "Équipe" },
      ...(user ? [{ path: "/account", label: "Profil" }] : []),
      ...(user?.roles?.includes("ROLE_ADMIN")
        ? [{ path: "/dashboard", label: "Bureau de l'ombre" }]
        : []),
    ];

    return (
      <nav className={styles.Header__nav}>
        <ul className={styles.Header__menu}>
          {menuItems.map(
            (item) =>
              pathname !== item.path && (
                <li key={item.path} className={styles["Header__menu-item"]}>
                  <a href={item.path} className={styles["Header__menu-link"]}>
                    {item.label}
                  </a>
                </li>
              )
          )}
          {user && (
            <li className={styles["Header__menu-item"]}>
              <button
                onClick={handleLogout}
                className={styles["Header__logout-btn"]}
              >
                Déconnexion
              </button>
            </li>
          )}
        </ul>
      </nav>
    );
  };

  return (
    <header className={styles.Header}>
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
        {renderMenu()}
      </div>
    </header>
  );
}
