"use client";

import { createElement } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { competitionsService } from "../../../services/competitions";
import styles from "../../styles/pages/competitions.module.scss";

export default function CompetitionDetailPage() {
  const params = useParams();
  const id = params.id;

  const { data: competition, isLoading } = useQuery({
    queryKey: ["competition", id],
    queryFn: () => competitionsService.getOne(id),
  });

  if (isLoading)
    return createElement("div", { className: styles.loading }, "Chargement...");
  if (!competition)
    return createElement(
      "div",
      { className: styles.error },
      "Compétition non trouvée"
    );

  const getStatusClass = (status) => {
    switch (status) {
      case "upcoming":
        return styles.statusUpcoming;
      case "ongoing":
        return styles.statusOngoing;
      case "ended":
        return styles.statusEnded;
      default:
        return "";
    }
  };

  return createElement(
    "div",
    {
      className: styles.competitions__container,
    },
    createElement(
      "h1",
      {
        className: styles.competitions__title,
      },
      competition.name
    ),
    createElement(
      "div",
      {
        className: styles.competitions__card,
      },
      createElement(
        "div",
        {
          className: styles.competitions__date,
        },
        createElement("strong", null, "Date: "),
        new Date(competition.date).toLocaleDateString()
      ),
      createElement(
        "div",
        {
          className: styles.competitions__status,
        },
        createElement("strong", null, "Statut: "),
        createElement(
          "span",
          {
            className: getStatusClass(competition.status),
          },
          competition.status
        )
      ),
      createElement(
        "div",
        {
          className: styles.competitions__teams,
        },
        createElement("strong", null, "Nombre d'équipes: "),
        competition.teams?.length || 0
      )
    )
  );
}
