"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "../../services/authService";
import styles from "../../styles/pages/auth/login.module.scss";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Link from "next/link";
import classNames from "classnames";
import layoutStyles from "../../styles/components/layout/layout.module.scss";

function LoginContent() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pré-remplir l'email depuis les query params (après vérification d'email)
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setFormData(prev => ({ ...prev, email: decodeURIComponent(emailParam) }));
      // Nettoyer l'URL en enlevant le paramètre email pour éviter qu'il reste pré-rempli
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('email');
      const newQuery = newSearchParams.toString();
      router.replace(newQuery ? `/login?${newQuery}` : '/login', { scroll: false });
    }
  }, [searchParams, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await authService.login(formData);
      router.push("/dashboard");
    } catch (error) {
      let errorMessage = "Une erreur est survenue lors de la connexion. Veuillez réessayer.";
      
      // Extraire le message d'erreur du backend (priorité au message du backend)
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        // Gérer les messages d'erreur standards
        if (error.message === "Invalid credentials" || error.message.includes("401")) {
          errorMessage = "Adresse email ou mot de passe incorrect";
        } else if (error.message.includes("Network") || error.message.includes("fetch")) {
          errorMessage = "Problème de connexion. Vérifiez votre connexion internet et réessayez.";
        } else {
          // Ne pas exposer les messages techniques
          errorMessage = "Une erreur est survenue lors de la connexion. Veuillez réessayer.";
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={classNames(layoutStyles.main, layoutStyles.form_page)}>
      {/* Header avec bouton maison */}
      <div className={styles.login__header}>
        <Link href="/" className={styles.login__homeButton} aria-label="Retour à l'accueil">
          <span className={styles.login__homeIcon}>🏠</span>
        </Link>
        <h1 className={styles.login__headerTitle}>Connexion</h1>
        <div className={styles.login__headerPlaceholder}></div>
      </div>

      <div className={styles.login__container}>
        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.login__form}>
          <div className={styles.login__group}>
            <input
              type="email"
              className={styles.login__input}
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          <div className={styles.login__group}>
            <div className={styles.login__password_container}>
              <input
                type={showPassword ? "text" : "password"}
                className={styles.login__input}
                placeholder="Mot de passe"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                disabled={isLoading}
                aria-label="Mot de passe"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.login__eye_button}
                aria-label={
                  showPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className={styles.login__group}>
            <Link
              href="/forgot-password"
              className={styles.login__forgot_password}
            >
              Mot de passe oublié ?
            </Link>
          </div>

          <button
            type="submit"
            className={styles.login__submit}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className={styles.login__spinner}>
                <div className={styles.login__spinner_dot}></div>
                <div className={styles.login__spinner_dot}></div>
                <div className={styles.login__spinner_dot}></div>
              </div>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className={classNames(layoutStyles.main, layoutStyles.form_page)}>
        <div className={styles.login__container}>
          <p>Chargement...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
