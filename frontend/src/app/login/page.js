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
    setIsLoading(true);
    setError("");

    try {
      const response = await authService.login(formData);
      router.push("/dashboard");
    } catch (error) {
      if (error.message === "Invalid credentials") {
        setError("Adresse email ou mot de passe incorrect");
      } else {
        setError("Une erreur est survenue lors de la connexion");
      }
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
