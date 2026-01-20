"use client";

import { createElement, useState } from "react";
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
    return { text: "À venir", className: styles.statusUpcoming, sortOrder: 2 };
  } else if (now >= start && now <= end) {
    return { text: "En cours", className: styles.statusOngoing, sortOrder: 1 };
  } else {
    return { text: "Terminée", className: styles.statusEnded, sortOrder: 3 };
  }
};

const FILTERS = {
  ALL: "all",
  ONGOING: "ongoing",
  UPCOMING: "upcoming",
  ENDED: "ended",
};

export default function CompetitionsPage() {
  const [activeFilter, setActiveFilter] = useState(FILTERS.ALL);
  const { data: competitions, isLoading } = useQuery({
    queryKey: ["competitions"],
    queryFn: competitionsService.getAll,
  });

  if (isLoading)
    return createElement("div", { className: `${layoutStyles.main} ${styles.loading}` }, "Chargement...");

  // Filtrer les compétitions selon le filtre actif
  const filteredCompetitions = (competitions || []).filter((competition) => {
    if (activeFilter === FILTERS.ALL) return true;
    const status = getCompetitionStatus(competition.startDate, competition.endDate);
    if (activeFilter === FILTERS.ONGOING) return status.text === "En cours";
    if (activeFilter === FILTERS.UPCOMING) return status.text === "À venir";
    if (activeFilter === FILTERS.ENDED) return status.text === "Terminée";
    return true;
  });

  // Trier les compétitions : En cours, À venir, Terminé
  const sortedCompetitions = [...filteredCompetitions].sort((a, b) => {
    const statusA = getCompetitionStatus(a.startDate, a.endDate);
    const statusB = getCompetitionStatus(b.startDate, b.endDate);
    return statusA.sortOrder - statusB.sortOrder;
  });

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
        className: styles.competitions__filters,
      },
      createElement(
        "button",
        {
          className: `${styles.competitions__filter_btn} ${activeFilter === FILTERS.ALL ? styles.competitions__filter_btn_active : ""}`,
          onClick: () => setActiveFilter(FILTERS.ALL),
        },
        "Toutes"
      ),
      createElement(
        "button",
        {
          className: `${styles.competitions__filter_btn} ${activeFilter === FILTERS.ONGOING ? `${styles.competitions__filter_btn_active} ${styles.competitions__filter_btn_ongoing}` : ""}`,
          onClick: () => setActiveFilter(FILTERS.ONGOING),
        },
        "En cours"
      ),
      createElement(
        "button",
        {
          className: `${styles.competitions__filter_btn} ${activeFilter === FILTERS.UPCOMING ? `${styles.competitions__filter_btn_active} ${styles.competitions__filter_btn_upcoming}` : ""}`,
          onClick: () => setActiveFilter(FILTERS.UPCOMING),
        },
        "À venir"
      ),
      createElement(
        "button",
        {
          className: `${styles.competitions__filter_btn} ${activeFilter === FILTERS.ENDED ? `${styles.competitions__filter_btn_active} ${styles.competitions__filter_btn_ended}` : ""}`,
          onClick: () => setActiveFilter(FILTERS.ENDED),
        },
        "Terminées"
      )
    ),
    sortedCompetitions.length === 0 && activeFilter !== FILTERS.ALL
      ? createElement(
          "div",
          {
            className: styles.competitions__empty,
          },
          `Aucune compétition ${activeFilter === FILTERS.ONGOING ? "en cours" : activeFilter === FILTERS.UPCOMING ? "à venir" : "terminée"}`
        )
      : createElement(
          "div",
          {
            className: styles.competitions__list,
          },
      sortedCompetitions.map((competition) =>
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
            createElement(
              "div",
              {
                style: { display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" },
              },
              competition.startDate && competition.endDate && createElement(
                "span",
                {
                  className: getCompetitionStatus(competition.startDate, competition.endDate).className,
                },
                getCompetitionStatus(competition.startDate, competition.endDate).text
              ),
              competition.isRegistered && createElement(
                "span",
                {
                  className: styles.statusRegistered,
                },
                "✓ Vous êtes inscrit"
              )
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
