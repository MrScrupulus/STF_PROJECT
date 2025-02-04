"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import styles from "@/styles/pages/account.module.scss";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function AccountPage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await authService.getCurrentUser();
        if (response.success) {
          setUserData(response.user);
        } else {
          setError("Impossible de récupérer les informations du compte");
        }
      } catch (error) {
        setError(error.message || "Une erreur est survenue");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (isLoading) return <div className={styles.loading}>Chargement...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!userData) return null;

  return (
    <ProtectedRoute>
      <div className={styles.account__container}>
        <h1 className={styles.account__title}>Mon Compte</h1>

        <div className={styles.account__card}>
          <section className={styles.account__section}>
            <h2 className={styles.account__section_title}>
              Informations personnelles
            </h2>
            <div className={styles.account__grid}>
              <div className={styles.account__field}>
                <span className={styles.account__label}>Prénom</span>
                <div className={styles.account__value}>
                  {userData.firstname}
                </div>
              </div>
              <div className={styles.account__field}>
                <span className={styles.account__label}>Nom</span>
                <div className={styles.account__value}>{userData.lastname}</div>
              </div>
              <div className={styles.account__field}>
                <span className={styles.account__label}>Email</span>
                <div className={styles.account__value}>{userData.email}</div>
              </div>
              <div className={styles.account__field}>
                <span className={styles.account__label}>Téléphone</span>
                <div className={styles.account__value}>
                  {userData.phone_number || "Non renseigné"}
                </div>
              </div>
              <div className={styles.account__field}>
                <span className={styles.account__label}>Pays</span>
                <div className={styles.account__value}>
                  {userData.country || "Non renseigné"}
                </div>
              </div>
              <div className={styles.account__field}>
                <span className={styles.account__label}>Date de naissance</span>
                <div className={styles.account__value}>
                  {userData.birth_date
                    ? new Date(userData.birth_date).toLocaleDateString()
                    : "Non renseigné"}
                </div>
              </div>
              <div className={styles.account__field}>
                <span className={styles.account__label}>N° Adhérent</span>
                <div className={styles.account__value}>
                  {userData.subscriber_number || "Non renseigné"}
                </div>
              </div>
            </div>
          </section>

          <section className={styles.account__section}>
            <h2 className={styles.account__section_title}>Statistiques</h2>
            <div className={styles.account__stats}>
              <div className={styles.account__stat}>
                <div className={styles.account__stat_value}>
                  {userData.competitions?.length || 0}
                </div>
                <div className={styles.account__stat_label}>Compétitions</div>
              </div>
              <div className={styles.account__stat}>
                <div className={styles.account__stat_value}>
                  {userData.catches?.length || 0}
                </div>
                <div className={styles.account__stat_label}>Prises</div>
              </div>
              <div className={styles.account__stat}>
                <div className={styles.account__stat_value}>
                  {userData.teams?.length || 0}
                </div>
                <div className={styles.account__stat_label}>Équipes</div>
              </div>
            </div>
          </section>

          <div className={styles.account__actions}>
            <button
              onClick={() => router.push("/account/edit")}
              className={`${styles.account__button} ${styles["account__button--edit"]}`}
            >
              Modifier le profil
            </button>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "Êtes-vous sûr de vouloir supprimer votre compte ?"
                  )
                ) {
                  // TODO: Implémenter la suppression du compte
                }
              }}
              className={`${styles.account__button} ${styles["account__button--delete"]}`}
            >
              Supprimer le compte
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
