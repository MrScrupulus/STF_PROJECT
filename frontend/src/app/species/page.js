"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { speciesService } from "@/services/speciesService";
import styles from "@/styles/pages/species.module.scss";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function SpeciesPage() {
  const router = useRouter();
  const [species, setSpecies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSpecies = async () => {
      try {
        const response = await speciesService.getAll();
        setSpecies(response || []);
      } catch (error) {
        setError(
          error.message ||
            "Une erreur est survenue lors du chargement des espèces"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpecies();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette espèce ?")) {
      try {
        await speciesService.delete(id);
        setSpecies(species.filter((s) => s.id !== id));
      } catch (error) {
        setError("Erreur lors de la suppression de l'espèce");
      }
    }
  };

  if (isLoading) return <div className={styles.loading}>Chargement...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <ProtectedRoute>
      <div className={styles.species__container}>
        <div className={styles.species__header}>
          <h1 className={styles.species__title}>Espèces</h1>
        </div>

        <div className={styles.species__grid}>
          {species.map((specie) => (
            <div key={specie.id} className={styles.species__card}>
              <div className={styles.species__card_header}>
                <h2 className={styles.species__name}>{specie.name}</h2>
              </div>

              <div className={styles.species__card_content}>
                <div className={styles.species__info}>
                  <div className={styles.species__field}>
                    <div className={styles["species__field-label"]}>Type</div>
                    <div className={styles["species__field-value"]}>
                      <span
                        className={`${styles.species__badge} ${
                          specie.isBonus
                            ? styles["species__badge--bonus"]
                            : styles["species__badge--regular"]
                        }`}
                      >
                        {specie.isBonus ? "Bonus" : "Standard"}
                      </span>
                    </div>
                  </div>

                  <div className={styles.species__field}>
                    <div className={styles["species__field-label"]}>
                      {specie.isBonus ? "Points bonus" : "Coefficient"}
                    </div>
                    <div className={styles["species__field-value"]}>
                      {specie.isBonus
                        ? `${specie.basePoints} points`
                        : `×${specie.coefficient}`}
                    </div>
                  </div>
                </div>

                <div className={styles.species__actions}>
                  <button
                    onClick={() => router.push(`/species/${specie.id}/edit`)}
                    className={`${styles.species__button} ${styles["species__button--edit"]}`}
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(specie.id)}
                    className={`${styles.species__button} ${styles["species__button--delete"]}`}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
