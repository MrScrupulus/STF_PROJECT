"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "../../services/authService";
import styles from "../../styles/pages/auth/login.module.scss";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Link from "next/link";
import classNames from "classnames";
import layoutStyles from "../../styles/components/layout/layout.module.scss";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await authService.login(formData);
      router.push("/dashboard");
    } catch (error) {
      let errorMessage = "Une erreur est survenue lors de la connexion";
      
      // Extraire le message d'erreur du backend
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        // Gérer les messages d'erreur standards
        if (error.message === "Invalid credentials" || error.message.includes("401")) {
          errorMessage = "Adresse email ou mot de passe incorrect";
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={classNames(layoutStyles.main, layoutStyles.form_page)}>
      <div className={styles.login__container}>
        <h1 className={styles.login__title}>Connexion</h1>

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
