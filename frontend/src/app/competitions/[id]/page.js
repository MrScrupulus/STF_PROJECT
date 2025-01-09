"use client";

import { createElement } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { competitionsService } from "../../../services/competitions";

export default function CompetitionDetailPage() {
  const params = useParams();
  const id = params.id;

  const { data: competition, isLoading } = useQuery({
    queryKey: ["competition", id],
    queryFn: () => competitionsService.getOne(id),
  });

  if (isLoading) return createElement("div", null, "Chargement...");
  if (!competition)
    return createElement("div", null, "Compétition non trouvée");

  return createElement(
    "div",
    {
      className: "container mx-auto px-4 py-8",
    },
    createElement(
      "h1",
      {
        className: "text-3xl font-bold mb-6",
      },
      competition.name
    ),
    createElement(
      "div",
      {
        className: "bg-white shadow rounded-lg p-6",
      },
      createElement(
        "div",
        {
          className: "mb-4",
        },
        createElement("strong", null, "Date: "),
        new Date(competition.date).toLocaleDateString()
      ),
      createElement(
        "div",
        {
          className: "mb-4",
        },
        createElement("strong", null, "Statut: "),
        competition.status
      ),
      createElement(
        "div",
        {
          className: "mb-4",
        },
        createElement("strong", null, "Nombre d'équipes: "),
        competition.teams?.length || 0
      )
    )
  );
}
