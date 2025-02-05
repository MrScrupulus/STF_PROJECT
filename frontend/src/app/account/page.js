"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import styles from "@/styles/pages/account/index.module.scss";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Modal from "@/components/ui/Modal";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await authService.getCurrentUser();
        if (response.success) {
          setUser(response.user);
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []); // Dépendances vides pour n'exécuter qu'une seule fois

  const handleDeleteAccount = async () => {
    try {
      await authService.deleteAccount();
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;
  if (!user) return <div>Utilisateur non trouvé</div>;

  return (
    <ProtectedRoute>
      <div className={styles.account__container}>
        <h1 className={styles.account__title}>Mon Profil</h1>
        <div className={styles.account__content}>
          <div className={styles.account__info}>
            <p>
              <strong>Nom:</strong> {user.lastname}
            </p>
            <p>
              <strong>Prénom:</strong> {user.firstname}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Téléphone:</strong> {user.phone_number || "Non renseigné"}
            </p>
            <p>
              <strong>Date de naissance:</strong>{" "}
              {user.birth_date || "Non renseigné"}
            </p>
            <p>
              <strong>Pays:</strong> {user.country || "Non renseigné"}
            </p>
            <p>
              <strong>Numéro de licence:</strong>{" "}
              {user.subscriber_number || "Non renseigné"}
            </p>
          </div>
          <button
            onClick={() => router.push("/account/edit")}
            className={styles.account__edit_button}
          >
            Modifier mon profil
          </button>
        </div>
        <div className={styles.account__danger_zone}>
          <h2>Zone dangereuse</h2>
          <p>
            La suppression de votre compte est irréversible. Toutes vos données
            seront définitivement effacées.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className={styles.account__danger_zone_button}
          >
            Supprimer mon compte
          </button>
        </div>
      </div>
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmer la suppression"
      >
        <p>
          Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est
          irréversible.
        </p>
        <div className={styles.modal__actions}>
          <button
            onClick={() => setShowDeleteModal(false)}
            className={styles.modal__button_cancel}
          >
            Annuler
          </button>
          <button
            onClick={handleDeleteAccount}
            className={styles.modal__button_confirm}
          >
            Confirmer la suppression
          </button>
        </div>
      </Modal>
    </ProtectedRoute>
  );
}
