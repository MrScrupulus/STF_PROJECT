"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "../../services/authService";
import styles from "../../styles/pages/account/edit.module.scss";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import Modal from "../../components/ui/Modal";

export default function EditAccountPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone_number: "",
    birth_date: "",
    country: "",
    subscriber_number: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await authService.getCurrentUser();
        if (response.success) {
          setFormData({
            firstName: response.user.firstname || "",
            lastName: response.user.lastname || "",
            email: response.user.email || "",
            phone_number: response.user.phone_number || "",
            birth_date: response.user.birth_date || "",
            country: response.user.country || "",
            subscriber_number: response.user.subscriber_number || "",
          });
        }
      } catch (error) {
        setError("Erreur lors du chargement des données");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const confirmUpdate = async () => {
    try {
      await authService.updateProfile(formData);
      setShowConfirmModal(false);
      setShowSuccessMessage(true);
      setTimeout(() => {
        router.push('/account');
      }, 2000);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <ProtectedRoute>
      <div className={styles.edit__container}>
        {showSuccessMessage && (
          <div className={styles.success_message}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Profil mis à jour avec succès !
          </div>
        )}
        <h1 className={styles.edit__title}>Modifier mon profil</h1>
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} className={styles.edit__form}>
          <div className={styles.edit__group}>
            <label className={styles.edit__label}>Prénom</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              className={styles.edit__input}
              required
            />
          </div>

          <div className={styles.edit__group}>
            <label className={styles.edit__label}>Nom</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              className={styles.edit__input}
              required
            />
          </div>

          <div className={styles.edit__group}>
            <label className={styles.edit__label}>Email</label>
            <input
              type="email"
              value={formData.email}
              disabled
              className={`${styles.edit__input} ${styles['edit__input--disabled']}`}
              title="L'adresse email ne peut pas être modifiée directement"
            />
            <small className={styles.edit__help}>
              Pour des raisons de sécurité, l'adresse email ne peut pas être modifiée directement.
              Contactez le support pour toute modification.
            </small>
          </div>

          <div className={styles.edit__group}>
            <label className={styles.edit__label}>Téléphone</label>
            <input
              type="tel"
              value={formData.phone_number}
              onChange={(e) =>
                setFormData({ ...formData, phone_number: e.target.value })
              }
              className={styles.edit__input}
            />
          </div>

          <div className={styles.edit__group}>
            <label className={styles.edit__label}>Date de naissance</label>
            <input
              type="date"
              value={formData.birth_date}
              onChange={(e) =>
                setFormData({ ...formData, birth_date: e.target.value })
              }
              className={styles.edit__input}
            />
          </div>

          <div className={styles.edit__group}>
            <label className={styles.edit__label}>Pays</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
              className={styles.edit__input}
            />
          </div>

          <div className={styles.edit__group}>
            <label className={styles.edit__label}>Numéro de licence</label>
            <input
              type="text"
              value={formData.subscriber_number}
              onChange={(e) =>
                setFormData({ ...formData, subscriber_number: e.target.value })
              }
              className={styles.edit__input}
            />
          </div>

          <div className={styles.edit__actions}>
            <button
              type="button"
              onClick={() => router.back()}
              className={`${styles.edit__button} ${styles["edit__button--cancel"]}`}
            >
              Annuler
            </button>
            <button
              type="submit"
              className={`${styles.edit__button} ${styles["edit__button--submit"]}`}
              disabled={isLoading}
            >
              {isLoading ? "Modification..." : "Enregistrer"}
            </button>
          </div>
        </form>

        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Confirmer les modifications"
        >
          <p>Êtes-vous sûr de vouloir enregistrer ces modifications ?</p>
          <div className={styles.modal__actions}>
            <button
              onClick={() => setShowConfirmModal(false)}
              className={styles.modal__button_cancel}
            >
              Annuler
            </button>
            <button
              onClick={confirmUpdate}
              className={styles.modal__button_confirm}
            >
              Confirmer
            </button>
          </div>
        </Modal>
      </div>
    </ProtectedRoute>
  );
} 