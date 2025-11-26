"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { speciesService } from "../../services/speciesService";
import styles from "../../styles/pages/species.module.scss";
import ProtectedRoute from "../../components/auth/ProtectedRoute";

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
        <h1>Espèces</h1>

        <div className={styles.species__grid}>
          {species?.map((specie) => (
            <div key={specie.id} className={styles.species__card}>
              <h3>{specie.name}</h3>

              <div className={styles.points_info}>
                <span className={styles.base_points}>
                  {specie.coefficient} points
                </span>
                {specie.isBonus && (
                  <span className={styles.bonus_points}>Points bonus</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
