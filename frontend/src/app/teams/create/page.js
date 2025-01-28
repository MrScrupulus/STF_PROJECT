"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { teamService } from "@/services/teamService";
import styles from "@/styles/pages/teams/create.module.scss";

export default function CreateTeam() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    participant2Email: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await teamService.create(formData);
      setSuccess("Équipe créée avec succès ! Redirection...");
      setIsRedirecting(true);
      
      // Attendre 2 secondes avant la redirection pour montrer le message de succès
      setTimeout(() => {
        router.push("/teams");
      }, 2000);
    } catch (error) {
      setError(error.message || "Une erreur est survenue lors de la création de l'équipe");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Créer une équipe</h1>
      
      {error && (
        <div className={styles.errorAlert} role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className={styles.successAlert} role="alert">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="name">Nom de l'équipe</label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={isLoading || isRedirecting}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="participant2Email">Email du second participant</label>
          <input
            type="email"
            id="participant2Email"
            value={formData.participant2Email}
            onChange={(e) =>
              setFormData({ ...formData, participant2Email: e.target.value })
            }
            required
            disabled={isLoading || isRedirecting}
          />
        </div>

        <div className={styles.buttonGroup}>
          <button 
            type="button" 
            onClick={() => router.back()} 
            className={styles.cancelButton}
            disabled={isLoading || isRedirecting}
          >
            Annuler
          </button>
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading || isRedirecting}
          >
            {isLoading ? "Création..." : isRedirecting ? "Redirection..." : "Créer l'équipe"}
          </button>
        </div>
      </form>
    </div>
  );
}
