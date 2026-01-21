"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "../../../services/authService";
import styles from "../../../styles/pages/reset-password.module.scss";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function ResetPasswordPage({ params }) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Accès direct au token depuis l'URL
    const pathToken = window.location.pathname.split('/').pop();
    if (pathToken) {
      setToken(pathToken);
    }
  }, []);

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!minLength)
      return "Le mot de passe doit contenir au moins 8 caractères";
    if (!hasLetter) return "Le mot de passe doit contenir au moins une lettre";
    if (!hasNumber) return "Le mot de passe doit contenir au moins un chiffre";
    if (!hasSpecial)
      return "Le mot de passe doit contenir au moins un caractère spécial";

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await authService.resetPassword(token, formData.password);
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error) {
      setError(
        error.message || "Une erreur est survenue lors de la réinitialisation"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.resetPassword}>
      <h1>Réinitialisation du mot de passe</h1>
      {!success ? (
        <form className={styles.resetPassword__form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.resetPassword__group}>
            <label>Nouveau mot de passe</label>
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Nouveau mot de passe"
              required
              className={styles.input}
              disabled={isLoading}
            />
            <small className={styles.resetPassword__helper}>
              Minimum 8 caractères avec au moins 1 lettre, 1 chiffre et 1
              caractère spécial
            </small>
          </div>
          <div className={styles.resetPassword__group}>
            <label>Confirmer le mot de passe</label>
            <input
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              placeholder="Confirmer le mot de passe"
              required
              className={styles.input}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className={styles.resetPassword__button}
            disabled={isLoading}
          >
            {isLoading
              ? "Réinitialisation..."
              : "Réinitialiser le mot de passe"}
          </button>
        </form>
      ) : (
        <div className={styles.success}>
          <p>Votre mot de passe a été réinitialisé avec succès.</p>
          <p>Vous allez être redirigé vers la page de connexion...</p>
        </div>
      )}
    </div>
  );
}
