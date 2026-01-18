"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "../../services/authService";
import styles from "../../styles/components/ProtectedRoute.module.scss";

export default function ProtectedRoute({ children, requiredRole = null }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Non authentifié");
        }

        const userData = await authService.getCurrentUser();

        if (!userData.success) {
          throw new Error("Session expirée");
        }

        if (requiredRole && !userData.user.roles.includes(requiredRole)) {
          throw new Error("Accès non autorisé");
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Auth error:", error);
        setError(error.message);
        setIsLoading(false);

        // Redirection différée pour éviter les problèmes de rendu
        setTimeout(() => {
          router.push("/login");
        }, 100);
      }
    };

    checkAuth();
  }, [router, requiredRole]);

  if (isLoading) {
    return (
      <div className={styles.protected__loading}>
        Vérification de l'authentification...
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.protected__error}>
        <div className={styles["protected__error-title"]}>Accès refusé</div>
        <div className={styles["protected__error-message"]}>{error}</div>
      </div>
    );
  }

  return <>{children}</>;
}
