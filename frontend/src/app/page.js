"use client";

import { createElement } from "react";

export default function HomePage() {
  return createElement(
    "div",
    {
      className: "container mx-auto px-4",
    },
    createElement(
      "section",
      {
        className: "text-center py-16",
      },
      createElement(
        "h1",
        {
          className: "text-4xl md:text-6xl font-bold mb-4",
        },
        "Street Fishing"
      ),
      createElement(
        "p",
        {
          className: "text-xl text-gray-600",
        },
        "Bienvenue sur la plateforme de gestion des compétitions de pêche urbaine"
      )
    ),
    createElement(
      "section",
      {
        className: "py-12",
      },
      createElement(
        "h2",
        {
          className: "text-3xl font-bold text-center mb-8",
        },
        "Fonctionnalités"
      ),
      createElement(
        "div",
        {
          className: "grid md:grid-cols-3 gap-8",
        },
        [
          {
            title: "Compétitions",
            description: "Gérez vos compétitions de pêche en temps réel",
          },
          {
            title: "Équipes",
            description: "Suivez les performances des équipes participantes",
          },
          {
            title: "Prises",
            description: "Enregistrez et validez les prises des pêcheurs",
          },
        ].map((feature) =>
          createElement(
            "div",
            {
              key: feature.title,
              className: "p-6 bg-white rounded-lg shadow-sm",
            },
            createElement(
              "h3",
              { className: "text-xl font-bold mb-2" },
              feature.title
            ),
            createElement(
              "p",
              { className: "text-gray-600" },
              feature.description
            )
          )
        )
      )
    )
  );
}
