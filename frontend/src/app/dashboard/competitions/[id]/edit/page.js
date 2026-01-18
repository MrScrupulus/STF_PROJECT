"use client";
import { useState, useEffect } from "react";
import { competitionsService } from "../../../../../services/competitions";
import { useRouter, useParams } from "next/navigation";
import ProtectedRoute from "../../../../../components/auth/ProtectedRoute";
import styles from "../../../../../styles/pages/dashboard/competition-create.module.scss";

export default function EditCompetition() {
  const router = useRouter();
  const params = useParams();
  const competitionId = params.id;
  
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    teamSize: "",
    type: "street",
    maxParticipants: "",
    hasNoLimit: false,
    description: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchCompetition = async () => {
      try {
        setIsLoadingData(true);
        const competition = await competitionsService.getOne(competitionId);
        
        // Gérer le format de réponse (avec ou sans success)
        const compData = competition.success !== undefined 
          ? (competition.success ? competition : null)
          : competition;
        
        if (!compData) {
          setError("Compétition non trouvée");
          return;
        }

        // Convertir les dates au format datetime-local
        const formatDateForInput = (dateString) => {
          if (!dateString) return "";
          const date = new Date(dateString);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const hours = String(date.getHours()).padStart(2, "0");
          const minutes = String(date.getMinutes()).padStart(2, "0");
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        setFormData({
          name: compData.name || "",
          startDate: formatDateForInput(compData.startDate),
          endDate: formatDateForInput(compData.endDate),
          teamSize: compData.teamSize?.toString() || "",
          type: compData.type || "street",
          maxParticipants: compData.maxParticipants?.toString() || "",
          hasNoLimit: compData.hasNoLimit || false,
          description: compData.description || "",
          isRankingPublic: compData.isRankingPublic || false,
        });
      } catch (error) {
        console.error("Error fetching competition:", error);
        setError("Erreur lors du chargement de la compétition");
      } finally {
        setIsLoadingData(false);
      }
    };

    if (competitionId) {
      fetchCompetition();
    }
  }, [competitionId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const dataToSend = {
        ...formData,
        teamSize: parseInt(formData.teamSize),
        maxParticipants: formData.hasNoLimit ? null : parseInt(formData.maxParticipants),
      };

      await competitionsService.update(competitionId, dataToSend);
      router.push("/dashboard");
    } catch (error) {
      setError(error.message || "Une erreur est survenue lors de la mise à jour");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <ProtectedRoute requiredRole="ROLE_ADMIN">
        <div className={styles["competition-create__container"]}>
          <div>Chargement...</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <div className={styles["competition-create__container"]}>
        <h1 className={styles["competition-create__title"]}>
          Modifier la compétition
        </h1>

        {error && <div className={styles.error}>{error}</div>}

        <form
          onSubmit={handleSubmit}
          className={styles["competition-create__form"]}
        >
          <div className={styles["competition-create__group"]}>
            <label className={styles["competition-create__label"]}>Titre</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={styles["competition-create__input"]}
              required
            />
          </div>

          <div className={styles["competition-create__grid"]}>
            <div className={styles["competition-create__group"]}>
              <label className={styles["competition-create__label"]}>
                Date de début
              </label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className={styles["competition-create__input"]}
                required
              />
            </div>

            <div className={styles["competition-create__group"]}>
              <label className={styles["competition-create__label"]}>
                Date de fin
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className={styles["competition-create__input"]}
                required
              />
            </div>
          </div>

          <div className={styles["competition-create__group"]}>
            <label className={styles["competition-create__label"]}>
              Taille des équipes
            </label>
            <input
              type="number"
              value={formData.teamSize}
              onChange={(e) =>
                setFormData({ ...formData, teamSize: e.target.value })
              }
              className={styles["competition-create__input"]}
              required
              min="1"
            />
          </div>

          <div className={styles["competition-create__group"]}>
            <label className={styles["competition-create__label"]}>Type</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className={styles["competition-create__select"]}
            >
              <option value="street">Street</option>
              <option value="boat">Boat</option>
              <option value="float">Float</option>
            </select>
          </div>

          <div className={styles["competition-create__group"]}>
            <div className={styles["competition-create__checkbox-wrapper"]}>
              <input
                type="checkbox"
                checked={formData.hasNoLimit}
                onChange={(e) =>
                  setFormData({ ...formData, hasNoLimit: e.target.checked })
                }
                id="hasNoLimit"
              />
              <label
                htmlFor="hasNoLimit"
                className={styles["competition-create__label"]}
              >
                Pas de limite de participants
              </label>
            </div>
          </div>

          {!formData.hasNoLimit && (
            <div className={styles["competition-create__group"]}>
              <label className={styles["competition-create__label"]}>
                Nombre maximum de participants
              </label>
              <input
                type="number"
                value={formData.maxParticipants}
                onChange={(e) =>
                  setFormData({ ...formData, maxParticipants: e.target.value })
                }
                className={styles["competition-create__input"]}
                min="1"
              />
            </div>
          )}

          <div className={styles["competition-create__group"]}>
            <label className={styles["competition-create__label"]}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className={`${styles["competition-create__input"]} ${styles["competition-create__description"]}`}
              rows="4"
              placeholder="Description détaillée de la compétition..."
            />
          </div>

          <div className={styles["competition-create__group"]}>
            <div className={styles["competition-create__checkbox-wrapper"]}>
              <input
                type="checkbox"
                checked={formData.isRankingPublic}
                onChange={(e) =>
                  setFormData({ ...formData, isRankingPublic: e.target.checked })
                }
                id="isRankingPublic"
              />
              <label
                htmlFor="isRankingPublic"
                className={styles["competition-create__label"]}
              >
                Rendre le classement public (visible par tous les utilisateurs)
              </label>
            </div>
            <p className={styles["competition-create__help_text"]}>
              Si coché, le classement sera visible par tous les utilisateurs une fois la compétition terminée.
              Sinon, seul l'administrateur pourra voir le classement complet.
            </p>
          </div>

          <div className={styles["competition-create__actions"]}>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className={`${styles["competition-create__button"]} ${styles["competition-create__button--cancel"]}`}
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className={`${styles["competition-create__button"]} ${styles["competition-create__button--submit"]}`}
              disabled={isLoading}
            >
              {isLoading ? "Mise à jour..." : "Enregistrer les modifications"}
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
