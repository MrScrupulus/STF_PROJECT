"use client";

import { createElement } from "react";
import { useState, useEffect } from "react";

export default function ProfilPage() {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");

    if (!token) {
      setError("Token non trouvé. Veuillez vous connecter.");
      return;
    }

    fetch("http://localhost:8001/api/users", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erreur réseau");
        }
        return response.json();
      })
      .then((data) => setUserData(data))
      .catch((error) => setError(error.message));
  }, []);

  if (error) return createElement("div", null, error);
  if (!userData) return createElement("div", null, "Chargement...");

  return createElement(
    "div",
    {
      className: "container mx-auto px-4 py-8",
    },
    createElement(
      "h1",
      {
        className: "text-2xl font-bold mb-6",
      },
      "Profil de l'utilisateur"
    ),
    createElement(
      "div",
      {
        className: "bg-white shadow rounded-lg p-6",
      },
      createElement(
        "p",
        {
          className: "mb-4",
        },
        createElement("strong", null, "Nom: "),
        `${userData.firstname} ${userData.lastname}`
      ),
      createElement(
        "p",
        {
          className: "mb-4",
        },
        createElement("strong", null, "Email: "),
        userData.email
      )
    )
  );
}
