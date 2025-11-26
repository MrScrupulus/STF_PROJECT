"use client";

import { createElement } from "react";
import { useQuery } from "@tanstack/react-query";
import { competitionsService } from "../../services/competitions";
import styles from "../../styles/pages/competitions.module.scss";

export default function CompetitionsPage() {
  const { data: competitions, isLoading } = useQuery({
    queryKey: ["competitions"],
    queryFn: competitionsService.getAll,
  });

  if (isLoading)
    return createElement("div", { className: styles.loading }, "Chargement...");

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
      "Compétitions"
    ),
    createElement(
      "div",
      {
        className: styles.competitions__list,
      },
      competitions?.map((competition) =>
        createElement(
          "div",
          {
            key: competition.id,
            className: styles.competition__card,
          },
          createElement(
            "h3",
            {
              className: styles.competition__name,
            },
            competition.name
          ),
          createElement(
            "div",
            {
              className: styles.competition__details,
            },
            createElement(
              "div",
              {
                className: styles.date_range,
              },
              createElement(
                "span",
                {
                  className: styles.date_range__item,
                },
                `Début: ${new Date(competition.startDate).toLocaleDateString()}`
              ),
              createElement(
                "span",
                {
                  className: styles.date_range__item,
                },
                `Fin: ${new Date(competition.endDate).toLocaleDateString()}`
              )
            ),
            createElement(
              "div",
              {
                className: styles.competition_type,
              },
              competition.type || "Standard"
            )
          ),
          createElement(
            "div",
            {
              className: styles.competitions__date,
            },
            new Date(competition.date).toLocaleDateString()
          ),
          createElement(
            "div",
            {
              className: styles.competitions__status,
            },
            createElement(
              "span",
              {
                className: `${styles.competitions__status}--${competition.status}`,
              },
              competition.status
            )
          ),
          createElement(
            "div",
            {
              className: styles.competitions__teams,
            },
            `${competition.teams?.length || 0} équipes inscrites`
          )
        )
      )
    )
  );
}
