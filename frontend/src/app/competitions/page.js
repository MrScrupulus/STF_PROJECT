"use client";

import { createElement, useState, useEffect, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
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
  PARTICIPATED: "participated",
};

function CompetitionsPageContent() {
  const searchParams = useSearchParams();
  const filterParam = searchParams?.get("filter");
  const [activeFilter, setActiveFilter] = useState(
    filterParam === "participated" ? FILTERS.PARTICIPATED : FILTERS.ALL
  );
  const [competitionsPage, setCompetitionsPage] = useState(1);
  const [allCompetitions, setAllCompetitions] = useState([]);
  const [competitionsPages, setCompetitionsPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const COMPETITIONS_LIMIT = 10;

  const { data: competitionsData, isLoading, error: competitionsError } = useQuery({
    queryKey: ["competitions", competitionsPage],
    queryFn: () => competitionsService.getAll(competitionsPage, COMPETITIONS_LIMIT),
    retry: false, // Ne pas réessayer en cas d'erreur 401
  });

  // Mettre à jour les compétitions quand les données changent
  useEffect(() => {
    if (competitionsData) {
      const competitions = competitionsData.competitions || [];
      if (competitionsPage === 1) {
        setAllCompetitions(competitions);
      } else {
        setAllCompetitions((prev) => {
          const newCompetitions = competitions.filter(
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

  // Gérer l'erreur 401 (non authentifié) gracieusement
  if (competitionsError && (competitionsError.status === 401 || (competitionsError.message && competitionsError.message.includes("401")))) {
    return createElement(
      "div",
      { className: `${layoutStyles.main} ${styles.competitions__container}` },
      createElement("h1", { className: styles.competitions__title }, "Compétitions"),
      createElement(
        "div",
        {
          style: {
            backgroundColor: "#e3f2fd",
            border: "1px solid #2196f3",
            borderRadius: "8px",
            padding: "20px",
            marginTop: "20px",
            textAlign: "center"
          }
        },
        createElement("p", { style: { marginBottom: "16px", color: "#555" } },
          "Les compétitions sont actuellement accessibles uniquement aux utilisateurs connectés."
        ),
        createElement(
          Link,
          {
            href: "/login",
            style: {
              display: "inline-block",
              padding: "10px 20px",
              backgroundColor: "#007AFF",
              color: "white",
              textDecoration: "none",
              borderRadius: "5px",
              fontWeight: "600"
            }
          },
          "Se connecter"
        )
      )
    );
  }

  // Filtrer les compétitions selon le filtre actif
  const filteredCompetitions = (allCompetitions || []).filter((competition) => {
    if (activeFilter === FILTERS.ALL) return true;
    if (activeFilter === FILTERS.PARTICIPATED) {
      // Afficher seulement les compétitions auxquelles l'utilisateur est inscrit ou a participé
      return competition.isRegistered === true;
    }
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
            activeFilter === FILTERS.PARTICIPATED
              ? "Aucune compétition à laquelle vous avez participé"
              : `Aucune compétition ${activeFilter === FILTERS.ONGOING ? "en cours" : activeFilter === FILTERS.UPCOMING ? "à venir" : "terminée"}`
          ),
          activeFilter === FILTERS.ONGOING && createElement("p", { className: styles.competitions__empty_subtext },
            "Consultez les compétitions à venir pour vous inscrire."
          ),
          activeFilter === FILTERS.UPCOMING && createElement("p", { className: styles.competitions__empty_subtext },
            "De nouvelles compétitions seront bientôt disponibles."
          ),
          activeFilter === FILTERS.ENDED && createElement("p", { className: styles.competitions__empty_subtext },
            "Aucune compétition n'a encore été terminée."
          ),
          activeFilter === FILTERS.PARTICIPATED && createElement("p", { className: styles.competitions__empty_subtext },
            "Vous n'avez pas encore participé à une compétition."
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
              competition.isRegistered && !isEnded && createElement(
                "span",
                {
                  className: styles.statusRegistered,
                },
                "✓ Inscrit"
              ),
              competition.isRegistered && isEnded && createElement(
                "span",
                {
                  className: styles.statusParticipated,
                },
                "✓ Participé"
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

export default function CompetitionsPage() {
  return createElement(
    Suspense,
    {
      fallback: createElement("div", { className: `${layoutStyles.main} ${styles.loading}` }, "Chargement..."),
    },
    createElement(CompetitionsPageContent)
  );
}
