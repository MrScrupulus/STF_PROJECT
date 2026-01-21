"use client";

import { createElement, useState, useEffect } from "react";
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
  const [competitionsPage, setCompetitionsPage] = useState(1);
  const [allCompetitions, setAllCompetitions] = useState([]);
  const [competitionsPages, setCompetitionsPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const COMPETITIONS_LIMIT = 10;

  const { data: competitionsData, isLoading } = useQuery({
    queryKey: ["competitions", competitionsPage],
    queryFn: () => competitionsService.getAll(competitionsPage, COMPETITIONS_LIMIT),
  });

  // Mettre à jour les compétitions quand les données changent
  useEffect(() => {
    if (competitionsData) {
      if (competitionsPage === 1) {
        setAllCompetitions(competitionsData.competitions || []);
      } else {
        setAllCompetitions((prev) => {
          const newCompetitions = (competitionsData.competitions || []).filter(
            (newComp) => !prev.some((existingComp) => existingComp.id === newComp.id)
          );
          return [...prev, ...newCompetitions];
        });
      }
      setCompetitionsPages(competitionsData.pagination?.pages || 1);
      setIsLoadingMore(false);
    }
  }, [competitionsData, competitionsPage]);

  const loadMoreCompetitions = () => {
    if (competitionsPage < competitionsPages && !isLoadingMore) {
      setIsLoadingMore(true);
      setCompetitionsPage((prev) => prev + 1);
    }
  };

  if (isLoading && competitionsPage === 1)
    return createElement("div", { className: `${layoutStyles.main} ${styles.loading}` }, "Chargement...");

  // Filtrer les compétitions selon le filtre actif
  const filteredCompetitions = (allCompetitions || []).filter((competition) => {
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
          createElement("p", { className: styles.competitions__empty_title }, 
            `Aucune compétition ${activeFilter === FILTERS.ONGOING ? "en cours" : activeFilter === FILTERS.UPCOMING ? "à venir" : "terminée"}`
          ),
          activeFilter === FILTERS.ONGOING && createElement("p", { className: styles.competitions__empty_subtext },
            "Consultez les compétitions à venir pour vous inscrire."
          ),
          activeFilter === FILTERS.UPCOMING && createElement("p", { className: styles.competitions__empty_subtext },
            "De nouvelles compétitions seront bientôt disponibles."
          ),
          activeFilter === FILTERS.ENDED && createElement("p", { className: styles.competitions__empty_subtext },
            "Aucune compétition n'a encore été terminée."
          )
        )
      : createElement(
          "div",
          {
            className: styles.competitions__list,
          },
      [
        ...sortedCompetitions.map((competition) => {
        const competitionStatus = getCompetitionStatus(competition.startDate, competition.endDate);
        const isEnded = competitionStatus.text === "Terminée";
        return createElement(
          "div",
          {
            key: competition.id,
            className: `${styles.competition__card} ${isEnded ? styles.competition__card_ended : ""}`,
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
        );
      }),
      competitionsPage < competitionsPages && createElement(
        "div",
        {
          key: "load-more",
          className: styles.competitions__load_more,
        },
        createElement(
          "button",
          {
            onClick: loadMoreCompetitions,
            disabled: isLoadingMore,
            className: styles.competitions__load_more_button,
          },
          isLoadingMore ? "Chargement..." : `Charger plus de compétitions (${allCompetitions.length}/${competitionsData?.pagination?.total || 0})`
        )
      )
      ]
    )
  );
}
