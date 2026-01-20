"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { competitionsService } from "../../../services/competitions";
import { teamService } from "../../../services/teamService";
import { authService } from "../../../services/authService";
import { adminService } from "../../../services/adminService";
import { speciesService } from "../../../services/speciesService";
import ScheduledPausesManager from "../../../components/admin/ScheduledPausesManager";
import SpeciesPieChart from "../../../components/competition/SpeciesPieChart";
import CatchesMap from "../../../components/competition/CatchesMap";
import styles from "../../../styles/pages/competitions.module.scss";
import { toast } from "react-hot-toast";
import ProtectedRoute from "../../../components/auth/ProtectedRoute";
import classNames from "classnames";
import layoutStyles from "../../../styles/components/layout/layout.module.scss";

export default function CompetitionDetailPage() {
  const params = useParams();
  const id = parseInt(params.id, 10);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  const { data: competitionResponse, isLoading: competitionLoading } = useQuery({
    queryKey: ["competition", id],
    queryFn: () => competitionsService.getOne(id),
  });

  // Le backend retourne maintenant { success: true, ...competition }
  // Extraire les données de la compétition (gérer les deux formats possibles)
  const competition = competitionResponse?.success !== undefined
    ? (competitionResponse.success ? { ...competitionResponse, success: undefined } : null)
    : competitionResponse;

  const { data: myTeamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ["my-teams"],
    queryFn: async () => {
      const response = await teamService.getMyTeams();
      return response.teams || [];
    },
    // Charger les équipes dès que la page est chargée pour vérifier la disponibilité
  });

  // Utiliser les espèces de la compétition si disponibles, sinon toutes les espèces
  const speciesData = competition?.species && competition.species.length > 0
    ? competition.species
    : null;
  const loadingSpecies = false; // Les espèces sont déjà dans les données de la compétition

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

  // Charger les statistiques si le classement est public
  useEffect(() => {
    // Vérifier que la compétition est chargée
    if (!competition) {
      return;
    }

    // Ne charger que si le classement est public ou si l'utilisateur est admin
    if (!competition.isRankingPublic && !isAdmin) {
      return;
    }

    // Ne pas recharger si les stats sont déjà chargées ou en cours de chargement
    if (stats || loadingStats) {
      return;
    }

    const loadStats = async () => {
      setLoadingStats(true);
      try {
        const response = await competitionsService.getPublicStats(id);
        if (response.success && response.stats) {
          setStats(response.stats);
        }
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competition?.isRankingPublic, isAdmin, id]);

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

  // Mutation pour mettre en pause/reprendre
  const pauseMutation = useMutation({
    mutationFn: (isPaused) => adminService.togglePause(id, isPaused),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition", id] });
      toast.success(competition?.isPaused ? "Compétition reprise" : "Compétition mise en pause");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Erreur lors de la modification");
    },
  });

  const handleTogglePause = () => {
    const newPauseState = !competition?.isPaused;
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir ${newPauseState ? "mettre en pause" : "reprendre"} cette compétition ?\n\n${
          newPauseState
            ? "Aucune prise ne pourra être ajoutée pendant la pause."
            : "Les prises pourront à nouveau être ajoutées."
        }`
      )
    ) {
      pauseMutation.mutate(newPauseState);
    }
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

  const getCompetitionStatus = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) {
      return { text: "À venir", className: styles.statusUpcoming };
    } else if (now >= start && now <= end) {
      return { text: "En cours", className: styles.statusOngoing };
    } else {
      return { text: "Terminée", className: styles.statusEnded };
    }
  };

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
  // Filtrer les équipes sans compétition, inscrites à cette compétition spécifique,
  // ou inscrites à une compétition terminée (pour permettre la réinscription)
  const now = new Date();
  
  // Vérifier si la compétition est terminée
  const isCompetitionEnded = competition?.isEnded || (competition?.endDate && new Date(competition.endDate) < now);
  
  const myTeams = allMyTeams.filter(team => {
    if (!team.competition) {
      // Équipe sans compétition - disponible
      return true;
    }
    if (team.competition.id === parseInt(id)) {
      // Équipe déjà inscrite à cette compétition - disponible pour affichage
      return true;
    }
    // Équipe inscrite à une autre compétition - disponible seulement si la compétition est terminée
    const competitionEndDate = new Date(team.competition.endDate);
    return competitionEndDate < now;
  });
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
        <div className={styles.competitions__header}>
          <h1 className={styles.competitions__title}>{competition.name}</h1>
          {competition.startDate && competition.endDate && (
            <span className={getCompetitionStatus(competition.startDate, competition.endDate).className}>
              {getCompetitionStatus(competition.startDate, competition.endDate).text}
            </span>
          )}
        </div>

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

          {/* Onglets */}
          <div className={styles.competitions__tabs}>
            <button
              className={`${styles.competitions__tab} ${
                activeTab === 'info' ? styles.competitions__tab_active : ''
              }`}
              onClick={() => setActiveTab('info')}
            >
              Informations
            </button>
            <button
              className={`${styles.competitions__tab} ${
                activeTab === 'species' ? styles.competitions__tab_active : ''
              }`}
              onClick={() => setActiveTab('species')}
            >
              Espèces
            </button>
          </div>

          {/* Contenu selon l'onglet actif */}
          {activeTab === 'species' ? (
            <div className={styles.competitions__species_tab}>
              {loadingSpecies ? (
                <div className={styles.competitions__loading}>Chargement des espèces...</div>
              ) : speciesData && speciesData.length > 0 ? (
                <>
                  <h2 className={styles.competitions__section_title}>Espèces disponibles</h2>
                  <div className={styles.competitions__species_list}>
                    {speciesData.map((compSpecies) => (
                      <div key={compSpecies.id} className={styles.competitions__species_card}>
                        <div className={styles.competitions__species_header}>
                          <h3 className={styles.competitions__species_name}>{compSpecies.name}</h3>
                          {compSpecies.isBonusEnabled && (
                            <span className={styles.competitions__species_bonus_badge}>Bonus</span>
                          )}
                        </div>
                        <div className={styles.competitions__species_info}>
                          <div className={styles.competitions__species_coefficient}>
                            Coefficient: {compSpecies.coefficient}
                          </div>
                          {compSpecies.basePoints !== undefined && compSpecies.basePoints !== null && (
                            <div className={styles.competitions__species_base_points}>
                              Points bonus: {compSpecies.basePoints}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className={styles.competitions__empty}>Aucune espèce configurée pour cette compétition</div>
              )}
            </div>
          ) : (
            <>
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
                {competition.isPaused && (
                  <div className={styles.competitions__paused_badge}>
                    ⏸️ Compétition en pause
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Actions admin */}
        {isAdmin && (
          <div className={styles.competitions__admin_actions}>
            <button
              className={`${styles.competitions__pause_btn} ${
                competition.isPaused
                  ? styles.competitions__resume_btn
                  : styles.competitions__pause_btn_active
              }`}
              onClick={handleTogglePause}
              disabled={pauseMutation.isPending}
            >
              {pauseMutation.isPending
                ? "..."
                : competition.isPaused
                ? "▶️ Reprendre la compétition"
                : "⏸️ Mettre en pause"}
            </button>
          </div>
        )}

        {/* Gestion des pauses programmées (admin uniquement) - masqué si compétition terminée */}
        {isAdmin && competition && !isCompetitionEnded && (
          <ScheduledPausesManager competitionId={competition.id} />
        )}

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
              // Masquer le message "pas d'équipe" si la compétition est terminée
              !isCompetitionEnded && (
                <div className={styles.competitions__no_teams}>
                  <p>Vous n'avez pas d'équipe disponible pour cette compétition.</p>
                  <button
                    onClick={() => router.push("/teams/create")}
                    className={styles.competitions__create_team_btn}
                  >
                    Créer une équipe
                  </button>
                </div>
              )
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
              // Masquer le message "pas d'équipe" si la compétition est terminée
              !isCompetitionEnded && (
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
              )
            )}
          </div>
        )}

        {competition.teams && competition.teams.length > 0 && (
          <div className={styles.competitions__teams_list}>
            <h2>
              {competition.isEnded && competition.isRankingPublic 
                ? "Classement final" 
                : competition.isRankingPublic
                ? "Classement"
                : isAdmin 
                ? "Classement (visible uniquement par les administrateurs)" 
                : "Votre équipe"}
            </h2>
            
            {!competition.isRankingPublic && !isAdmin && (
              <div className={styles.competitions__ranking_info}>
                <p>
                  🔒 Le classement n'a pas encore été publié par l'administrateur.
                  Vous pouvez actuellement voir uniquement votre équipe.
                </p>
              </div>
            )}
            
            {competition.isEnded && competition.isRankingPublic && (
              <div className={styles.competitions__ranking_info}>
                <p>
                  ✅ Compétition terminée - Classement final disponible
                </p>
              </div>
            )}
            
            {!competition.isEnded && competition.isRankingPublic && (
              <div className={styles.competitions__ranking_info}>
                <p>
                  📊 Classement publié par l'administrateur
                </p>
              </div>
            )}
            
            <div className={styles.competitions__teams_table_wrapper}>
              <table className={styles.competitions__teams_table}>
                <thead>
                  <tr>
                    {competition.isRankingPublic && <th className={styles.competitions__table_rank}>Rang</th>}
                    <th className={styles.competitions__table_name}>Équipe</th>
                    <th className={styles.competitions__table_number}>N°</th>
                    <th className={styles.competitions__table_members}>Membres</th>
                    <th className={styles.competitions__table_score}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Les équipes sont déjà filtrées et triées par le backend
                    let teamsToShow = competition.teams || [];
                    
                    // Trier par score décroissant (au cas où le backend ne l'aurait pas fait)
                    teamsToShow = [...teamsToShow].sort((a, b) => 
                      (b.totalScore || 0) - (a.totalScore || 0)
                    );
                    
                    return teamsToShow.map((team, index) => {
                      // Vérifier si cette équipe appartient à l'utilisateur connecté
                      const isUserTeam = currentUser && team.members && team.members.some(member => member.id === currentUser.id);
                      // Afficher le score si : classement public OU admin OU c'est l'équipe de l'utilisateur
                      const showScore = competition.isRankingPublic || isAdmin || isUserTeam;
                      
                      return (
                        <tr 
                          key={team.id} 
                          className={styles.competitions__table_row}
                          onClick={() => router.push(`/teams/${team.id}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          {competition.isRankingPublic && (
                            <td className={styles.competitions__table_rank}>
                              <span className={styles.competitions__rank_badge}>
                                #{index + 1}
                              </span>
                            </td>
                          )}
                          <td className={styles.competitions__table_name}>
                            <strong>{team.name}</strong>
                          </td>
                          <td className={styles.competitions__table_number}>
                            {team.registrationNumber || "-"}
                          </td>
                          <td className={styles.competitions__table_members}>
                            {team.members && team.members.length > 0 ? (
                              <div className={styles.competitions__members_list}>
                                {team.members.map((member, idx) => (
                                  <span key={member.id} className={styles.competitions__member_name}>
                                    {member.firstname}
                                    {idx < team.members.length - 1 && ", "}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className={styles.competitions__table_score}>
                            {showScore && team.totalScore !== null ? (
                              <span className={styles.competitions__score_value}>
                                {team.totalScore || 0} pts
                              </span>
                            ) : (
                              <span className={styles.competitions__score_value} style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                                {isUserTeam ? "Calcul en cours..." : "-"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Statistiques de la compétition */}
        {competition.isRankingPublic && stats && (
          <div className={styles.competitions__stats_section}>
            <h2>Statistiques de la compétition</h2>
            
            {loadingStats ? (
              <div className={styles.competitions__loading}>Chargement des statistiques...</div>
            ) : (
              <>
                {/* Résumé */}
                <div className={styles.competitions__stats_summary}>
                  <div className={styles.competitions__stat_card}>
                    <div className={styles.competitions__stat_label}>Total de poissons pêchés</div>
                    <div className={styles.competitions__stat_value}>{stats.totalCatches || 0}</div>
                  </div>
                </div>

                {/* Répartition par espèce avec graphique */}
                {stats.speciesStats && stats.speciesStats.length > 0 && (
                  <div className={styles.competitions__species_section}>
                    <div className={styles.competitions__chart_container}>
                      <SpeciesPieChart speciesStats={stats.speciesStats} />
                    </div>
                  </div>
                )}

                {/* Carte interactive des prises */}
                {stats.catchesForMap && stats.catchesForMap.length > 0 && (
                  <div className={styles.competitions__map_section}>
                    <CatchesMap 
                      catches={stats.catchesForMap} 
                      perimeters={competition.perimeters || []}
                    />
                  </div>
                )}

                {/* Top 3 par espèce */}
                {stats.top3BySpecies && Object.keys(stats.top3BySpecies).length > 0 && (
                  <div className={styles.competitions__top3_section}>
                    <h3>Top 3 des plus grands poissons par espèce</h3>
                    {Object.entries(stats.top3BySpecies).map(([speciesId, top3]) => {
                      const speciesInfo = stats.speciesStats?.find(s => s.id === parseInt(speciesId));
                      if (!speciesInfo || top3.length === 0) return null;
                      
                      return (
                        <div key={speciesId} className={styles.competitions__top3_species}>
                          <h4 className={styles.competitions__top3_species_title}>
                            {speciesInfo.name}
                          </h4>
                          <div className={styles.competitions__top3_list}>
                            {top3.map((catchItem, index) => (
                              <div key={catchItem.id} className={styles.competitions__top3_item}>
                                <div className={styles.competitions__top3_rank}>#{index + 1}</div>
                                <div className={styles.competitions__top3_details}>
                                  <div className={styles.competitions__top3_size}>
                                    {catchItem.size} cm - {catchItem.points} pts
                                  </div>
                                  <div className={styles.competitions__top3_team}>
                                    {catchItem.team.name}
                                    {catchItem.team.registrationNumber && ` (N° ${catchItem.team.registrationNumber})`}
                                  </div>
                                  {catchItem.caughtBy && (
                                    <div className={styles.competitions__top3_caught_by}>
                                      Pêché par : {catchItem.caughtBy.firstname} {catchItem.caughtBy.lastname}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
