"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { competitionsService } from "../../../services/competitions";
import { teamService } from "../../../services/teamService";
import { authService } from "../../../services/authService";
import styles from "../../../styles/pages/competitions.module.scss";
import { toast } from "react-hot-toast";
import ProtectedRoute from "../../../components/auth/ProtectedRoute";
import classNames from "classnames";
import layoutStyles from "../../../styles/components/layout/layout.module.scss";

export default function CompetitionDetailPage() {
  const params = useParams();
  const id = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const { data: competition, isLoading: competitionLoading } = useQuery({
    queryKey: ["competition", id],
    queryFn: () => competitionsService.getOne(id),
  });

  const { data: myTeamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ["my-teams"],
    queryFn: async () => {
      const response = await teamService.getMyTeams();
      return response.teams || [];
    },
    // Charger les équipes dès que la page est chargée pour vérifier la disponibilité
  });

  // Charger l'utilisateur connecté pour vérifier son rôle
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userResponse = await authService.getCurrentUser();
        if (userResponse.success && userResponse.user) {
          setCurrentUser(userResponse.user);
          setIsAdmin(userResponse.user.roles?.includes("ROLE_ADMIN") || false);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  const registerMutation = useMutation({
    mutationFn: ({ teamId, competitionId }) =>
      teamService.registerToCompetition(teamId, competitionId),
    onSuccess: () => {
      toast.success("Équipe inscrite à la compétition avec succès !");
      queryClient.invalidateQueries(["competition", id]);
      queryClient.invalidateQueries(["my-teams"]);
      setShowRegisterForm(false);
      setSelectedTeamId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de l'inscription");
    },
  });

  const handleRegister = (e) => {
    e.preventDefault();
    if (!selectedTeamId) {
      toast.error("Veuillez sélectionner une équipe");
      return;
    }
    registerMutation.mutate({ teamId: selectedTeamId, competitionId: id });
  };

  if (competitionLoading)
    return (
      <div className={classNames(layoutStyles.main, styles.loading)}>
        Chargement...
      </div>
    );
  if (!competition)
    return (
      <div className={classNames(layoutStyles.main, styles.error)}>
        Compétition non trouvée
      </div>
    );

  const getStatusClass = (status) => {
    switch (status) {
      case "upcoming":
        return styles.statusUpcoming;
      case "ongoing":
        return styles.statusOngoing;
      case "ended":
        return styles.statusEnded;
      default:
        return "";
    }
  };

  const allMyTeams = myTeamsData || [];
  // Filtrer les équipes sans compétition OU inscrites à cette compétition spécifique
  const myTeams = allMyTeams.filter(team => 
    !team.competition || (team.competition && team.competition.id === parseInt(id))
  );
  const hasAvailableTeams = myTeams.length > 0;
  const hasSingleTeam = myTeams.length === 1;
  const singleTeam = hasSingleTeam ? myTeams[0] : null;
  
  // Vérifier si l'utilisateur est déjà inscrit à cette compétition
  const isAlreadyRegistered = allMyTeams.some(
    team => team.competition && team.competition.id === parseInt(id)
  );

  // Si l'utilisateur n'a qu'une seule équipe, l'inscrire automatiquement au clic
  const handleRegisterClick = () => {
    if (hasSingleTeam) {
      // Inscrire directement l'unique équipe
      registerMutation.mutate({ teamId: singleTeam.id, competitionId: id });
    } else {
      // Afficher le formulaire de sélection si plusieurs équipes
      setShowRegisterForm(true);
    }
  };

  return (
    <ProtectedRoute>
      <div className={classNames(layoutStyles.main, styles.competitions__container)}>
        <h1 className={styles.competitions__title}>{competition.name}</h1>

        <div className={styles.competitions__card}>
          <div className={styles.competitions__date}>
            <strong>Date de début: </strong>
            {competition.startDate
              ? new Date(competition.startDate).toLocaleDateString("fr-FR")
              : "Non définie"}
          </div>
          <div className={styles.competitions__date}>
            <strong>Date de fin: </strong>
            {competition.endDate
              ? new Date(competition.endDate).toLocaleDateString("fr-FR")
              : "Non définie"}
          </div>
          {competition.description && (
            <div className={styles.competitions__description}>
              <strong>Description: </strong>
              {competition.description}
            </div>
          )}
          <div className={styles.competitions__info}>
            <div>
              <strong>Taille d'équipe: </strong>
              {competition.teamSize} membre(s)
            </div>
            <div>
              <strong>Nombre d'équipes inscrites: </strong>
              {competition.teams?.length || 0}
              {competition.maxParticipants && !competition.hasNoLimit && (
                <span>
                  {" "}
                  / {Math.floor(competition.maxParticipants / competition.teamSize)} max
                </span>
              )}
            </div>
          </div>
        </div>

        {!showRegisterForm ? (
          <div className={styles.competitions__actions}>
            {isAlreadyRegistered ? (
              <div className={styles.competitions__already_registered}>
                <p>✓ Vous êtes déjà inscrit à cette compétition avec votre équipe.</p>
              </div>
            ) : hasAvailableTeams ? (
              <>
                {hasSingleTeam ? (
                  <div className={styles.competitions__single_team_info}>
                    <p>
                      <strong>Votre équipe :</strong> {singleTeam.name}
                    </p>
                    <button
                      onClick={handleRegisterClick}
                      disabled={registerMutation.isPending}
                      className={styles.competitions__register_btn}
                    >
                      {registerMutation.isPending
                        ? "Inscription en cours..."
                        : "Inscrire mon équipe"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleRegisterClick}
                    className={styles.competitions__register_btn}
                  >
                    Inscrire mon équipe
                  </button>
                )}
              </>
            ) : (
              <div className={styles.competitions__no_teams}>
                <p>Vous n'avez pas d'équipe disponible pour cette compétition.</p>
                <button
                  onClick={() => router.push("/teams/create")}
                  className={styles.competitions__create_team_btn}
                >
                  Créer une équipe
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.competitions__register_form}>
            <h2>Inscrire une équipe à cette compétition</h2>
            {teamsLoading ? (
              <div>Chargement de vos équipes...</div>
            ) : hasAvailableTeams ? (
              <form onSubmit={handleRegister}>
                <div className={styles.competitions__form_group}>
                  <label htmlFor="team-select">Sélectionnez votre équipe:</label>
                  <select
                    id="team-select"
                    value={selectedTeamId || ""}
                    onChange={(e) => setSelectedTeamId(parseInt(e.target.value))}
                    className={styles.competitions__select}
                    required
                  >
                    <option value="">-- Choisir une équipe --</option>
                    {myTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name} ({team.members?.length || 0} membre
                        {team.members?.length > 1 ? "s" : ""})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTeamId && (
                  <div className={styles.competitions__team_preview}>
                    <h3>Équipe sélectionnée:</h3>
                    {myTeams
                      .find((t) => t.id === selectedTeamId)
                      ?.members?.map((member) => (
                        <div key={member.id} className={styles.competitions__member}>
                          {member.firstname} {member.lastname}
                        </div>
                      ))}
                  </div>
                )}

                <div className={styles.competitions__form_actions}>
                  <button
                    type="submit"
                    disabled={registerMutation.isPending || !selectedTeamId}
                    className={styles.competitions__submit_btn}
                  >
                    {registerMutation.isPending
                      ? "Inscription en cours..."
                      : "Confirmer l'inscription"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRegisterForm(false);
                      setSelectedTeamId(null);
                    }}
                    className={styles.competitions__cancel_btn}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <div className={styles.competitions__no_teams}>
                <p>
                  Vous n'avez pas d'équipe disponible pour cette compétition.
                  <br />
                  Créez une équipe pour pouvoir vous inscrire.
                </p>
                <button
                  onClick={() => router.push("/teams/create")}
                  className={styles.competitions__create_team_btn}
                >
                  Créer une équipe
                </button>
              </div>
            )}
          </div>
        )}

        {competition.teams && competition.teams.length > 0 && (
          <div className={styles.competitions__teams_list}>
            <h2>Équipes inscrites</h2>
            <div className={styles.competitions__teams_grid}>
              {(() => {
                // Filtrer les équipes selon le rôle de l'utilisateur
                let teamsToShow = competition.teams;
                
                if (!isAdmin && currentUser) {
                  // Pour les utilisateurs non-admin, ne montrer que leur propre équipe
                  const userTeamIds = (myTeamsData || [])
                    .filter(team => team.competition && team.competition.id === parseInt(id))
                    .map(team => team.id);
                  
                  teamsToShow = competition.teams.filter(team => 
                    userTeamIds.includes(team.id)
                  );
                }
                
                // Trier par score décroissant pour les admins
                if (isAdmin) {
                  teamsToShow = [...teamsToShow].sort((a, b) => 
                    (b.totalScore || 0) - (a.totalScore || 0)
                  );
                }
                
                return teamsToShow.map((team) => (
                  <div key={team.id} className={styles.competitions__team_card}>
                    <h3>{team.name}</h3>
                    {team.registrationNumber && (
                      <div className={styles.competitions__team_number}>
                        N° {team.registrationNumber}
                      </div>
                    )}
                    {/* Afficher le score seulement pour les admins ou pour l'équipe de l'utilisateur */}
                    {(isAdmin || (currentUser && myTeamsData?.some(t => t.id === team.id))) && (
                      <div className={styles.competitions__team_score}>
                        Score: {team.totalScore || 0} points
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
