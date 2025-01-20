"use client";

import { useEffect, useState } from "react";
import { authService } from "../../services/authService";
import styles from "./Header.module.scss";

export function Header() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching user data...");
        if (!authService.isAuthenticated()) {
          console.log("No token found, user not authenticated");
          setUser(null);
          return;
        }
        const userData = await authService.getCurrentUser();
        console.log("User data received:", userData);
        setUser(userData);
      } catch (err) {
        console.error("Error fetching user:", err);
        if (err.message.includes("401") || err.message.includes("JSON")) {
          localStorage.removeItem("token");
          setUser(null);
        }
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const token = localStorage.getItem("token");
    console.log("Token found:", !!token);
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
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

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <a href="/">Street Fishing</a>
      </div>
      <nav className={styles.nav}>
        <ul className={styles.mainNav}>
          <li>
            <a href="/">Accueil</a>
          </li>
          <li>
            <a href="/competitions">Compétitions</a>
          </li>
          <li>
            <a href="/teams">Équipes</a>
          </li>
          {user ? (
            <>
              <li>
                <a href="/profile">Profil</a>
              </li>
              <li>
                <button onClick={handleLogout}>Déconnexion</button>
              </li>
            </>
          ) : (
            <>
              <li>
                <a href="/login">Connexion</a>
              </li>
              <li>
                <a href="/register">Inscription</a>
              </li>
            </>
          )}
        </ul>
        {user && user.roles?.includes("ROLE_ADMIN") && (
          <ul className={styles.adminNav}>
            <li>
              <a href="/dashboard" className={styles.adminLink}>
                Bureau de l'ombre
              </a>
            </li>
          </ul>
        )}
      </nav>
    </header>
  );
}
