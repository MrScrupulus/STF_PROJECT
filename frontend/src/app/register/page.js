"use client";

import { createElement } from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "../../services/authService";

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
      default:
        return "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.register(formData);
      console.log("Registration successful:", response);
      router.push("/login?registered=true");
    } catch (error) {
      console.error("Registration failed:", error);
      setError(
        error.message === "Failed to fetch"
          ? "Impossible de contacter le serveur. Veuillez vérifier votre connexion."
          : error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

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
      [
        { name: "email", label: "Email", type: "email", autocomplete: "off" },
        {
          name: "password",
          label: "Mot de passe",
          type: "password",
          autocomplete: "new-password",
        },
        {
          name: "confirmPassword",
          label: "Confirmer le mot de passe",
          type: "password",
          autocomplete: "new-password",
        },
        { name: "firstName", label: "Prénom", type: "text" },
        { name: "lastName", label: "Nom", type: "text" },
        { name: "phoneNumber", label: "Téléphone", type: "tel" },
        { name: "birthDate", label: "Date de naissance", type: "date" },
        { name: "country", label: "Pays", type: "text" },
        { name: "subscriber_number", label: "Numéro d'adhérent", type: "text" },
      ].map((field) =>
        createElement(
          "div",
          {
            key: field.name,
            className: "mb-4",
          },
          createElement(
            "label",
            {
              htmlFor: field.name,
              className: "block text-sm font-medium text-gray-700 mb-2",
            },
            field.label
          ),
          createElement("input", {
            type: field.type,
            id: field.name,
            name: field.name,
            value: formData[field.name],
            onChange: handleChange,
            className: `w-full p-2 border ${
              fieldErrors[field.name] ? "border-red-500" : "border-gray-300"
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`,
            required: true,
            disabled: isLoading,
            autoComplete: field.autocomplete || "on",
          }),
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
    )
  );
}
