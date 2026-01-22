"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { authService } from "../../../services/authService";
import ProtectedRoute from "../../../components/auth/ProtectedRoute";
import classNames from "classnames";
import layoutStyles from "../../../styles/components/layout/layout.module.scss";
import styles from "../../../styles/pages/account/change-password.module.scss";
import { toast } from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const validatePassword = (password) => {
    if (password.length < 8) {
      return { valid: false, message: "Le mot de passe doit contenir au moins 8 caractères" };
    }
    if (!/[A-Za-z]/.test(password)) {
      return { valid: false, message: "Le mot de passe doit contenir au moins une lettre" };
    }
    if (!/\d/.test(password)) {
      return { valid: false, message: "Le mot de passe doit contenir au moins un chiffre" };
    }
    if (!/[@$!%*#?&]/.test(password)) {
      return { valid: false, message: "Le mot de passe doit contenir au moins un caractère spécial (@$!%*#?&)" };
    }
    return { valid: true, message: "" };
  };

  const updatePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }) =>
      authService.updatePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success("Mot de passe modifié avec succès");
      router.push("/account");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Une erreur est survenue lors de la modification du mot de passe. Veuillez réessayer.";
      toast.error(message);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    const passwordValidation = validatePassword(formData.newPassword);
    if (!passwordValidation.valid) {
      toast.error(passwordValidation.message);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      toast.error("Le nouveau mot de passe doit être différent de l'ancien");
      return;
    }

    updatePasswordMutation.mutate({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    });
  };

  const passwordValidation = formData.newPassword ? validatePassword(formData.newPassword) : null;
  const passwordsMatch = formData.newPassword && formData.confirmPassword
    ? formData.newPassword === formData.confirmPassword
    : null;

  return (
    <ProtectedRoute>
      <div className={classNames(layoutStyles.main, styles.change_password__container)}>
        <h1 className={styles.change_password__title}>Modifier le mot de passe</h1>
        <form onSubmit={handleSubmit} className={styles.change_password__form}>
          <div className={styles.change_password__form_group}>
            <label className={styles.change_password__label}>Mot de passe actuel *</label>
            <div className={styles.change_password__password_container}>
              <input
                type={showCurrentPassword ? "text" : "password"}
                className={styles.change_password__input}
                placeholder="Mot de passe actuel"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                disabled={updatePasswordMutation.isPending}
                required
              />
              <button
                type="button"
                className={styles.change_password__eye_button}
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className={styles.change_password__form_group}>
            <label className={styles.change_password__label}>Nouveau mot de passe *</label>
            <div className={styles.change_password__password_container}>
              <input
                type={showNewPassword ? "text" : "password"}
                className={styles.change_password__input}
                placeholder="Nouveau mot de passe"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                disabled={updatePasswordMutation.isPending}
                required
              />
              <button
                type="button"
                className={styles.change_password__eye_button}
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {passwordValidation && (
              <p
                className={`${styles.change_password__validation} ${
                  passwordValidation.valid ? styles["change_password__validation--success"] : styles["change_password__validation--error"]
                }`}
              >
                {passwordValidation.message || "✓ Mot de passe valide"}
              </p>
            )}
          </div>

          <div className={styles.change_password__form_group}>
            <label className={styles.change_password__label}>Confirmer le nouveau mot de passe *</label>
            <div className={styles.change_password__password_container}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                className={styles.change_password__input}
                placeholder="Confirmer le nouveau mot de passe"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                disabled={updatePasswordMutation.isPending}
                required
              />
              <button
                type="button"
                className={styles.change_password__eye_button}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {passwordsMatch !== null && (
              <p
                className={`${styles.change_password__validation} ${
                  passwordsMatch ? styles["change_password__validation--success"] : styles["change_password__validation--error"]
                }`}
              >
                {passwordsMatch ? "✓ Les mots de passe correspondent" : "✗ Les mots de passe ne correspondent pas"}
              </p>
            )}
          </div>

          <div className={styles.change_password__actions}>
            <button
              type="button"
              onClick={() => router.back()}
              className={styles.change_password__cancel_button}
              disabled={updatePasswordMutation.isPending}
            >
              Annuler
            </button>
            <button
              type="submit"
              className={styles.change_password__submit_button}
              disabled={updatePasswordMutation.isPending}
            >
              {updatePasswordMutation.isPending ? "Modification..." : "Modifier le mot de passe"}
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
