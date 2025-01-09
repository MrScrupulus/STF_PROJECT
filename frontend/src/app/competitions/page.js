"use client";

import { createElement } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { competitionsService } from "../../services/competitions";

export default function CompetitionsPage() {
  const queryClient = useQueryClient();

  const { data: competitions, isLoading } = useQuery({
    queryKey: ["competitions"],
    queryFn: competitionsService.getAll,
  });

  const startMutation = useMutation({
    mutationFn: competitionsService.start,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitions"] });
    },
  });

  const endMutation = useMutation({
    mutationFn: competitionsService.end,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitions"] });
    },
  });

  if (isLoading) return createElement("div", null, "Chargement...");

  return createElement(
    "div",
    {
      className: "container mx-auto px-4",
    },
    createElement(
      "h1",
      {
        className: "text-2xl font-bold text-center mt-8",
      },
      "Compétitions"
    ),
    createElement(
      "ul",
      {
        className: "mt-4 space-y-4",
      },
      competitions?.map((comp) =>
        createElement(
          "li",
          {
            key: comp.id,
            className: "p-4 border rounded bg-white shadow-sm",
          },
          createElement(
            "div",
            {
              className: "font-bold mb-2",
            },
            comp.name
          ),
          createElement(
            "div",
            {
              className: "flex gap-2",
            },
            createElement(
              "button",
              {
                onClick: () => startMutation.mutate(comp.id),
                className:
                  "bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600",
              },
              "Démarrer"
            ),
            createElement(
              "button",
              {
                onClick: () => endMutation.mutate(comp.id),
                className:
                  "bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600",
              },
              "Terminer"
            )
          )
        )
      )
    )
  );
}
