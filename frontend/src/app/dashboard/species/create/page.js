"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { speciesService } from "@/services/speciesService";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import styles from "@/styles/pages/dashboard/species-create.module.scss";

export default function CreateSpecies() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    coefficient: "",
    basePoints: "",
    isBonus: false,
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const dataToSend = {
        name: formData.name,
        basePoints: parseInt(formData.basePoints) || 50,
        coefficient: formData.isBonus ? 1 : parseFloat(formData.coefficient),
      };

      await speciesService.create(dataToSend);
      router.push("/dashboard");
    } catch (error) {
      setError(error.message || "Une erreur est survenue lors de la création");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <div className={styles["species-create__container"]}>
        <h1 className={styles["species-create__title"]}>Ajouter une espèce</h1>

        {error && <div className={styles.error}>{error}</div>}

        <form
          onSubmit={handleSubmit}
          className={styles["species-create__form"]}
        >
          <div className={styles["species-create__group"]}>
            <label className={styles["species-create__label"]}>
              Nom de l'espèce
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={styles["species-create__input"]}
              required
            />
          </div>

          <div className={styles["species-create__checkbox-wrapper"]}>
            <input
              type="checkbox"
              checked={formData.isBonus}
              onChange={(e) =>
                setFormData({ ...formData, isBonus: e.target.checked })
              }
              id="isBonus"
            />
            <label
              htmlFor="isBonus"
              className={styles["species-create__label"]}
            >
              Espèce bonus
            </label>
          </div>

          {!formData.isBonus ? (
            <div className={styles["species-create__group"]}>
              <label className={styles["species-create__label"]}>
                Coefficient
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.coefficient}
                onChange={(e) =>
                  setFormData({ ...formData, coefficient: e.target.value })
                }
                className={styles["species-create__input"]}
                required
              />
              <p className={styles["species-create__hint"]}>
                Ce coefficient sera multiplié par la taille du poisson
              </p>
            </div>
          ) : (
            <div className={styles["species-create__group"]}>
              <label className={styles["species-create__label"]}>
                Points bonus
              </label>
              <input
                type="number"
                value={formData.basePoints}
                onChange={(e) =>
                  setFormData({ ...formData, basePoints: e.target.value })
                }
                className={styles["species-create__input"]}
                required
              />
            </div>
          )}

          <div className={styles["species-create__actions"]}>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className={`${styles["species-create__button"]} ${styles["species-create__button--cancel"]}`}
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className={`${styles["species-create__button"]} ${styles["species-create__button--submit"]}`}
              disabled={isLoading}
            >
              {isLoading ? "Création..." : "Ajouter l'espèce"}
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
