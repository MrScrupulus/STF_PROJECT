"use client";
import { useState } from "react";
import { authService } from "@/services/authService";
import styles from "@/styles/pages/auth/forgot-password.module.scss";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await authService.requestPasswordReset(email);
      setSuccess(true);
      setMessage(
        "Un email de réinitialisation a été envoyé à votre adresse. Vérifiez votre boîte de réception et vos spams."
      );
    } catch (error) {
      setError(
        "Une erreur est survenue lors de l'envoi de l'email. Veuillez réessayer."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Réinitialisation du mot de passe</h1>
      {!success ? (
        <form onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}
          <p className={styles.instructions}>
            Entrez votre adresse email pour recevoir un lien de
            réinitialisation.
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre email"
            required
            className={styles.input}
            disabled={isLoading}
          />
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? "Envoi en cours..." : "Envoyer le lien"}
          </button>
        </form>
      ) : (
        <div className={styles.success}>
          <p>{message}</p>
          <div className={styles.successIcon}>✓</div>
          <p className={styles.spamNote}>
            Pensez à vérifier vos spams si vous ne recevez pas l'email.
          </p>
          <button
            onClick={() => router.push("/login")}
            className={styles.returnButton}
          >
            Retour à la connexion
          </button>
        </div>
      )}
    </div>
  );
}
