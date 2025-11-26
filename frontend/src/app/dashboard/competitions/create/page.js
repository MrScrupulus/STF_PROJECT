"use client";
import { useState } from "react";
import { competitionService } from "../../services/competitionService";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import styles from "../../styles/pages/dashboard/competition-create.module.scss";

export default function CreateCompetition() {
  const router = useRouter();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log("Sending data:", formData);
      await competitionService.create(formData);
      router.push("/dashboard");
    } catch (error) {
      setError(error.message || "Une erreur est survenue lors de la création");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <div className={styles["competition-create__container"]}>
        <h1 className={styles["competition-create__title"]}>
          Créer une compétition
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
              {isLoading ? "Création..." : "Créer la compétition"}
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
