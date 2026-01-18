"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { teamService } from "../../../services/teamService";
import styles from "../../../styles/pages/teams/create.module.scss";
import classNames from "classnames";
import layoutStyles from "../../../styles/components/layout/layout.module.scss";
import ProtectedRoute from "../../../components/auth/ProtectedRoute";

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
  const [hasExistingTeam, setHasExistingTeam] = useState(false);
  const [existingTeam, setExistingTeam] = useState(null);
  const [inactiveTeams, setInactiveTeams] = useState([]);
  const [checkingTeam, setCheckingTeam] = useState(true);

  useEffect(() => {
    const checkExistingTeam = async () => {
      try {
        const response = await teamService.getMyTeams();
        const teams = response?.teams || [];
        const activeTeams = teams.filter(t => t.isActive !== false);
        if (activeTeams.length > 0) {
          setHasExistingTeam(true);
          setExistingTeam(activeTeams[0]);
        }
        
        // Récupérer aussi les équipes inactives
        const historyResponse = await teamService.getMyHistory();
        const allTeams = historyResponse?.teams || [];
        const inactive = allTeams.filter(t => t.isActive === false);
        setInactiveTeams(inactive);
      } catch (error) {
        console.error("Error checking existing team:", error);
      } finally {
        setCheckingTeam(false);
      }
    };

    checkExistingTeam();
  }, []);

  const handleReactivate = async (teamId) => {
    if (!confirm("Voulez-vous réactiver cette équipe ? Le score sera réinitialisé à zéro pour la nouvelle compétition.")) {
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await teamService.reactivate(teamId);
      setSuccess("Équipe réactivée avec succès ! Redirection...");
      setIsRedirecting(true);
      setTimeout(() => {
        router.push("/teams");
      }, 2000);
    } catch (error) {
      setError(error.message || "Erreur lors de la réactivation de l'équipe");
    } finally {
      setIsLoading(false);
    }
  };

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
      setError(
        error.message ||
          "Une erreur est survenue lors de la création de l'équipe"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingTeam) {
    return (
      <div className={classNames(layoutStyles.main, layoutStyles.teams_create_page)}>
        <div className={styles.container}>
          <div>Vérification...</div>
        </div>
      </div>
    );
  }

  if (hasExistingTeam) {
    return (
      <ProtectedRoute>
        <div className={classNames(layoutStyles.main, layoutStyles.teams_create_page)}>
          <div className={styles.container}>
            <h1>Vous avez déjà une équipe</h1>
            <div className={styles.errorAlert} role="alert">
              <p>
                Vous êtes déjà membre de l'équipe <strong>{existingTeam.name}</strong>.
              </p>
              <p>
                Pour créer ou rejoindre une nouvelle équipe, vous devez d'abord quitter votre équipe actuelle.
              </p>
            </div>
            <div className={styles.buttonGroup}>
              <button
                onClick={() => router.push("/teams")}
                className={styles.cancelButton}
              >
                Retour à mon équipe
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div
        className={classNames(layoutStyles.main, layoutStyles.teams_create_page)}
      >
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

        {/* Proposer de réactiver une équipe inactive */}
        {inactiveTeams.length > 0 && (
          <div className={styles.reactivateSection}>
            <h2>Ou réactiver une équipe existante</h2>
            <p className={styles.reactivateDescription}>
              Vous avez {inactiveTeams.length} équipe{inactiveTeams.length > 1 ? 's' : ''} dissoute{inactiveTeams.length > 1 ? 's' : ''}. 
              Vous pouvez la réactiver pour éviter de créer une nouvelle équipe.
            </p>
            <div className={styles.inactiveTeamsList}>
              {inactiveTeams.map((team) => (
                <div key={team.id} className={styles.inactiveTeamCard}>
                  <div className={styles.inactiveTeamInfo}>
                    <h3>{team.name}</h3>
                    <p className={styles.inactiveTeamMembers}>
                      Membres : {team.members?.map(m => m.firstname).join(', ') || 'Aucun'}
                    </p>
                    <p className={styles.inactiveTeamScore}>
                      Score historique : {team.totalScore || 0} pts
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleReactivate(team.id)}
                    className={styles.reactivateButton}
                    disabled={isLoading || isRedirecting}
                  >
                    Réactiver cette équipe
                  </button>
                </div>
              ))}
            </div>
            <div className={styles.divider}>
              <span>OU</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Nom de l'équipe</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              disabled={isLoading || isRedirecting}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="participant2Email">
              Email du second participant <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>(optionnel)</span>
            </label>
            <input
              type="email"
              id="participant2Email"
              value={formData.participant2Email}
              onChange={(e) =>
                setFormData({ ...formData, participant2Email: e.target.value })
              }
              disabled={isLoading || isRedirecting}
              placeholder="Vous pourrez inviter un membre plus tard"
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
              {isLoading
                ? "Création..."
                : isRedirecting
                ? "Redirection..."
                : "Créer l'équipe"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ProtectedRoute>
  );
}
