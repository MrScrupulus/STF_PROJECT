"use client";

import { useState, useEffect } from "react";
import { teamService } from "@/services/teamService";
import { competitionService } from "@/services/competitionService";

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [participant2Email, setParticipant2Email] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showCompetitionModal, setShowCompetitionModal] = useState(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const response = await teamService.getAll();
        console.log("Teams response:", response);
        console.log("First team members:", response?.teams[0]?.members);
        setTeams(response?.teams || []);
        setError(null);
      } catch (error) {
        console.error("Error fetching teams:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      setIsCreating(true);
      await teamService.create({
        name: newTeamName,
        participant2Email: participant2Email,
      });

      // Recharger les équipes
      const response = await teamService.getAll();
      setTeams(response.teams || []);

      // Réinitialiser le formulaire
      setNewTeamName("");
      setParticipant2Email("");
      setError(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRegisterToCompetition = async (teamId, competitionId) => {
    try {
      await teamService.registerToCompetition(teamId, competitionId);
      // Recharger les équipes
      const response = await teamService.getAll();
      setTeams(response.teams || []);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Équipes</h1>

      {/* Formulaire de création d'équipe */}
      <form onSubmit={handleCreateTeam} className="mb-8 space-y-4">
        <div>
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="Nom de l'équipe"
            className="border p-2 rounded mr-2"
            required
          />
          <input
            type="email"
            value={participant2Email}
            onChange={(e) => setParticipant2Email(e.target.value)}
            placeholder="Email du second participant"
            className="border p-2 rounded mr-2"
            required
          />
          <button
            type="submit"
            disabled={isCreating}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {isCreating ? "Création..." : "Créer l'équipe"}
          </button>
        </div>
      </form>

      {/* Message d'erreur */}
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* Liste des équipes */}
      {!error && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <div key={team.id} className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg">
                <span className="font-bold">Nom de l'équipe:</span>{" "}
                <span className="text-blue-600 font-semibold">{team.name}</span>
              </h3>
              <p className="text-gray-600">
                <span className="font-bold">Membres:</span>{" "}
                {team.members
                  ?.map((member) => (
                    <span key={member.id} className="text-blue-600">
                      {member.firstname} {member.lastname}
                    </span>
                  ))
                  .reduce((prev, curr) => [prev, ", ", curr])}
              </p>
              {team.competition ? (
                <p className="text-gray-600">
                  Compétition: {team.competition.name}
                  {team.registrationNumber && ` - N°${team.registrationNumber}`}
                </p>
              ) : (
                <button
                  onClick={() => setShowCompetitionModal(team.id)}
                  className="mt-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  S'inscrire à une compétition
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {loading && <div>Chargement...</div>}
    </div>
  );
}
