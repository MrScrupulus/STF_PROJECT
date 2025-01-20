"use client";
import { useEffect, useState } from "react";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";
import styles from "@/styles/pages/profile.module.scss";

export default function Profile() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error("Error fetching user data:", error);
        router.push("/login");
      }
    };

    fetchUserData();
  }, [router]);

  const formatDate = (dateString) => {
    if (!dateString) return "Non renseignée";
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Non renseignée";
    }
  };

  if (!user) {
    return <div className="container mx-auto p-4">Chargement...</div>;
  }

  return (
    <div className={styles.profileContainer}>
      <h1 className={styles.title}>Mon Profil</h1>
      <div className={styles.card}>
        <div className={styles.gridLayout}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Informations personnelles</h2>
            <div className={styles.fieldList}>
              <div className={styles.field}>
                <label className={styles.label}>Prénom</label>
                <p className={styles.value}>
                  {user.firstname || "Non renseigné"}
                </p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Nom</label>
                <p className={styles.value}>
                  {user.lastname || "Non renseigné"}
                </p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <p className={styles.value}>{user.email}</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Date de naissance</label>
                <p className={styles.value}>{formatDate(user.birthdate)}</p>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Informations d'adhérent</h2>
            <div className={styles.fieldList}>
              <div className={styles.field}>
                <label className={styles.label}>Numéro d'adhérent</label>
                <p className={styles.value}>
                  {user.subscriberNumber || "Non renseigné"}
                </p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Pays</label>
                <p className={styles.value}>
                  {user.country || "Non renseigné"}
                </p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Téléphone</label>
                <p className={styles.value}>
                  {user.phoneNumber || "Non renseigné"}
                </p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Statut du compte</label>
                <p className={styles.value}>
                  {user.isVerified ? (
                    <span className={styles.verified}>Vérifié ✓</span>
                  ) : (
                    <span className={styles.notVerified}>Non vérifié</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
