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
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

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

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setError("Le nouveau mot de passe doit être différent de l'ancien");
      return;
    }

    setIsUpdatingPassword(true);
    setError("");
    try {
      await authService.updatePassword(passwordData.currentPassword, passwordData.newPassword);
      setShowSuccessMessage(true);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordSection(false);
      setTimeout(() => {
        router.push('/account');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || error.message || "Erreur lors de la modification du mot de passe");
    } finally {
      setIsUpdatingPassword(false);
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

        <div className={styles.edit__password_section}>
          <h2 className={styles.edit__password_title}>Modifier le mot de passe</h2>
          {!showPasswordSection ? (
            <button
              type="button"
              onClick={() => setShowPasswordSection(true)}
              className={styles.edit__password_toggle}
            >
              Modifier le mot de passe
            </button>
          ) : (
            <form onSubmit={handlePasswordUpdate} className={styles.edit__password_form}>
              <div className={styles.edit__group}>
                <label className={styles.edit__label}>Mot de passe actuel *</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                  className={styles.edit__input}
                  required
                />
              </div>

              <div className={styles.edit__group}>
                <label className={styles.edit__label}>Nouveau mot de passe *</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  className={styles.edit__input}
                  required
                  minLength={8}
                />
                <small className={styles.edit__help}>
                  Le mot de passe doit contenir au moins 8 caractères, une lettre, un chiffre et un caractère spécial
                </small>
              </div>

              <div className={styles.edit__group}>
                <label className={styles.edit__label}>Confirmer le nouveau mot de passe *</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  className={styles.edit__input}
                  required
                />
              </div>

              <div className={styles.edit__actions}>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordSection(false);
                    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                    setError("");
                  }}
                  className={`${styles.edit__button} ${styles["edit__button--cancel"]}`}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={`${styles.edit__button} ${styles["edit__button--submit"]}`}
                  disabled={isUpdatingPassword}
                >
                  {isUpdatingPassword ? "Modification..." : "Modifier le mot de passe"}
                </button>
              </div>
            </form>
          )}
        </div>

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