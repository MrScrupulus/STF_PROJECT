"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "../../services/authService";
import styles from "@/styles/pages/login.module.scss";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await authService.login(formData);
      console.log("Login response:", response);
    } catch (error) {
      setError(
        error.message === "Invalid credentials"
          ? "Email ou mot de passe incorrect"
          : "Une erreur est survenue, veuillez réessayer"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h1>Connexion</h1>
      <form onSubmit={handleSubmit}>
        {error && <div className={styles.error}>{error}</div>}
        <input
          type="email"
          className={styles.formInput}
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={isLoading}
        />
        <input
          type="password"
          className={styles.formInput}
          placeholder="Mot de passe"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          disabled={isLoading}
        />
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className={styles.spinner}>
              <div className={styles.spinnerDot}></div>
              <div className={styles.spinnerDot}></div>
              <div className={styles.spinnerDot}></div>
            </div>
          ) : (
            "Se connecter"
          )}
        </button>
      </form>
    </div>
  );
}
