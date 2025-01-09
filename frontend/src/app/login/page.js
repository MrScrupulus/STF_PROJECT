"use client";

import { createElement, useEffect } from "react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    const registered = searchParams.get("registered");
    const verified = searchParams.get("verified");

    if (registered) {
      setMessage(
        "Inscription réussie ! Veuillez vérifier votre email pour activer votre compte."
      );
    } else if (verified) {
      setMessage(
        "Email vérifié avec succès ! Vous pouvez maintenant vous connecter."
      );
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Implémenter la connexion
    console.log("Login attempt:", formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return createElement(
    "div",
    {
      key: "login-container",
      className: "container mx-auto px-4",
    },
    createElement(
      "h1",
      {
        key: "login-title",
        className: "text-2xl font-bold text-center mt-8",
      },
      "Connexion"
    ),
    createElement(
      "form",
      {
        key: "login-form",
        onSubmit: handleSubmit,
        className: "max-w-md mx-auto mt-8",
      },
      createElement(
        "div",
        {
          key: "email-group",
          className: "mb-4",
        },
        createElement(
          "label",
          {
            key: "email-label",
            htmlFor: "email",
            className: "block mb-2",
          },
          "Email"
        ),
        createElement("input", {
          key: "email-input",
          type: "email",
          id: "email",
          name: "email",
          value: formData.email,
          onChange: handleChange,
          className: "w-full p-2 border rounded",
          required: true,
          autoComplete: "email",
        })
      ),
      createElement(
        "div",
        {
          key: "password-group",
          className: "mb-4",
        },
        createElement(
          "label",
          {
            key: "password-label",
            htmlFor: "password",
            className: "block mb-2",
          },
          "Mot de passe"
        ),
        createElement("input", {
          key: "password-input",
          type: "password",
          id: "password",
          name: "password",
          value: formData.password,
          onChange: handleChange,
          className: "w-full p-2 border rounded",
          required: true,
          autoComplete: "current-password",
        })
      ),
      createElement(
        "button",
        {
          key: "submit-button",
          type: "submit",
          className:
            "w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600",
        },
        "Se connecter"
      )
    )
  );
}
