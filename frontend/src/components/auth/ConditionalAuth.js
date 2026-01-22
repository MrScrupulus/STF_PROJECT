"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "../../services/authService";
import styles from "../../styles/components/ProtectedRoute.module.scss";

/**
 * Composant qui permet la consultation mais bloque les actions nécessitant l'authentification
 * Affiche un message avec un lien vers la connexion si l'utilisateur n'est pas authentifié
 */
export default function ConditionalAuth({ 
  children, 
  requireAuth = false,
  fallbackMessage = "Vous devez être connecté pour effectuer cette action."
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        const userData = await authService.getCurrentUser();
        if (userData.success && userData.user) {
          setIsAuthenticated(true);
          setCurrentUser(userData.user);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Si l'authentification est requise et que l'utilisateur n'est pas connecté
  if (requireAuth && !isLoading && !isAuthenticated) {
    return (
      <div className={styles.protected__error}>
        <div className={styles["protected__error-title"]}>Connexion requise</div>
        <div className={styles["protected__error-message"]}>{fallbackMessage}</div>
        <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "center" }}>
          <Link 
            href="/login" 
            style={{
              padding: "10px 20px",
              backgroundColor: "#007AFF",
              color: "white",
              textDecoration: "none",
              borderRadius: "5px",
              fontWeight: "600"
            }}
          >
            Se connecter
          </Link>
          <Link 
            href="/register" 
            style={{
              padding: "10px 20px",
              backgroundColor: "transparent",
              color: "#007AFF",
              textDecoration: "none",
              borderRadius: "5px",
              border: "1px solid #007AFF",
              fontWeight: "600"
            }}
          >
            Créer un compte
          </Link>
        </div>
      </div>
    );
  }

  // Passer les informations d'authentification aux enfants via un contexte ou des props
  return <>{children}</>;
}

/**
 * Hook pour vérifier l'authentification et obtenir l'utilisateur actuel
 */
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        const userData = await authService.getCurrentUser();
        if (userData.success && userData.user) {
          setIsAuthenticated(true);
          setCurrentUser(userData.user);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return { isAuthenticated, currentUser, isLoading };
}
