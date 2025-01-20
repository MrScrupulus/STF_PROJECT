"use client";
import { useState, useEffect } from "react";
import { authService } from "@/services/authService";
import { userService } from "@/services/userService";
import { useRouter } from "next/navigation";
import styles from "@/styles/pages/profile.module.scss";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    phoneNumber: "",
    country: "",
    subscriberNumber: "",
    birthdate: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordFieldFocused, setPasswordFieldFocused] = useState(false);
  const [success, setSuccess] = useState({
    profile: "",
    password: "",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
        setFormData({
          firstname: userData.firstname || "",
          lastname: userData.lastname || "",
          phoneNumber: userData.phoneNumber || "",
          country: userData.country || "",
          subscriberNumber: userData.subscriberNumber || "",
          birthdate: userData.birthdate || "",
        });
      } catch (error) {
        console.error("Error fetching user:", error);
        router.push("/login");
      }
    };

    fetchUser();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess({ profile: "", password: "" });

    try {
      let hasProfileChanges = false;
      // Vérifier si les informations du profil ont changé
      for (const key in formData) {
        if (formData[key] !== user[key]) {
          hasProfileChanges = true;
          break;
        }
      }

      if (hasProfileChanges) {
        // Mise à jour du profil
        const updatedUser = await userService.updateProfile(formData);
        setUser(updatedUser);
        setSuccess((prev) => ({
          ...prev,
          profile: "Informations mises à jour avec succès",
        }));
      }

      // Si un nouveau mot de passe est saisi, on le met à jour
      if (passwordData.newPassword && passwordData.currentPassword) {
        await userService.updatePassword(
          passwordData.currentPassword,
          passwordData.newPassword
        );
        setSuccess((prev) => ({
          ...prev,
          password: hasProfileChanges
            ? "et mot de passe modifié avec succès"
            : "Mot de passe modifié avec succès",
        }));
      }

      setIsEditing(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setError(
        error.message || "Une erreur est survenue lors de la mise à jour"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await userService.updatePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      setIsEditing(false);
    } catch (error) {
      setError(
        error.message || "Erreur lors de la mise à jour du mot de passe"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Non renseignée";
    try {
      const date = new Date(dateString);
      return date
        .toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        .replace(/\//g, "-");
    } catch (error) {
      return "Non renseignée";
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await userService.deleteAccount();
      // Nettoyer le localStorage
      localStorage.removeItem("token");
      // Rediriger vers la page d'accueil
      window.location.href = "/"; // Utiliser window.location pour un refresh complet
    } catch (error) {
      setError("Erreur lors de la suppression du compte");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  if (!user) {
    return <div className="container mx-auto p-4">Chargement...</div>;
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Mon Profil</h1>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={styles.editButton}
        >
          {isEditing ? "Annuler" : "Modifier"}
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success.profile && success.password ? (
        <div className={styles.success}>
          {success.profile} {success.password}
        </div>
      ) : (
        <>
          {success.profile && (
            <div className={styles.success}>{success.profile}</div>
          )}
          {success.password && (
            <div className={styles.success}>{success.password}</div>
          )}
        </>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Prénom</label>
            <input
              type="text"
              value={formData.firstname}
              onChange={(e) =>
                setFormData({ ...formData, firstname: e.target.value })
              }
              disabled={isLoading}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Nom</label>
            <input
              type="text"
              value={formData.lastname}
              onChange={(e) =>
                setFormData({ ...formData, lastname: e.target.value })
              }
              disabled={isLoading}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Email</label>
            <input type="email" value={user.email} disabled={true} />
          </div>
          <div className={styles.formGroup}>
            <label>Téléphone</label>
            <input
              type="text"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              disabled={isLoading}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Pays</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
              disabled={isLoading}
            />
          </div>
          <div className={styles.formGroup}>
            <label>N° d'adhérent</label>
            <input
              type="text"
              value={formData.subscriberNumber}
              onChange={(e) =>
                setFormData({ ...formData, subscriberNumber: e.target.value })
              }
              disabled={isLoading}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Date de naissance</label>
            <input
              type="date"
              value={formData.birthdate}
              onChange={(e) =>
                setFormData({ ...formData, birthdate: e.target.value })
              }
              disabled={isLoading}
            />
          </div>
          <div className={styles.passwordFields}>
            <div className={styles.formGroup}>
              <label>Mot de passe actuel</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
                disabled={isLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Nouveau mot de passe</label>
              <div className={styles.passwordInput}>
                <input
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  onFocus={() => setPasswordFieldFocused(true)}
                  onBlur={() => setPasswordFieldFocused(false)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords({
                      ...showPasswords,
                      new: !showPasswords.new,
                    })
                  }
                  className={styles.eyeIcon}
                >
                  {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {(passwordFieldFocused || passwordData.newPassword.length > 0) &&
                passwordData.newPassword.length < 8 && (
                  <span className={styles.passwordError}>
                    8 caractères minimum
                  </span>
                )}
            </div>

            <div className={styles.formGroup}>
              <label>Confirmer le nouveau mot de passe</label>
              <div className={styles.passwordInput}>
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords({
                      ...showPasswords,
                      confirm: !showPasswords.confirm,
                    })
                  }
                  className={styles.eyeIcon}
                >
                  {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {passwordData.confirmPassword &&
                passwordData.newPassword !== passwordData.confirmPassword && (
                  <span className={styles.passwordError}>
                    Les mots de passe ne correspondent pas
                  </span>
                )}
            </div>
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      ) : (
        <div className={styles.profileInfo}>
          <p>
            <strong>Prénom:</strong> {user.firstname}
          </p>
          <p>
            <strong>Nom:</strong> {user.lastname}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Téléphone:</strong> {user.phoneNumber}
          </p>
          <p>
            <strong>Pays:</strong> {user.country}
          </p>
          <p>
            <strong>N° d'adhérent:</strong> {user.subscriberNumber}
          </p>
          <p>
            <strong>Date de naissance:</strong> {formatDate(user.birthdate)}
          </p>
        </div>
      )}

      {isEditing && (
        <div className={styles.dangerZone}>
          <h2>Zone dangereuse</h2>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className={styles.deleteButton}
          >
            Supprimer mon compte
          </button>
        </div>
      )}

      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Confirmer la suppression</h2>
            <p>
              Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est
              irréversible.
            </p>
            <div className={styles.modalButtons}>
              <button
                onClick={() => setShowDeleteModal(false)}
                className={styles.cancelButton}
                disabled={deleteLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                className={styles.confirmDeleteButton}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Suppression..." : "Confirmer la suppression"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
