"use client";

import { createElement } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { catchesService } from "../../services/catches";

export default function CatchesPage() {
  const queryClient = useQueryClient();

  const { data: catches, isLoading } = useQuery({
    queryKey: ["catches"],
    queryFn: catchesService.getAll,
  });

  const validateMutation = useMutation({
    mutationFn: catchesService.validate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catches"] });
    },
  });

  if (isLoading) return createElement("div", null, "Chargement...");

  return createElement(
    "div",
    {
      key: "catches-container",
    },
    createElement(
      "h1",
      {
        key: "title",
        className: "text-2xl font-bold text-center mt-8",
      },
      "Prises"
    ),
    createElement(
      "ul",
      {
        key: "catches-list",
        className: "mt-4",
      },
      catches?.map((c) =>
        createElement(
          "li",
          {
            key: c.id,
            className: "mb-2 flex items-center",
          },
          createElement(
            "span",
            {
              key: `catch-${c.id}-info`,
            },
            `${c.species.name} - ${c.length}cm`
          ),
          !c.isValidated &&
            createElement(
              "button",
              {
                key: `validate-${c.id}`,
                onClick: () => validateMutation.mutate(c.id),
                className: "ml-2 bg-green-500 text-white px-2 py-1 rounded",
              },
              "Valider"
            )
        )
      )
    )
  );
}
