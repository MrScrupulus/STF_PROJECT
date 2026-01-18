"use client";

import { createElement } from "react";
import { useQuery } from "@tanstack/react-query";
import { competitionsService } from "../../services/competitions";
import styles from "../../styles/pages/competitions.module.scss";
import layoutStyles from "../../styles/components/layout/layout.module.scss";
import Link from "next/link";

const getCompetitionStatus = (startDate, endDate) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) {
    return { text: "À venir", className: styles.statusUpcoming };
  } else if (now >= start && now <= end) {
    return { text: "En cours", className: styles.statusOngoing };
  } else {
    return { text: "Terminée", className: styles.statusEnded };
  }
};

export default function CompetitionsPage() {
  const { data: competitions, isLoading } = useQuery({
    queryKey: ["competitions"],
    queryFn: competitionsService.getAll,
  });

  if (isLoading)
    return createElement("div", { className: `${layoutStyles.main} ${styles.loading}` }, "Chargement...");

  return createElement(
    "div",
    {
      className: `${layoutStyles.main} ${styles.competitions__container}`,
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
      (competitions || []).map((competition) =>
        createElement(
          "div",
          {
            key: competition.id,
            className: styles.competition__card,
          },
          createElement(
            "div",
            {
              className: styles.competition__header,
            },
            createElement(
              Link,
              {
                href: `/competitions/${competition.id}`,
                className: styles.competition__link,
              },
              createElement(
                "h3",
                {
                  className: styles.competition__name,
                },
                competition.name
              )
            ),
            competition.startDate && competition.endDate && createElement(
              "span",
              {
                className: getCompetitionStatus(competition.startDate, competition.endDate).className,
              },
              getCompetitionStatus(competition.startDate, competition.endDate).text
            )
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
          competition.description && createElement(
            "div",
            {
              className: styles.competition__description,
            },
            competition.description
          ),
          createElement(
            "div",
            {
              className: styles.competition__info,
            },
            `Taille d'équipe: ${competition.teamSize} membre(s)`
          )
        )
      )
    )
  );
}
