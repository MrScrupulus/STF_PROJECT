"use client";

import { createElement } from "react";
import styles from "@/styles/pages/home.module.scss";

export default function HomePage() {
  return createElement(
    "div",
    {
      className: styles.homeContainer,
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
        "Bienvenue sur STF Project"
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
        "À quoi ça sert?"
      ),
      createElement(
        "div",
        {
          className: "grid md:grid-cols-3 gap-8",
        },
        [
          {
            title: "Compétitions",
            description:
              "Inscrivez-vous à une compétition, suivez vos résultats en direct",
          },
          {
            title: "Équipes",
            description: "Créez votre équipe, invitez vos amis.",
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
