"use client";

import { useState } from "react";
import { createElement } from "react";

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Implémenter l'inscription
    console.log("Form submitted:", formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return createElement("form", {
    onSubmit: handleSubmit,
    className: "max-w-md mx-auto mt-8",
    children: [
      createElement("div", {
        className: "mb-4",
        children: [
          createElement("label", {
            htmlFor: "email",
            className: "block mb-2",
            children: "Email",
          }),
          createElement("input", {
            type: "email",
            id: "email",
            name: "email",
            value: formData.email,
            onChange: handleChange,
            className: "w-full p-2 border rounded",
            required: true,
          }),
        ],
      }),
      createElement("div", {
        className: "mb-4",
        children: [
          createElement("label", {
            htmlFor: "password",
            className: "block mb-2",
            children: "Mot de passe",
          }),
          createElement("input", {
            type: "password",
            id: "password",
            name: "password",
            value: formData.password,
            onChange: handleChange,
            className: "w-full p-2 border rounded",
            required: true,
          }),
        ],
      }),
      createElement("div", {
        className: "mb-4",
        children: [
          createElement("label", {
            htmlFor: "confirmPassword",
            className: "block mb-2",
            children: "Confirmer le mot de passe",
          }),
          createElement("input", {
            type: "password",
            id: "confirmPassword",
            name: "confirmPassword",
            value: formData.confirmPassword,
            onChange: handleChange,
            className: "w-full p-2 border rounded",
            required: true,
          }),
        ],
      }),
      createElement("button", {
        type: "submit",
        className:
          "w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600",
        children: "S'inscrire",
      }),
    ],
  });
}
