"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "../../services/authService";
import styles from "../../styles/pages/auth/register.module.scss";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Modal from "../../components/ui/Modal";
import classNames from "classnames";
import layoutStyles from "../../styles/components/layout/layout.module.scss";

export default function RegisterPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone_number: "",
  });
  const [phoneCountryCode, setPhoneCountryCode] = useState("+33");
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirm: false,
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const COUNTRY_CODES = [
    { code: "+33", label: "FR" },
    { code: "+32", label: "BE" },
    { code: "+41", label: "CH" },
    { code: "+49", label: "DE" },
    { code: "+39", label: "IT" },
    { code: "+34", label: "ES" },
    { code: "+44", label: "UK" },
    { code: "+212", label: "MA" },
    { code: "+213", label: "DZ" },
    { code: "+216", label: "TN" },
  ];

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleModalClose = () => {
    if (mounted) {
      setShowSuccessModal(false);
      router.push("/login");
    }
  };

  useEffect(() => {
    localStorage.removeItem("token");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    try {
      const dataToSend = {
        username: formData.username.trim(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      };
      if (formData.phone_number.trim()) {
        dataToSend.phone_number = phoneCountryCode + formData.phone_number.replace(/\D/g, "");
      }
      await authService.register(dataToSend);
      setShowSuccessModal(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Une erreur est survenue lors de l'inscription"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <div className={classNames(layoutStyles.main, layoutStyles.form_page)}>
      <div className={styles.register__container}>
        <h1 className={styles.register__title}>Inscription</h1>

        {error && <div className={styles.error}>{error}</div>}

        <form
          role="form"
          aria-label="Formulaire d'inscription"
          onSubmit={handleSubmit}
          className={styles.register__form}
        >
          <div className={styles.register__grid}>
            <div className={styles.register__group}>
              <label className={styles.register__label}>Pseudo *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className={styles.register__input}
                placeholder="3-30 caractères (lettres, chiffres, - _)"
                required
              />
            </div>

            <div className={styles.register__group}>
              <label className={styles.register__label}>Prénom *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className={styles.register__input}
                required
              />
            </div>

            <div className={styles.register__group}>
              <label className={styles.register__label}>Nom *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className={styles.register__input}
                required
              />
            </div>

            <div
              className={`${styles.register__group} ${styles["register__group--full"]}`}
            >
              <label className={styles.register__label}>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={styles.register__input}
                required
              />
            </div>

            <div
              className={`${styles.register__group} ${styles["register__group--password"]}`}
            >
              <label className={styles.register__label}>Mot de passe *</label>
              <div className={styles.register__password_container}>
                <input
                  type={showPassword.password ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className={styles.register__input}
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("password")}
                  className={styles.register__eye_button}
                >
                  {showPassword.password ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className={styles.register__group}>
              <label className={styles.register__label}>
                Confirmer le mot de passe *
              </label>
              <div className={styles.register__password_container}>
                <input
                  type={showPassword.confirm ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className={styles.register__input}
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirm")}
                  className={styles.register__eye_button}
                >
                  {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div
              className={`${styles.register__group} ${styles["register__group--full"]}`}
            >
              <label className={styles.register__label}>
                Téléphone (optionnel)
              </label>
              <div className={styles.register__phone_row}>
                <select
                  value={phoneCountryCode}
                  onChange={(e) => setPhoneCountryCode(e.target.value)}
                  className={styles.register__country_select}
                >
                  {COUNTRY_CODES.map(({ code, label }) => (
                    <option key={code} value={code}>
                      {code} {label}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_number: e.target.value })
                  }
                  className={styles.register__input}
                  placeholder="6 12 34 56 78"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className={styles.register__submit}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className={styles.register__spinner}>
                <div className={styles.register__spinner_dot}></div>
                <div className={styles.register__spinner_dot}></div>
                <div className={styles.register__spinner_dot}></div>
              </div>
            ) : (
              "S'inscrire"
            )}
          </button>
        </form>

        {mounted && (
          <Modal
            isOpen={showSuccessModal}
            onClose={handleModalClose}
            title="Inscription réussie !"
          >
            <div className={styles.success_modal}>
              <p>Votre inscription a bien été enregistrée !</p>
              <p>
                Pour finaliser votre inscription, veuillez vérifier votre boîte
                mail (y compris les spams) et cliquer sur le lien de
                confirmation qui vous a été envoyé.
              </p>
              <button
                onClick={handleModalClose}
                className={styles.success_modal__button}
              >
                Compris
              </button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
