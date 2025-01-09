"use client";

import { createElement } from "react";
import { useState, useEffect } from "react";

export default function CatchPage() {
  const [catches, setCatches] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");

    if (!token) {
      setError("Token non trouvé. Veuillez vous connecter.");
      return;
    }

    fetch("http://localhost:8000/api/catches", {
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
      .then((data) => setCatches(data))
      .catch((error) => setError(error.message));
  }, []);

  if (error) return createElement("div", null, error);

  return createElement(
    "div",
    null,
    createElement("h1", null, "Liste des captures"),
    createElement(
      "ul",
      null,
      catches.map((catchItem) =>
        createElement(
          "li",
          {
            key: catchItem.id,
          },
          catchItem.name
        )
      )
    )
  );
}
