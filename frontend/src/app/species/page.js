"use client";

import { createElement } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { speciesService } from "../../services/species";

export default function SpeciesPage() {
  const queryClient = useQueryClient();

  const { data: species, isLoading } = useQuery({
    queryKey: ["species"],
    queryFn: speciesService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: speciesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["species"] });
    },
  });

  if (isLoading) return createElement("div", null, "Chargement...");

  return createElement(
    "div",
    {
      key: "species-container",
      className: "container mx-auto px-4",
    },
    createElement(
      "h1",
      {
        key: "title",
        className: "text-2xl font-bold text-center mt-8",
      },
      "Espèces"
    ),
    createElement(
      "div",
      {
        key: "content",
        className: "mt-8",
      },
      createElement(
        "ul",
        {
          key: "species-list",
          className: "space-y-4",
        },
        species?.map((s) =>
          createElement(
            "li",
            {
              key: s.id,
              className: "p-4 border rounded",
            },
            createElement(
              "div",
              {
                key: `name-${s.id}`,
                className: "font-bold",
              },
              s.name
            ),
            s.scientificName &&
              createElement(
                "div",
                {
                  key: `scientific-${s.id}`,
                  className: "text-gray-600 italic",
                },
                s.scientificName
              ),
            s.description &&
              createElement(
                "div",
                {
                  key: `description-${s.id}`,
                  className: "mt-2 text-gray-700",
                },
                s.description
              )
          )
        )
      ),
      createElement(
        "button",
        {
          key: "add-button",
          onClick: () =>
            createMutation.mutate({
              name: "Nouvelle espèce",
              scientificName: "Nom scientifique",
            }),
          className:
            "mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600",
        },
        "Ajouter une espèce"
      )
    )
  );
}
