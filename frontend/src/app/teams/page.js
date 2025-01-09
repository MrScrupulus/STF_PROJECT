"use client";

import { createElement } from "react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamsService } from "../../services/teams";

export default function TeamsPage() {
  const queryClient = useQueryClient();
  const [newTeamName, setNewTeamName] = useState("");

  const { data: teams, isLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: teamsService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: teamsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setNewTeamName("");
    },
  });

  if (isLoading) return createElement("div", null, "Chargement...");

  return createElement(
    "div",
    {
      key: "teams-container",
    },
    createElement(
      "h1",
      {
        key: "title",
        className: "text-2xl font-bold text-center mt-8",
      },
      "Équipes"
    ),
    createElement(
      "div",
      {
        key: "input-container",
        className: "flex gap-2 mt-4",
      },
      createElement("input", {
        key: "team-input",
        type: "text",
        value: newTeamName,
        onChange: (e) => setNewTeamName(e.target.value),
        placeholder: "Nom de l'équipe",
        className: "border p-2 rounded",
      }),
      createElement(
        "button",
        {
          key: "add-button",
          onClick: () => createMutation.mutate({ name: newTeamName }),
          className: "bg-blue-500 text-white p-2 rounded",
        },
        "Ajouter"
      )
    ),
    createElement(
      "ul",
      {
        key: "teams-list",
        className: "mt-4",
      },
      teams?.map((team) =>
        createElement(
          "li",
          {
            key: team.id,
            className: "mb-2",
          },
          team.name
        )
      )
    )
  );
}
