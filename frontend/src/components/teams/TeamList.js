import { useState, useEffect } from "react";
import { teamService } from "../../services/teamService";
import { authService } from "../../services/authService";
import styles from "../../styles/components/teams/TeamList.scss";

export function TeamList() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const response = await authService.getCurrentUser();
        const userData = response.user;
        console.log("Current user:", {
          id: userData.id,
          email: userData.email,
          firstname: userData.firstname,
        });
        setCurrentUser(userData);

        const teamsData = await teamService.getAll();
        console.log("Teams data:", {
          count: teamsData.teams.length,
          teams: teamsData.teams.map((t) => ({
            id: t.id,
            name: t.name,
            memberIds: t.members.map((m) => m.id),
          })),
        });
        setTeams(teamsData.teams);
      } catch (err) {
        console.error("Error in init:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const isTeamMember = (team) => {
    if (!currentUser || !team.members) return false;

    const isMember = team.members.some(
      (member) => member.id === currentUser.id
    );
    console.log("Checking team membership:", {
      teamId: team.id,
      teamName: team.name,
      currentUserId: currentUser.id,
      memberIds: team.members.map((m) => m.id),
      isMember: isMember,
    });

    return isMember;
  };

  const handleDeleteClick = (team) => {
    setTeamToDelete(team);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await teamService.delete(teamToDelete.id);
      setTeams(teams.filter((team) => team.id !== teamToDelete.id));
      setShowDeleteModal(false);
      setTeamToDelete(null);
      setSuccessMessage("L'équipe a été supprimée avec succès");

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div className="team-list">
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      <div className="team-grid">
        {teams.map((team) => (
          <div key={team.id} className="team-card">
            <h3>{team.name}</h3>

            {/* Numéro d'équipe */}
            {team.registrationNumber && (
              <div className="registration-number">
                Équipe n°{team.registrationNumber}
              </div>
            )}

            {/* Liste des membres */}
            <div className="members-section">
              <h4>Membres :</h4>
              <ul>
                {team.members.map((member) => (
                  <li key={member.id}>
                    {member.firstname} {member.lastname}
                  </li>
                ))}
              </ul>
            </div>

            {/* Liste des prises */}
            {team.catches && team.catches.length > 0 && (
              <div className="catches-section">
                <h4>Prises :</h4>
                <ul>
                  {team.catches.map((catch_) => (
                    <li key={catch_.id}>
                      {catch_.species.name} - {catch_.size}cm
                      {catch_.isValidated ? (
                        <span className="validated">✓</span>
                      ) : (
                        <span className="pending">En attente</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Score total */}
            <div className="total-score">
              Score total : {team.totalScore} points
              {team.hasBonus && <span className="bonus-badge">Bonus !</span>}
            </div>

            {isTeamMember(team) && (
              <div className="actions">
                <button
                  onClick={() => handleDeleteClick(team)}
                  className="delete-button"
                >
                  Supprimer l'équipe
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Confirmer la suppression</h2>
            <p>
              Êtes-vous sûr de vouloir supprimer l'équipe "{teamToDelete?.name}"
              ?
            </p>
            <p className="warning">Cette action est irréversible.</p>

            <div className="modal-buttons">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="cancel-button"
              >
                Annuler
              </button>
              <button onClick={handleDeleteConfirm} className="confirm-button">
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
