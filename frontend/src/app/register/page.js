"use client";

import { createElement } from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "../../services/authService";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const PHONE_REGEX = /^[0-9]{10}$/;

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    birthDate: "",
    country: "",
    subscriber_number: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Nettoyage du localStorage au montage du composant
  useEffect(() => {
    localStorage.removeItem("token");
  }, []);

  const validateField = (name, value) => {
    switch (name) {
      case "phoneNumber":
        return PHONE_REGEX.test(value)
          ? ""
          : "Le numéro doit contenir 10 chiffres";
      case "email":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Email invalide";
      case "password":
        return value.length >= 8 ? "" : "Minimum 8 caractères";
      case "confirmPassword":
        return value === formData.password
          ? ""
          : "Les mots de passe ne correspondent pas";
      default:
        return "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Transformer les données pour correspondre au format attendu par le backend
    const transformedData = {
      email: formData.email,
      password: formData.password,
      firstname: formData.firstName, // Changement de firstName à firstname
      lastname: formData.lastName, // Changement de lastName à lastname
      phone_number: formData.phoneNumber,
      birthdate: formData.birthDate,
      country: formData.country,
      subscriber_number: formData.subscriber_number,
    };

    try {
      const response = await authService.register(transformedData);
      console.log("Registration successful:", response);
      setSuccess(true);
      setMessage(
        "Pour valider votre inscription, veuillez vérifier votre adresse email en vous rendant sur votre boîte mail."
      );
    } catch (error) {
      console.error("Registration failed:", error);
      setError(error.message);
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
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      birthDate: "",
      country: "",
      subscriber_number: "",
    });
    setError("");
  };

  const togglePasswordVisibility = (field) => {
    if (field === "password") {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  // Réorganisation des champs du formulaire
  const formFields = [
    { name: "email", label: "Email", type: "email", autocomplete: "off" },
    { name: "firstName", label: "Prénom", type: "text" },
    { name: "lastName", label: "Nom", type: "text" },
    { name: "subscriber_number", label: "Numéro d'adhérent", type: "text" },
    { name: "phoneNumber", label: "Téléphone", type: "tel" },
    { name: "birthDate", label: "Date de naissance", type: "date" },
    { name: "country", label: "Pays", type: "text" },
    {
      name: "password",
      label: "Mot de passe",
      type: showPassword ? "text" : "password",
      autocomplete: "new-password",
      icon: true,
      showPassword: showPassword,
    },
    {
      name: "confirmPassword",
      label: "Confirmer le mot de passe",
      type: showConfirmPassword ? "text" : "password",
      autocomplete: "new-password",
      icon: true,
      showPassword: showConfirmPassword,
    },
  ];

  return createElement(
    "div",
    {
      className: "container mx-auto px-4",
    },
    createElement(
      "h1",
      {
        className: "text-2xl font-bold text-center mt-8",
      },
      "Inscription"
    ),
    error &&
      createElement(
        "div",
        {
          className:
            "max-w-md mx-auto mt-4 p-4 bg-red-100 text-red-700 rounded-md",
        },
        error
      ),
    createElement(
      "form",
      {
        onSubmit: handleSubmit,
        onReset: resetForm,
        className: "max-w-md mx-auto mt-8 space-y-6",
      },
      formFields.map((field) =>
        createElement(
          "div",
          {
            key: field.name,
            className: "mb-4 relative",
          },
          createElement(
            "label",
            {
              htmlFor: field.name,
              className: "block text-sm font-medium text-gray-700 mb-2",
            },
            field.label
          ),
          createElement(
            "div",
            {
              className: "relative",
            },
            createElement("input", {
              type: field.type,
              id: field.name,
              name: field.name,
              value: formData[field.name],
              onChange: handleChange,
              className: `w-full p-2 border ${
                fieldErrors[field.name] ? "border-red-500" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                field.icon ? "pr-10" : ""
              }`,
              required: true,
              disabled: isLoading,
              autoComplete: field.autocomplete || "on",
            }),
            field.icon &&
              createElement(
                "button",
                {
                  type: "button",
                  className:
                    "absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-800",
                  onClick: () => togglePasswordVisibility(field.name),
                },
                createElement(field.showPassword ? FaEyeSlash : FaEye, {
                  className: "h-5 w-5",
                })
              )
          ),
          fieldErrors[field.name] &&
            createElement(
              "p",
              {
                className: "mt-1 text-sm text-red-500",
              },
              fieldErrors[field.name]
            )
        )
      ),
      createElement(
        "div",
        {
          className: "flex gap-4",
        },
        createElement(
          "button",
          {
            type: "submit",
            disabled: isLoading,
            className: `flex-1 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isLoading
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white`,
          },
          isLoading ? "Inscription en cours..." : "S'inscrire"
        ),
        createElement(
          "button",
          {
            type: "reset",
            className:
              "flex-1 p-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300",
          },
          "Réinitialiser"
        )
      )
    ),
    success && (
      <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded relative max-w-md mx-auto">
        <p className="text-center">{message}</p>
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => (window.location.href = "/login")}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Aller à la page de connexion
          </button>
        </div>
      </div>
    )
  );
}
