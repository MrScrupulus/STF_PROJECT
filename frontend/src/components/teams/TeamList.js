import { useState, useEffect } from "react";
import { teamService } from "../../services/teamService";
import "../../styles/components/teams/TeamList.scss";

export function TeamList() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await teamService.getAll();
        setTeams(data.teams);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div className="team-list">
      <h2>Équipes</h2>
      <div className="team-grid">
        {teams.map((team) => (
          <div key={team.id} className="team-card">
            <h3>{team.name}</h3>
            <p>Score total: {team.totalScore}</p>
            {team.hasBonus && (
              <div className="bonus-badge">Bonus 5 espèces !</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
