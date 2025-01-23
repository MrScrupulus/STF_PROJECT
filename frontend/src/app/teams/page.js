"use client";

import { useState, useEffect } from "react";
import { teamService } from "@/services/teamService";
import { authService } from "@/services/authService";

export default function TeamsPage() {
  const [team, setTeam] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const userData = await authService.getCurrentUser();
        setUser(userData);

        // Si l'utilisateur a une équipe, on la récupère
        if (userData.team) {
          setTeam(userData.team);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Mon Équipe</h1>

      {team ? (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-blue-600 mb-4">
            {team.name}
          </h2>
          <div className="space-y-4">
            {team.members?.map((member) => (
              <div key={member.id} className="flex items-center space-x-2">
                <span className="font-medium">
                  {member.firstname} {member.lastname}
                </span>
              </div>
            ))}
            {team.competition && (
              <div className="mt-6 pt-4 border-t">
                <p className="font-medium">
                  Compétition en cours : {team.competition.name}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Vous n'avez pas encore d'équipe</p>
          <button
            onClick={() => (window.location.href = "/teams/create")}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Créer une équipe
          </button>
        </div>
      )}
    </div>
  );
}
