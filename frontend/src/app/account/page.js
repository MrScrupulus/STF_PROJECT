"use client";

import { createElement } from "react";
import { useQuery } from "@tanstack/react-query";

export default function AccountPage() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: () => {
      // TODO: Implémenter la récupération des données utilisateur
      return {
        email: "user@example.com",
        name: "John Doe",
      };
    },
  });

  if (isLoading) return createElement("div", null, "Chargement...");

  return createElement(
    "div",
    {
      key: "account-container",
      className: "container mx-auto px-4",
    },
    createElement(
      "h1",
      {
        key: "account-title",
        className: "text-2xl font-bold text-center mt-8",
      },
      "Mon compte"
    ),
    createElement(
      "div",
      {
        key: "account-content",
        className: "max-w-md mx-auto mt-8",
      },
      createElement(
        "div",
        {
          key: "email-info",
          className: "mb-4",
        },
        createElement(
          "strong",
          {
            key: "email-label",
          },
          "Email: "
        ),
        user?.email
      ),
      createElement(
        "div",
        {
          key: "name-info",
          className: "mb-4",
        },
        createElement("strong", { key: "name-label" }, "Nom: "),
        user?.name
      ),
      createElement(
        "button",
        {
          key: "logout-button",
          className: "bg-red-500 text-white p-2 rounded hover:bg-red-600",
          onClick: () => {
            // TODO: Implémenter la déconnexion
            console.log("Logout clicked");
          },
        },
        "Se déconnecter"
      )
    )
  );
}
