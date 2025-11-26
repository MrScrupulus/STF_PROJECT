"use client";

import { createElement } from "react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { catchesService } from "../../services/catches";
import styles from "../../styles/pages/catch.module.scss";
import ProtectedRoute from "../../components/auth/ProtectedRoute";

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

  const { isLoading, data: queryData } = useQuery({
    queryKey: ["catches"],
    queryFn: () => catchesService.getAll(),
  });

  const queryClient = useQueryClient();

  const validateMutation = useMutation((id) => catchesService.validate(id), {
    onSuccess: () => {
      queryClient.invalidateQueries(["catches"]);
    },
  });

  if (error) return createElement("div", null, error);

  if (isLoading)
    return createElement("div", { className: styles.loading }, "Chargement...");

  return (
    <ProtectedRoute>
      <div className={styles.catch__container}>
        <h1 className={styles.catch__title}>Prises</h1>
        <ul className={styles.catch__list}>
          {queryData?.map((c) =>
            createElement(
              "li",
              {
                key: c.id,
                className: styles.catch__item,
              },
              createElement("span", null, `${c.species.name} - ${c.length}cm`),
              !c.isValidated &&
                createElement(
                  "button",
                  {
                    onClick: () => validateMutation.mutate(c.id),
                    className: styles.catch__validate - btn,
                  },
                  "Valider"
                )
            )
          )}
        </ul>
      </div>
    </ProtectedRoute>
  );
}
