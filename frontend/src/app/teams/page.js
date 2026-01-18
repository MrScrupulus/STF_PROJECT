"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { teamService } from "../../services/teamService";
import styles from "../../styles/pages/teams.module.scss";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import classNames from "classnames";
import layoutStyles from "../../styles/components/layout/layout.module.scss";
import { toast } from "react-hot-toast";

export default function TeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        // Utiliser getMyTeams pour récupérer uniquement les équipes de l'utilisateur connecté
        const response = await teamService.getMyTeams();
        const teamsData = response?.teams || [];
        setTeams(teamsData);
      } catch (error) {
        // Ne pas logger l'erreur complète pour éviter les problèmes de taille
        const errorMessage = error?.message || "Une erreur est survenue lors du chargement des équipes";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const handleReactivateTeam = async (teamId) => {
    if (!confirm("Voulez-vous réactiver cette équipe ? Le score sera réinitialisé à zéro pour la nouvelle compétition.")) {
      return;
    }

    try {
      await teamService.reactivate(teamId);
      toast.success("Équipe réactivée avec succès");
      // Recharger les équipes
      const response = await teamService.getMyTeams();
      const teamsData = response?.teams || [];
      setTeams(teamsData);
    } catch (error) {
      toast.error(error.message || "Erreur lors de la réactivation de l'équipe");
    }
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleLeaveTeam = async (teamId) => {
    if (!confirm("Êtes-vous sûr de vouloir quitter cette équipe ?")) {
      return;
    }

    try {
      await teamService.leaveTeam(teamId);
      toast.success("Vous avez quitté l'équipe avec succès");
      // Recharger les équipes
      const response = await teamService.getMyTeams();
      const teamsData = response?.teams || [];
      setTeams(teamsData);
    } catch (error) {
      toast.error(error.message || "Erreur lors de la sortie de l'équipe");
    }
  };

  if (isLoading) return <div className={styles.loading}>Chargement...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  const hasTeam = teams.length > 0;

  return (
    <div className={classNames(layoutStyles.main, layoutStyles.teams_page)}>
      <ProtectedRoute>
        <div className={styles.teams__container}>
          <div className={styles.teams__header}>
            <h1 className={styles.teams__title}>Mon Équipe</h1>
            {!hasTeam && (
              <button
                onClick={() => router.push("/teams/create")}
                className={styles.teams__create_btn}
              >
                Créer une équipe
              </button>
            )}
          </div>

          {teams.length === 0 ? (
            <div className={styles.teams__empty}>
              <p>Vous n'avez pas encore d'équipe.</p>
              <button
                onClick={() => router.push("/teams/create")}
                className={styles.teams__create_btn}
              >
                Créer une équipe
              </button>
            </div>
          ) : (
            <>
              {/* Équipes actives */}
              {teams.filter(t => t.isActive !== false).length > 0 && (
                <div className={styles.teams__section}>
                  <h2 className={styles.teams__section_title}>Équipes actives</h2>
                  <div className={styles.teams__grid}>
                    {teams.filter(t => t.isActive !== false).map((team) => (
                      <div key={team.id} className={styles.teams__card}>
                <div className={styles.teams__card_header}>
                  <h2 className={styles.teams__team_name}>{team.name}</h2>
                </div>

                <div className={styles.teams__card_content}>
                  <div className={styles.teams__members}>
                    {team.members?.map((member) => (
                      <div key={member.id} className={styles.teams__member}>
                        <div className={styles.teams__member_avatar}>
                          {getInitials(
                            (member.firstname || member.firstName || "") + " " + (member.lastname || member.lastName || "")
                          )}
                        </div>
                        <span className={styles.teams__member_name}>
                          {member.firstname || member.firstName} {member.lastname || member.lastName}
                        </span>
                      </div>
                    ))}
                  </div>

                  {team.competition && (
                    <div className={styles.teams__competition}>
                      <strong>Inscrite à :</strong>
                      <Link href={`/competitions/${team.competition.id}`} className={styles.teams__competition_link}>
                        {team.competition.name}
                      </Link>
                      {team.registrationNumber && (
                        <span className={styles.teams__registration_number}>
                          (N° {team.registrationNumber})
                        </span>
                      )}
                    </div>
                  )}

                  <div className={styles.teams__stats}>
                    <div className={styles.teams__stat}>
                      <div className={styles.teams__stat_value}>
                        {team.totalScore || 0}
                      </div>
                      <div className={styles.teams__stat_label}>Points</div>
                    </div>
                  </div>

                  <div className={styles.teams__actions}>
                    <Link
                      href={`/teams/${team.id}`}
                      className={`${styles.teams__action_btn} ${styles["teams__action_btn--view"]}`}
                    >
                      Voir les détails
                    </Link>
                    {team.competition && (
                      <Link
                        href={`/competitions/${team.competition.id}`}
                        className={`${styles.teams__action_btn} ${styles["teams__action_btn--view"]}`}
                      >
                        Voir la compétition
                      </Link>
                    )}
                    <button
                      onClick={() => handleLeaveTeam(team.id)}
                      className={`${styles.teams__action_btn} ${styles["teams__action_btn--leave"]}`}
                    >
                      Quitter l'équipe
                    </button>
                  </div>
                  </div>
                </div>
                ))}
                  </div>
                </div>
              )}

              {/* Équipes inactives */}
              {teams.filter(t => t.isActive === false).length > 0 && (
                <div className={styles.teams__section}>
                  <h2 className={styles.teams__section_title}>Équipes dissoutes</h2>
                  <div className={styles.teams__grid}>
                    {teams.filter(t => t.isActive === false).map((team) => (
                      <div key={team.id} className={`${styles.teams__card} ${styles["teams__card--inactive"]}`}>
                        <div className={styles.teams__card_header}>
                          <h2 className={styles.teams__team_name}>{team.name}</h2>
                          <span className={styles.teams__inactive_badge}>Dissoute</span>
                        </div>

                        <div className={styles.teams__card_content}>
                          <div className={styles.teams__members}>
                            {team.members?.map((member) => (
                              <div key={member.id} className={styles.teams__member}>
                                <div className={styles.teams__member_avatar}>
                                  {getInitials(
                                    (member.firstname || member.firstName || "") + " " + (member.lastname || member.lastName || "")
                                  )}
                                </div>
                                <span className={styles.teams__member_name}>
                                  {member.firstname || member.firstName} {member.lastname || member.lastName}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className={styles.teams__stats}>
                            <div className={styles.teams__stat}>
                              <div className={styles.teams__stat_value}>
                                {team.totalScore || 0}
                              </div>
                              <div className={styles.teams__stat_label}>Points (historique)</div>
                            </div>
                          </div>

                          <div className={styles.teams__actions}>
                            <button
                              onClick={() => handleReactivateTeam(team.id)}
                              className={`${styles.teams__action_btn} ${styles["teams__action_btn--reactivate"]}`}
                            >
                              Réactiver l'équipe
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ProtectedRoute>
    </div>
  );
}
