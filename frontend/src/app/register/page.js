"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import styles from "@/styles/pages/auth/register.module.scss";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Modal from '@/components/ui/Modal';

const PHONE_REGEX = /^[0-9]{10}$/;

export default function RegisterPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone_number: "",
    birth_date: "",
    country: "",
    subscriber_number: "",
  });
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirm: false,
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleModalClose = () => {
    if (mounted) {
      setShowSuccessModal(false);
      router.push('/login');
    }
  };

  // Nettoyage du localStorage au montage du composant
  useEffect(() => {
    localStorage.removeItem("token");
  }, []);

  const validateField = (name, value) => {
    switch (name) {
      case "phone_number":
        return PHONE_REGEX.test(value)
          ? ""
          : "Le numéro doit contenir 10 chiffres";
      case "email":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Email invalide";
      case "confirmPassword":
        return value === formData.password
          ? ""
          : "Les mots de passe ne correspondent pas";
      default:
        return "";
    }
  };

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!password) {
      setPasswordStatus({
        isValid: false,
        message:
          "Minimum 8 caractères avec au moins 1 lettre, 1 chiffre et 1 caractère spécial",
      });
      return false;
    }

    const isValid = minLength && hasLetter && hasNumber && hasSpecial;
    setPasswordStatus({
      isValid,
      message: isValid
        ? "Mot de passe validé"
        : "Minimum 8 caractères avec au moins 1 lettre, 1 chiffre et 1 caractère spécial",
    });
    return isValid;
  };

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
      await authService.register(formData);
      setShowSuccessModal(true);
    } catch (error) {
      setError(
        error.message || "Une erreur est survenue lors de l'inscription"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Ajout de l'effet pour le scroll
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "password") {
      validatePassword(value);
    }

    const error = validateField(name, value);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: error,
    }));

    // Vérifier aussi confirmPassword si on modifie password
    if (name === "password") {
      const confirmError = validateField(
        "confirmPassword",
        formData.confirmPassword
      );
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: confirmError,
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone_number: "",
      birth_date: "",
      country: "",
      subscriber_number: "",
    });
    setError("");
  };

  const togglePasswordVisibility = (field) => {
    if (field === "password") {
      setShowPassword({
        ...showPassword,
        password: !showPassword.password,
      });
    } else {
      setShowPassword({
        ...showPassword,
        confirm: !showPassword.confirm,
      });
    }
  };

  return (
    <div className={styles.register__container}>
      <h1 className={styles.register__title}>Inscription</h1>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.register__form}>
        <div className={styles.register__grid}>
          <div className={styles.register__group}>
            <label className={styles.register__label}>Prénom</label>
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
            <label className={styles.register__label}>Nom</label>
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
            <label className={styles.register__label}>Email</label>
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
            <label className={styles.register__label}>Mot de passe</label>
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
              Confirmer le mot de passe
            </label>
            <div className={styles.register__password_container}>
              <input
                type={showPassword.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
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

          <div className={styles.register__group}>
            <label className={styles.register__label}>Téléphone</label>
            <input
              type="tel"
              value={formData.phone_number}
              onChange={(e) =>
                setFormData({ ...formData, phone_number: e.target.value })
              }
              className={styles.register__input}
            />
          </div>

          <div className={styles.register__group}>
            <label className={styles.register__label}>Date de naissance</label>
            <input
              type="date"
              value={formData.birth_date}
              onChange={(e) => {
                console.log("Date sélectionnée:", {
                  rawValue: e.target.value,
                  type: typeof e.target.value,
                });
                setFormData({ ...formData, birth_date: e.target.value });
              }}
              className={styles.register__input}
              required
            />
          </div>

          <div className={styles.register__group}>
            <label className={styles.register__label}>Pays</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
              className={styles.register__input}
              required
            />
          </div>

          <div className={styles.register__group}>
            <label className={styles.register__label}>Numéro d'adhérent</label>
            <input
              type="text"
              value={formData.subscriber_number}
              onChange={(e) =>
                setFormData({ ...formData, subscriber_number: e.target.value })
              }
              className={styles.register__input}
            />
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
            <p>Pour finaliser votre inscription, veuillez vérifier votre boîte mail (y compris les spams) et cliquer sur le lien de confirmation qui vous a été envoyé.</p>
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
  );
}
